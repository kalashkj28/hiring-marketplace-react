import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import {
  SCHEMA_VERSION,
  CREATE_SYNC_STATE_TABLE,
  CREATE_RECORDS_TABLE,
  CREATE_INDEXES,
} from './schema';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
};

export interface DbState {
  db: duckdb.AsyncDuckDB;
  conn: duckdb.AsyncDuckDBConnection;
  isPersistent: boolean;
  dbPath: string;
}

let dbInstance: duckdb.AsyncDuckDB | null = null;
let connInstance: duckdb.AsyncDuckDBConnection | null = null;
let isPersistentStorage = false;
let activeDbPath = ':memory:';
let initPromise: Promise<DbState> | null = null;

// Convert BigInt to Number safely for Recharts & calculations
function sanitizeRowValue(value: unknown): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  return value;
}

export async function getDb(): Promise<DbState> {
  if (dbInstance && connInstance) {
    return {
      db: dbInstance,
      conn: connInstance,
      isPersistent: isPersistentStorage,
      dbPath: activeDbPath,
    };
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker!);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      // Attempt OPFS persistence (Chromium browsers)
      let opened = false;
      const opfsPath = 'opfs://hiring.duckdb';

      if (
        typeof navigator !== 'undefined' &&
        'storage' in navigator &&
        typeof navigator.storage.getDirectory === 'function'
      ) {
        try {
          await db.open({
            path: opfsPath,
            accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
          });
          isPersistentStorage = true;
          activeDbPath = opfsPath;
          opened = true;
          console.log('[DuckDB] Opened persistent OPFS database at', opfsPath);
        } catch (opfsErr) {
          console.warn('[DuckDB] OPFS open failed, falling back to in-memory:', opfsErr);
        }
      } else {
        console.warn('[DuckDB] OPFS getDirectory not available in this browser. Falling back to in-memory.');
      }

      if (!opened) {
        await db.open({
          path: ':memory:',
          accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
        });
        isPersistentStorage = false;
        activeDbPath = ':memory:';
        console.log('[DuckDB] Opened in-memory database (:memory:)');
      }

      const conn = await db.connect();

      // Configure durability if persistent
      if (isPersistentStorage) {
        try {
          await conn.query("SET checkpoint_threshold = '0KB';");
        } catch (chkErr) {
          console.warn('[DuckDB] Could not set checkpoint_threshold:', chErr(chkErr));
        }
      }

      // Check schema version and run migrations if needed
      await conn.query(CREATE_SYNC_STATE_TABLE);
      const verRes = await conn.query("SELECT value FROM sync_state WHERE key = 'schema_version'");
      const verRows = verRes.toArray();
      let currentVersion = 0;
      if (verRows.length > 0) {
        currentVersion = parseInt(verRows[0].toJSON().value || '0', 10);
      }

      if (currentVersion !== SCHEMA_VERSION) {
        console.log(`[DuckDB] Schema version mismatch (local: ${currentVersion}, target: ${SCHEMA_VERSION}). Rebuilding tables.`);
        await conn.query('DROP TABLE IF EXISTS records;');
        await conn.query(CREATE_RECORDS_TABLE);
        await conn.query(CREATE_INDEXES);
        await conn.query(`INSERT OR REPLACE INTO sync_state VALUES ('schema_version', '${SCHEMA_VERSION}');`);
      } else {
        await conn.query(CREATE_RECORDS_TABLE);
        await conn.query(CREATE_INDEXES);
      }

      // Startup diagnostic log (Step 1 requirement)
      const countRes = await conn.query('SELECT COUNT(*) AS total FROM records;');
      const countRows = countRes.toArray();
      const rowCount = countRows.length > 0 ? Number(countRows[0].toJSON().total) : 0;
      console.log(`[DuckDB Ready] Storage: ${isPersistentStorage ? 'OPFS (Persistent)' : 'Memory (Transient)'} | Total records on startup: ${rowCount.toLocaleString()}`);

      dbInstance = db;
      connInstance = conn;

      return {
        db,
        conn,
        isPersistent: isPersistentStorage,
        dbPath: activeDbPath,
      };
    } catch (err) {
      console.error('[DuckDB] Initialization failed:', err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

function chErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

// Strictly typed query helper
export async function runQuery<T = Record<string, unknown>>(
  sql: string
): Promise<T[]> {
  const { conn } = await getDb();
  const result = await conn.query(sql);
  const rows = result.toArray();
  return rows.map((row) => {
    const json = row.toJSON();
    const cleanRow: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(json)) {
      cleanRow[k] = sanitizeRowValue(v);
    }
    return cleanRow as T;
  });
}

// Reset local tables (Step 6 debugging / edge cases)
export async function resetLocalDb(): Promise<void> {
  const { conn, isPersistent } = await getDb();
  console.log('[DuckDB] Resetting local database tables...');
  await conn.query('DROP TABLE IF EXISTS records;');
  await conn.query('DELETE FROM sync_state;');
  await conn.query(CREATE_RECORDS_TABLE);
  await conn.query(CREATE_INDEXES);
  await conn.query(`INSERT INTO sync_state VALUES ('schema_version', '${SCHEMA_VERSION}');`);
  if (isPersistent) {
    await conn.query('CHECKPOINT;');
  }
}
