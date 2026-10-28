import Papa from 'papaparse';
import { FunnelRecord } from '../types/dashboard';

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/133YLXhIn7FRXdStSckbObZWCYcNTZZq87FZevoWSgKY/export?format=csv';

export async function fetchFunnelData(): Promise<FunnelRecord[]> {
  try {
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          const records: FunnelRecord[] = results.data
            .filter((row) => row.view_id || row.seeker_id || row.city)
            .map((row) => ({
              view_id: row.view_id || '',
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
              hours_to_first_response:
                row.hours_to_first_response !== '' && row.hours_to_first_response != null
                  ? parseFloat(row.hours_to_first_response)
                  : null,
            }));
          resolve(records);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  } catch (err) {
    console.error('Failed to load Google Sheet data:', err);
    throw err;
  }
}
