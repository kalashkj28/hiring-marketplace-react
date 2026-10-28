export interface FunnelRecord {
  view_id: string;
  seeker_id: string;
  job_id: string;
  employer_id: string;
  view_date: string;
  view_week: string;
  city: string;
  city_tier: 'Tier-2' | 'Tier-3' | string;
  language: string;
  category: string;
  salary_band: string;
  posted_day_type: 'Weekday' | 'Weekend' | string;
  employer_verified: 'Yes' | 'No' | string;
  acquisition_channel: string;
  applied: number;
  recruiter_viewed: number;
  responded: number;
  interviewed: number;
  hired: number;
  hours_to_first_response: number | null;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  cityTier: string;
  city: string;
  language: string;
  category: string;
  channel: string;
}

export interface HeadlineMetrics {
  views: number;
  applications: number;
  recruiterViews: number;
  responded: number;
  interviews: number;
  hires: number;
  viewToApplyPct: number;
  responseRatePct: number;
  hireRatePct: number;
  avgHoursToRespond: number;
  within24hPct: number;
}

export interface FunnelStageItem {
  stage: string;
  count: number;
  pctOfViews: number;
  color: string;
}

export interface WeeklyTrendItem {
  week: string;
  views: number;
  applications: number;
  viewToApplyPct: number;
  responseRatePct: number;
}

export interface CityMetricItem {
  city: string;
  tier: string;
  views: number;
  applications: number;
  viewToApplyPct: number;
  responseRatePct: number;
  hireRatePct: number;
}

export interface CategoryMetricItem {
  category: string;
  applications: number;
  responses: number;
  responseRatePct: number;
  avgHours: number;
}

export interface VerifiedMetricItem {
  status: string;
  responseRatePct: number;
  hireRatePct: number;
}

export interface ChannelMetricItem {
  channel: string;
  views: number;
  applications: number;
  viewToApplyPct: number;
}

export interface DayTypeMetricItem {
  dayType: string;
  responseRatePct: number;
  avgHours: number;
}

export interface NagpurWeeklyItem {
  week: string;
  applications: number;
  viewToApplyPct: number;
  isDip: boolean;
}

export interface SalaryBandItem {
  band: string;
  viewToApplyPct: number;
}
