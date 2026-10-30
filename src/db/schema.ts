export const SCHEMA_VERSION = 1;

export const CREATE_SYNC_STATE_TABLE = `
CREATE TABLE IF NOT EXISTS sync_state (
  key VARCHAR PRIMARY KEY,
  value VARCHAR
);
`;

export const CREATE_RECORDS_TABLE = `
CREATE TABLE IF NOT EXISTS records (
  id VARCHAR PRIMARY KEY,
  journey_id VARCHAR,
  view_id VARCHAR,
  seeker_id VARCHAR,
  job_id VARCHAR,
  employer_id VARCHAR,
  view_date VARCHAR,
  view_week VARCHAR,
  city VARCHAR,
  city_tier VARCHAR,
  language VARCHAR,
  category VARCHAR,
  salary_band VARCHAR,
  posted_day_type VARCHAR,
  employer_verified VARCHAR,
  acquisition_channel VARCHAR,
  applied INTEGER,
  recruiter_viewed INTEGER,
  responded INTEGER,
  interviewed INTEGER,
  hired INTEGER,
  hours_to_first_response DOUBLE,
  furthest_stage VARCHAR,
  updated_at VARCHAR
);
`;

// Indexes for fast interactive filtering
export const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_records_view_date ON records(view_date);
CREATE INDEX IF NOT EXISTS idx_records_city ON records(city);
CREATE INDEX IF NOT EXISTS idx_records_city_tier ON records(city_tier);
CREATE INDEX IF NOT EXISTS idx_records_category ON records(category);
CREATE INDEX IF NOT EXISTS idx_records_channel ON records(acquisition_channel);
`;
