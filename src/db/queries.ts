import { FilterState, HeadlineMetrics, FunnelStageItem, WeeklyTrendItem, CityMetricItem, CategoryMetricItem, VerifiedMetricItem, ChannelMetricItem, DayTypeMetricItem, NagpurWeeklyItem, SalaryBandItem } from '../types/dashboard';
import { runQuery } from './client';

export function buildWhereClause(filters: FilterState): string {
  const conditions: string[] = ['1=1'];
  if (filters.startDate) conditions.push(`view_date >= '${filters.startDate}'`);
  if (filters.endDate) conditions.push(`view_date <= '${filters.endDate}'`);
  if (filters.cityTier !== 'All') conditions.push(`city_tier = '${filters.cityTier.replace(/'/g, "''")}'`);
  if (filters.city !== 'All') conditions.push(`city = '${filters.city.replace(/'/g, "''")}'`);
  if (filters.language !== 'All') conditions.push(`language = '${filters.language.replace(/'/g, "''")}'`);
  if (filters.category !== 'All') conditions.push(`category = '${filters.category.replace(/'/g, "''")}'`);
  if (filters.channel !== 'All') conditions.push(`acquisition_channel = '${filters.channel.replace(/'/g, "''")}'`);
  return conditions.join(' AND ');
}

export interface UniqueFilterValues {
  tiers: string[];
  cities: string[];
  languages: string[];
  categories: string[];
  channels: string[];
  minDate: string;
  maxDate: string;
}

export async function fetchUniqueFilterValues(): Promise<UniqueFilterValues> {
  const [tiersRes, citiesRes, langsRes, catsRes, chansRes, datesRes] = await Promise.all([
    runQuery<{ city_tier: string }>('SELECT DISTINCT city_tier FROM records WHERE city_tier IS NOT NULL AND city_tier != \'\' ORDER BY city_tier;'),
    runQuery<{ city: string }>('SELECT DISTINCT city FROM records WHERE city IS NOT NULL AND city != \'\' ORDER BY city;'),
    runQuery<{ language: string }>('SELECT DISTINCT language FROM records WHERE language IS NOT NULL AND language != \'\' ORDER BY language;'),
    runQuery<{ category: string }>('SELECT DISTINCT category FROM records WHERE category IS NOT NULL AND category != \'\' ORDER BY category;'),
    runQuery<{ acquisition_channel: string }>('SELECT DISTINCT acquisition_channel FROM records WHERE acquisition_channel IS NOT NULL AND acquisition_channel != \'\' ORDER BY acquisition_channel;'),
    runQuery<{ min_date: string; max_date: string }>('SELECT MIN(view_date) AS min_date, MAX(view_date) AS max_date FROM records WHERE view_date != \'\';'),
  ]);

  return {
    tiers: tiersRes.map((r) => r.city_tier),
    cities: citiesRes.map((r) => r.city),
    languages: langsRes.map((r) => r.language),
    categories: catsRes.map((r) => r.category),
    channels: chansRes.map((r) => r.acquisition_channel),
    minDate: datesRes[0]?.min_date || '',
    maxDate: datesRes[0]?.max_date || '',
  };
}

interface RawHeadlineQueryRow {
  views: number;
  applications: number;
  recruiter_views: number;
  responded: number;
  interviews: number;
  hires: number;
  total_hours: number | null;
  hours_count: number;
}

export async function queryHeadlineMetrics(filters: FilterState): Promise<HeadlineMetrics> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      COUNT(*) AS views,
      COALESCE(SUM(applied), 0) AS applications,
      COALESCE(SUM(recruiter_viewed), 0) AS recruiter_views,
      COALESCE(SUM(responded), 0) AS responded,
      COALESCE(SUM(interviewed), 0) AS interviews,
      COALESCE(SUM(hired), 0) AS hires,
      SUM(CASE WHEN hours_to_first_response IS NOT NULL THEN hours_to_first_response ELSE 0 END) AS total_hours,
      COUNT(hours_to_first_response) AS hours_count
    FROM records
    WHERE ${where};
  `;

  const rows = await runQuery<RawHeadlineQueryRow>(sql);
  const r = rows[0] || {
    views: 0,
    applications: 0,
    recruiter_views: 0,
    responded: 0,
    interviews: 0,
    hires: 0,
    total_hours: 0,
    hours_count: 0,
  };

  const views = Number(r.views);
  const applications = Number(r.applications);
  const recruiterViews = Number(r.recruiter_views);
  const responded = Number(r.responded);
  const interviews = Number(r.interviews);
  const hires = Number(r.hires);
  const totalHours = Number(r.total_hours || 0);
  const hoursCount = Number(r.hours_count);

  const viewToApplyPct = views > 0 ? Number(((applications / views) * 100).toFixed(1)) : 0;
  const responseRatePct = applications > 0 ? Number(((responded / applications) * 100).toFixed(1)) : 0;
  const hireRatePct = applications > 0 ? Number(((hires / applications) * 100).toFixed(1)) : 0;
  const avgHoursToRespond = hoursCount > 0 ? Number((totalHours / hoursCount).toFixed(1)) : 0;

  return {
    views,
    applications,
    recruiterViews,
    responded,
    interviews,
    hires,
    viewToApplyPct,
    responseRatePct,
    hireRatePct,
    avgHoursToRespond,
  };
}

export function buildFunnelStages(metrics: HeadlineMetrics): FunnelStageItem[] {
  const views = metrics.views;
  const stages: { stage: string; count: number; color: string }[] = [
    { stage: 'Viewed', count: views, color: '#264653' },
    { stage: 'Applied', count: metrics.applications, color: '#2a9d8f' },
    { stage: 'Recruiter Viewed', count: metrics.recruiterViews, color: '#52b788' },
    { stage: 'Responded', count: metrics.responded, color: '#e9c46a' },
    { stage: 'Interviewed', count: metrics.interviews, color: '#f4a261' },
    { stage: 'Hired', count: metrics.hires, color: '#e76f51' },
  ];

  return stages.map((s) => ({
    stage: s.stage,
    count: s.count,
    pctOfViews: views > 0 ? Number(((s.count / views) * 100).toFixed(1)) : 0,
    color: s.color,
  }));
}

interface RawWeeklyTrendRow {
  week: string;
  views: number;
  applications: number;
  responded: number;
}

export async function queryWeeklyTrends(filters: FilterState): Promise<WeeklyTrendItem[]> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      view_week AS week,
      COUNT(*) AS views,
      COALESCE(SUM(applied), 0) AS applications,
      COALESCE(SUM(responded), 0) AS responded
    FROM records
    WHERE ${where} AND view_week != ''
    GROUP BY view_week
    ORDER BY view_week ASC;
  `;

  const rows = await runQuery<RawWeeklyTrendRow>(sql);
  return rows.map((r) => {
    const views = Number(r.views);
    const applies = Number(r.applications);
    const responded = Number(r.responded);
    const viewToApplyPct = views > 0 ? Number(((applies / views) * 100).toFixed(1)) : 0;
    const responseRatePct = applies > 0 ? Number(((responded / applies) * 100).toFixed(1)) : 0;
    return {
      week: r.week,
      views,
      applications: applies,
      viewToApplyPct,
      responseRatePct,
    };
  });
}

interface RawCityRow {
  city: string;
  tier: string;
  views: number;
  applications: number;
  responses: number;
  hires: number;
}

export async function queryCityBreakdown(filters: FilterState): Promise<CityMetricItem[]> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      city,
      MAX(city_tier) AS tier,
      COUNT(*) AS views,
      COALESCE(SUM(applied), 0) AS applications,
      COALESCE(SUM(responded), 0) AS responses,
      COALESCE(SUM(hired), 0) AS hires
    FROM records
    WHERE ${where} AND city != ''
    GROUP BY city;
  `;

  const rows = await runQuery<RawCityRow>(sql);
  const result: CityMetricItem[] = rows.map((r) => {
    const views = Number(r.views);
    const applications = Number(r.applications);
    const responses = Number(r.responses);
    const hires = Number(r.hires);
    const viewToApplyPct = views > 0 ? Number(((applications / views) * 100).toFixed(1)) : 0;
    const responseRatePct = applications > 0 ? Number(((responses / applications) * 100).toFixed(1)) : 0;
    const hireRatePct = applications > 0 ? Number(((hires / applications) * 100).toFixed(1)) : 0;
    return {
      city: r.city,
      tier: r.tier,
      views,
      applications,
      viewToApplyPct,
      responseRatePct,
      hireRatePct,
    };
  });

  return result.sort((a, b) => a.viewToApplyPct - b.viewToApplyPct);
}

interface RawTierRow {
  tier: string;
  views: number;
  applications: number;
}

export async function queryTierBreakdown(filters: FilterState) {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      city_tier AS tier,
      COUNT(*) AS views,
      COALESCE(SUM(applied), 0) AS applications
    FROM records
    WHERE ${where} AND city_tier IN ('Tier-2', 'Tier-3')
    GROUP BY city_tier;
  `;

  const rows = await runQuery<RawTierRow>(sql);
  const map = new Map<string, { views: number; applications: number }>();
  for (const r of rows) {
    map.set(r.tier, { views: Number(r.views), applications: Number(r.applications) });
  }

  return ['Tier-2', 'Tier-3'].map((tier) => {
    const d = map.get(tier) || { views: 0, applications: 0 };
    const pct = d.views > 0 ? Number(((d.applications / d.views) * 100).toFixed(1)) : 0;
    return {
      tier,
      viewToApplyPct: pct,
      color: tier === 'Tier-2' ? '#2a9d8f' : '#e76f51',
    };
  });
}

interface RawCategoryRow {
  category: string;
  applications: number;
  responses: number;
  total_hours: number | null;
  hours_count: number;
}

export async function queryCategoryBreakdown(filters: FilterState): Promise<CategoryMetricItem[]> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      category,
      COALESCE(SUM(applied), 0) AS applications,
      COALESCE(SUM(responded), 0) AS responses,
      SUM(CASE WHEN hours_to_first_response IS NOT NULL THEN hours_to_first_response ELSE 0 END) AS total_hours,
      COUNT(hours_to_first_response) AS hours_count
    FROM records
    WHERE ${where} AND category != ''
    GROUP BY category;
  `;

  const rows = await runQuery<RawCategoryRow>(sql);
  return rows.map((r) => {
    const applies = Number(r.applications);
    const responses = Number(r.responses);
    const totalHours = Number(r.total_hours || 0);
    const countHours = Number(r.hours_count);
    const responseRatePct = applies > 0 ? Number(((responses / applies) * 100).toFixed(1)) : 0;
    const avgHours = countHours > 0 ? Number((totalHours / countHours).toFixed(1)) : 0;
    return {
      category: r.category,
      applications: applies,
      responses,
      responseRatePct,
      avgHours,
    };
  });
}

interface RawVerifiedRow {
  status: string;
  applications: number;
  responses: number;
  hires: number;
}

export async function queryVerifiedBreakdown(filters: FilterState): Promise<VerifiedMetricItem[]> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      CASE WHEN employer_verified = 'Yes' THEN 'Verified' ELSE 'Unverified' END AS status,
      COALESCE(SUM(applied), 0) AS applications,
      COALESCE(SUM(responded), 0) AS responses,
      COALESCE(SUM(hired), 0) AS hires
    FROM records
    WHERE ${where}
    GROUP BY status;
  `;

  const rows = await runQuery<RawVerifiedRow>(sql);
  const map = new Map<string, { applications: number; responses: number; hires: number }>();
  for (const r of rows) {
    map.set(r.status, {
      applications: Number(r.applications),
      responses: Number(r.responses),
      hires: Number(r.hires),
    });
  }

  return ['Verified', 'Unverified'].map((status) => {
    const d = map.get(status) || { applications: 0, responses: 0, hires: 0 };
    const resp = d.applications > 0 ? Number(((d.responses / d.applications) * 100).toFixed(1)) : 0;
    const hire = d.applications > 0 ? Number(((d.hires / d.applications) * 100).toFixed(1)) : 0;
    return {
      status,
      responseRatePct: resp,
      hireRatePct: hire,
    };
  });
}

interface RawChannelRow {
  channel: string;
  views: number;
  applications: number;
}

export async function queryChannelBreakdown(filters: FilterState): Promise<ChannelMetricItem[]> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      acquisition_channel AS channel,
      COUNT(*) AS views,
      COALESCE(SUM(applied), 0) AS applications
    FROM records
    WHERE ${where} AND acquisition_channel != ''
    GROUP BY acquisition_channel;
  `;

  const rows = await runQuery<RawChannelRow>(sql);
  const result = rows.map((r) => {
    const views = Number(r.views);
    const applies = Number(r.applications);
    const viewToApplyPct = views > 0 ? Number(((applies / views) * 100).toFixed(1)) : 0;
    return {
      channel: r.channel,
      views,
      applications: applies,
      viewToApplyPct,
    };
  });

  return result.sort((a, b) => a.viewToApplyPct - b.viewToApplyPct);
}

interface RawDayTypeRow {
  day_type: string;
  applications: number;
  responses: number;
  total_hours: number | null;
  hours_count: number;
}

export async function queryDayTypeBreakdown(filters: FilterState): Promise<DayTypeMetricItem[]> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      posted_day_type AS day_type,
      COALESCE(SUM(applied), 0) AS applications,
      COALESCE(SUM(responded), 0) AS responses,
      SUM(CASE WHEN hours_to_first_response IS NOT NULL THEN hours_to_first_response ELSE 0 END) AS total_hours,
      COUNT(hours_to_first_response) AS hours_count
    FROM records
    WHERE ${where} AND posted_day_type IN ('Weekday', 'Weekend')
    GROUP BY posted_day_type;
  `;

  const rows = await runQuery<RawDayTypeRow>(sql);
  const map = new Map<string, { applications: number; responses: number; total_hours: number; hours_count: number }>();
  for (const r of rows) {
    map.set(r.day_type, {
      applications: Number(r.applications),
      responses: Number(r.responses),
      total_hours: Number(r.total_hours || 0),
      hours_count: Number(r.hours_count),
    });
  }

  return ['Weekday', 'Weekend'].map((dayType) => {
    const d = map.get(dayType) || { applications: 0, responses: 0, total_hours: 0, hours_count: 0 };
    const resp = d.applications > 0 ? Number(((d.responses / d.applications) * 100).toFixed(1)) : 0;
    const avgH = d.hours_count > 0 ? Number((d.total_hours / d.hours_count).toFixed(1)) : 0;
    return {
      dayType,
      responseRatePct: resp,
      avgHours: avgH,
    };
  });
}

interface RawNagpurRow {
  week: string;
  views: number;
  applications: number;
}

// Nagpur trend is computed across all raw records
export async function queryNagpurTrend(): Promise<NagpurWeeklyItem[]> {
  const sql = `
    SELECT
      view_week AS week,
      COUNT(*) AS views,
      COALESCE(SUM(applied), 0) AS applications
    FROM records
    WHERE city = 'Nagpur' AND view_week != ''
    GROUP BY view_week
    ORDER BY view_week ASC;
  `;

  const rows = await runQuery<RawNagpurRow>(sql);
  return rows.map((r) => {
    const views = Number(r.views);
    const applies = Number(r.applications);
    const viewToApplyPct = views > 0 ? Number(((applies / views) * 100).toFixed(1)) : 0;
    const isDip = r.week.includes('2026-07-13') || r.week.includes('2026-07-20');
    return {
      week: r.week,
      applications: applies,
      viewToApplyPct,
      isDip,
    };
  });
}

interface RawSalaryBandRow {
  band: string;
  views: number;
  applications: number;
}

export async function querySalaryBandBreakdown(filters: FilterState): Promise<SalaryBandItem[]> {
  const order = ['<12k', '12-18k', '18-25k', '25k+'];
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      salary_band AS band,
      COUNT(*) AS views,
      COALESCE(SUM(applied), 0) AS applications
    FROM records
    WHERE ${where} AND salary_band != ''
    GROUP BY salary_band;
  `;

  const rows = await runQuery<RawSalaryBandRow>(sql);
  const map = new Map<string, { views: number; applications: number }>();
  for (const r of rows) {
    map.set(r.band, { views: Number(r.views), applications: Number(r.applications) });
  }

  return order.map((band) => {
    const d = map.get(band) || { views: 0, applications: 0 };
    const vta = d.views > 0 ? Number(((d.applications / d.views) * 100).toFixed(1)) : 0;
    return {
      band,
      viewToApplyPct: vta,
    };
  });
}

export async function queryFilteredRecordsForExport(filters: FilterState): Promise<Record<string, unknown>[]> {
  const where = buildWhereClause(filters);
  const sql = `
    SELECT
      id,
      view_date,
      city,
      city_tier,
      language,
      category,
      salary_band,
      posted_day_type,
      employer_verified,
      acquisition_channel,
      applied,
      recruiter_viewed,
      responded,
      interviewed,
      hired,
      hours_to_first_response
    FROM records
    WHERE ${where}
    ORDER BY view_date ASC;
  `;
  return runQuery(sql);
}

export async function getTableRowCount(): Promise<number> {
  const rows = await runQuery<{ count: number }>('SELECT COUNT(*) AS count FROM records;');
  return rows[0] ? Number(rows[0].count) : 0;
}
