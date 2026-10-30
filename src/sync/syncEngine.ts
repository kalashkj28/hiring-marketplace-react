import Papa from 'papaparse';
import { getDb } from '../db/client';
import { getTableRowCount } from '../db/queries';

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/133YLXhIn7FRXdStSckbObZWCYcNTZZq87FZevoWSgKY/export?format=csv';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncResult {
  status: 'synced' | 'unchanged' | 'offline' | 'error';
  rowCount: number;
  lastSyncedAt: string;
  error?: string;
}

export interface SyncOptions {
  forceReload?: boolean;
  bypassHashCheck?: boolean;
  force?: boolean;
}

export async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface ParsedRow {
  id: string;
  journey_id: string;
  view_id: string;
  seeker_id: string;
  job_id: string;
  employer_id: string;
  view_date: string;
  view_week: string;
  city: string;
  city_tier: string;
  language: string;
  category: string;
  salary_band: string;
  posted_day_type: string;
  employer_verified: string;
  acquisition_channel: string;
  applied: number;
  recruiter_viewed: number;
  responded: number;
  interviewed: number;
  hired: number;
  hours_to_first_response: number | null;
  furthest_stage: string;
}

function escapeSql(val: string | null | undefined): string {
  if (val === null || val === undefined) return "''";
  return `'${String(val).replace(/'/g, "''")}'`;
}

function rowToSqlValues(r: ParsedRow, updatedAt: string): string {
  const hrs = r.hours_to_first_response !== null && !isNaN(r.hours_to_first_response)
    ? r.hours_to_first_response
    : 'NULL';

  return `(${escapeSql(r.id)}, ${escapeSql(r.journey_id)}, ${escapeSql(r.view_id)}, ${escapeSql(r.seeker_id)}, ${escapeSql(r.job_id)}, ${escapeSql(r.employer_id)}, ${escapeSql(r.view_date)}, ${escapeSql(r.view_week)}, ${escapeSql(r.city)}, ${escapeSql(r.city_tier)}, ${escapeSql(r.language)}, ${escapeSql(r.category)}, ${escapeSql(r.salary_band)}, ${escapeSql(r.posted_day_type)}, ${escapeSql(r.employer_verified)}, ${escapeSql(r.acquisition_channel)}, ${r.applied}, ${r.recruiter_viewed}, ${r.responded}, ${r.interviewed}, ${r.hired}, ${hrs}, ${escapeSql(r.furthest_stage)}, ${escapeSql(updatedAt)})`;
}

async function batchInsert(
  conn: any,
  tableName: string,
  rows: ParsedRow[],
  updatedAt: string,
  batchSize = 1200
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const valuesSql = chunk.map((r) => rowToSqlValues(r, updatedAt)).join(',\n');
    await conn.query(`INSERT INTO ${tableName} VALUES ${valuesSql};`);
  }
}

export async function getSyncMetadata(): Promise<{
  lastSyncedAt: string;
  contentHash: string;
  rowCount: number;
}> {
  const { conn } = await getDb();
  const res = await conn.query('SELECT key, value FROM sync_state;');
  const rows = res.toArray();
  const map = new Map<string, string>();
  for (const r of rows) {
    const j = r.toJSON();
    map.set(j.key, j.value);
  }

  return {
    lastSyncedAt: map.get('last_synced_at') || '',
    contentHash: map.get('content_hash') || '',
    rowCount: parseInt(map.get('row_count') || '0', 10),
  };
}

let inFlightSyncPromise: Promise<SyncResult> | null = null;

export async function syncFromGoogleSheet(
  options?: SyncOptions | { force?: boolean }
): Promise<SyncResult> {
  if (inFlightSyncPromise) {
    console.log('[SyncEngine] Sync already in progress. Returning active in-flight sync promise.');
    return inFlightSyncPromise;
  }

  inFlightSyncPromise = (async () => {
    try {
      return await executeSync(options);
    } finally {
      inFlightSyncPromise = null;
    }
  })();

  return inFlightSyncPromise;
}

async function executeSync(options?: SyncOptions | { force?: boolean }): Promise<SyncResult> {
  const isForceReload = !!(options && ('forceReload' in options ? options.forceReload : options.force));
  const isBypassHashCheck = !!(options && 'bypassHashCheck' in options && options.bypassHashCheck);

  const { conn, isPersistent } = await getDb();
  const initialCount = await getTableRowCount();
  const now = new Date().toISOString();

  // If browser is offline, return offline state without wiping local data
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[SyncEngine] Browser is offline. Keeping existing local data.');
    const meta = await getSyncMetadata();
    return {
      status: 'offline',
      rowCount: initialCount || meta.rowCount,
      lastSyncedAt: meta.lastSyncedAt,
    };
  }

  let csvText: string;
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`Google Sheets responded with HTTP ${response.status}`);
    }
    csvText = await response.text();
  } catch (fetchErr: any) {
    console.warn('[SyncEngine] Network fetch failed:', fetchErr);
    const meta = await getSyncMetadata();
    return {
      status: 'offline',
      rowCount: initialCount || meta.rowCount,
      lastSyncedAt: meta.lastSyncedAt,
      error: fetchErr?.message || 'Network request failed',
    };
  }

  const newHash = await computeSha256(csvText);
  const currentMeta = await getSyncMetadata();

  // Fast path: if content hash matches, table is populated, and no force/bypass requested, update timestamp only
  if (currentMeta.contentHash === newHash && initialCount > 0 && !isForceReload && !isBypassHashCheck) {
    console.log('[SyncEngine] CSV content hash unchanged. Updating last_synced_at timestamp.');
    await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('last_synced_at', '${now}');`);
    if (isPersistent) {
      await conn.query('CHECKPOINT;');
    }
    return {
      status: 'unchanged',
      rowCount: initialCount,
      lastSyncedAt: now,
    };
  }

  // Parse CSV
  const parsedRecords: ParsedRow[] = await new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = results.data
          .filter((row) => row.journey_id || row.view_id || row.seeker_id || row.city)
          .map((row, index) => {
            let rowId = (row.journey_id || row.view_id || '').trim();
            if (!rowId) {
              // Deterministic synthetic fallback if both journey_id and view_id are blank
              const naturalKey = `${row.view_date}_${row.city}_${row.seeker_id}_${row.job_id}_${row.category}_${index}`;
              rowId = `row_${naturalKey}`;
            }

            const hrs =
              row.hours_to_first_response !== '' && row.hours_to_first_response != null
                ? parseFloat(row.hours_to_first_response)
                : null;

            return {
              id: rowId,
              journey_id: row.journey_id || rowId,
              view_id: row.view_id || rowId,
              seeker_id: row.seeker_id || '',
              job_id: row.job_id || '',
              employer_id: row.employer_id || '',
              view_date: row.view_date ? row.view_date.split(' ')[0] : '',
              view_week: row.view_week ? row.view_week.split(' ')[0] : '',
              city: row.city || 'Unknown',
              city_tier: row.city_tier || 'Tier-3',
              language: row.language || 'Hindi',
              category: row.category || 'General',
              salary_band: row.salary_band || '<12k',
              posted_day_type: row.posted_day_type || 'Weekday',
              employer_verified: row.employer_verified || 'No',
              acquisition_channel: row.acquisition_channel || 'Direct',
              applied: Number(row.applied) === 1 ? 1 : 0,
              recruiter_viewed: Number(row.recruiter_viewed) === 1 ? 1 : 0,
              responded: Number(row.responded) === 1 ? 1 : 0,
              interviewed: Number(row.interviewed) === 1 ? 1 : 0,
              hired: Number(row.hired) === 1 ? 1 : 0,
              hours_to_first_response: hrs,
              furthest_stage: row.furthest_stage || 'Viewed',
            };
          });
        resolve(rows);
      },
      error: (err: Error) => reject(err),
    });
  });

  console.log(`[SyncEngine] Parsed ${parsedRecords.length.toLocaleString()} rows from Sheet.`);

  // If local DB is empty or explicit force reload requested (Full Load path)
  if (initialCount === 0 || isForceReload) {
    console.log('[SyncEngine] Populating initial records table (Full Load)...');
    await conn.query('BEGIN TRANSACTION;');
    try {
      await conn.query('DELETE FROM records;');
      await batchInsert(conn, 'records', parsedRecords, now);
      await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('content_hash', '${newHash}');`);
      await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('last_synced_at', '${now}');`);
      await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('row_count', '${parsedRecords.length}');`);
      await conn.query('COMMIT;');
    } catch (insertErr) {
      await conn.query('ROLLBACK;');
      throw insertErr;
    }
  } else {
    // Incremental diff sync inside a single transaction (Diffing path)
    console.log('[SyncEngine] Performing incremental diff sync via temp table...');
    await conn.query('CREATE TEMP TABLE temp_incoming AS SELECT * FROM records WHERE 1=0;');
    try {
      await batchInsert(conn, 'temp_incoming', parsedRecords, now);

      await conn.query('BEGIN TRANSACTION;');
      // 1. Delete rows no longer present in sheet
      await conn.query('DELETE FROM records WHERE id NOT IN (SELECT id FROM temp_incoming);');

      // 2. Update existing modified rows comparing all relevant data columns
      await conn.query(`
        UPDATE records SET
          journey_id = temp_incoming.journey_id,
          view_id = temp_incoming.view_id,
          seeker_id = temp_incoming.seeker_id,
          job_id = temp_incoming.job_id,
          employer_id = temp_incoming.employer_id,
          view_date = temp_incoming.view_date,
          view_week = temp_incoming.view_week,
          city = temp_incoming.city,
          city_tier = temp_incoming.city_tier,
          language = temp_incoming.language,
          category = temp_incoming.category,
          salary_band = temp_incoming.salary_band,
          posted_day_type = temp_incoming.posted_day_type,
          employer_verified = temp_incoming.employer_verified,
          acquisition_channel = temp_incoming.acquisition_channel,
          applied = temp_incoming.applied,
          recruiter_viewed = temp_incoming.recruiter_viewed,
          responded = temp_incoming.responded,
          interviewed = temp_incoming.interviewed,
          hired = temp_incoming.hired,
          hours_to_first_response = temp_incoming.hours_to_first_response,
          furthest_stage = temp_incoming.furthest_stage,
          updated_at = '${now}'
        FROM temp_incoming
        WHERE records.id = temp_incoming.id
          AND (
            records.journey_id IS DISTINCT FROM temp_incoming.journey_id OR
            records.view_id IS DISTINCT FROM temp_incoming.view_id OR
            records.seeker_id IS DISTINCT FROM temp_incoming.seeker_id OR
            records.job_id IS DISTINCT FROM temp_incoming.job_id OR
            records.employer_id IS DISTINCT FROM temp_incoming.employer_id OR
            records.view_date IS DISTINCT FROM temp_incoming.view_date OR
            records.view_week IS DISTINCT FROM temp_incoming.view_week OR
            records.city IS DISTINCT FROM temp_incoming.city OR
            records.city_tier IS DISTINCT FROM temp_incoming.city_tier OR
            records.language IS DISTINCT FROM temp_incoming.language OR
            records.category IS DISTINCT FROM temp_incoming.category OR
            records.salary_band IS DISTINCT FROM temp_incoming.salary_band OR
            records.posted_day_type IS DISTINCT FROM temp_incoming.posted_day_type OR
            records.employer_verified IS DISTINCT FROM temp_incoming.employer_verified OR
            records.acquisition_channel IS DISTINCT FROM temp_incoming.acquisition_channel OR
            records.applied IS DISTINCT FROM temp_incoming.applied OR
            records.recruiter_viewed IS DISTINCT FROM temp_incoming.recruiter_viewed OR
            records.responded IS DISTINCT FROM temp_incoming.responded OR
            records.interviewed IS DISTINCT FROM temp_incoming.interviewed OR
            records.hired IS DISTINCT FROM temp_incoming.hired OR
            records.hours_to_first_response IS DISTINCT FROM temp_incoming.hours_to_first_response OR
            records.furthest_stage IS DISTINCT FROM temp_incoming.furthest_stage
          );
      `);

      // 3. Insert newly added rows
      await conn.query(`
        INSERT INTO records
        SELECT * FROM temp_incoming
        WHERE id NOT IN (SELECT id FROM records);
      `);

      // 4. Update sync state
      await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('content_hash', '${newHash}');`);
      await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('last_synced_at', '${now}');`);
      await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('row_count', '${parsedRecords.length}');`);

      await conn.query('COMMIT;');
      await conn.query('DROP TABLE temp_incoming;');
    } catch (diffErr) {
      await conn.query('ROLLBACK;');
      await conn.query('DROP TABLE IF EXISTS temp_incoming;');
      throw diffErr;
    }
  }

  // Ensure durability to OPFS file
  if (isPersistent) {
    try {
      await conn.query('CHECKPOINT;');
    } catch (chkErr) {
      console.warn('[SyncEngine] Checkpoint warning:', chkErr);
    }
  }

  const finalCount = await getTableRowCount();
  console.log(`[SyncEngine] Sync completed successfully. Final count: ${finalCount.toLocaleString()} records.`);

  return {
    status: 'synced',
    rowCount: finalCount,
    lastSyncedAt: now,
  };
}
