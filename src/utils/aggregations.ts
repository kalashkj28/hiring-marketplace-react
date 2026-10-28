import {
  FunnelRecord,
  HeadlineMetrics,
  FunnelStageItem,
  WeeklyTrendItem,
  CityMetricItem,
  CategoryMetricItem,
  VerifiedMetricItem,
  ChannelMetricItem,
  DayTypeMetricItem,
  NagpurWeeklyItem,
  SalaryBandItem,
} from '../types/dashboard';

export function calculateHeadlineMetrics(records: FunnelRecord[]): HeadlineMetrics {
  const views = records.length;
  let applications = 0;
  let recruiterViews = 0;
  let responded = 0;
  let interviews = 0;
  let hires = 0;
  let totalHours = 0;
  let hoursCount = 0;
  let within24Count = 0;

  for (const r of records) {
    if (r.applied) applications++;
    if (r.recruiter_viewed) recruiterViews++;
    if (r.responded) responded++;
    if (r.interviewed) interviews++;
    if (r.hired) hires++;
    if (r.hours_to_first_response != null) {
      totalHours += r.hours_to_first_response;
      hoursCount++;
      if (r.hours_to_first_response <= 24) {
        within24Count++;
      }
    }
  }

  const viewToApplyPct = views > 0 ? Number(((applications / views) * 100).toFixed(1)) : 0;
  const responseRatePct = applications > 0 ? Number(((responded / applications) * 100).toFixed(1)) : 0;
  const hireRatePct = applications > 0 ? Number(((hires / applications) * 100).toFixed(1)) : 0;
  const avgHoursToRespond = hoursCount > 0 ? Number((totalHours / hoursCount).toFixed(1)) : 0;
  const within24hPct = applications > 0 ? Number(((within24Count / applications) * 100).toFixed(1)) : 0;

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
    within24hPct,
  };
}

export function calculateFunnelStages(metrics: HeadlineMetrics): FunnelStageItem[] {
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

export function calculateWeeklyTrends(records: FunnelRecord[]): WeeklyTrendItem[] {
  const map = new Map<string, { views: number; applies: number; responded: number }>();

  for (const r of records) {
    if (!r.view_week) continue;
    const existing = map.get(r.view_week) || { views: 0, applies: 0, responded: 0 };
    existing.views++;
    if (r.applied) existing.applies++;
    if (r.responded) existing.responded++;
    map.set(r.view_week, existing);
  }

  const sortedWeeks = Array.from(map.keys()).sort();

  return sortedWeeks.map((week) => {
    const item = map.get(week)!;
    const viewToApplyPct = item.views > 0 ? Number(((item.applies / item.views) * 100).toFixed(1)) : 0;
    const responseRatePct = item.applies > 0 ? Number(((item.responded / item.applies) * 100).toFixed(1)) : 0;
    return {
      week,
      views: item.views,
      applications: item.applies,
      viewToApplyPct,
      responseRatePct,
    };
  });
}

export function calculateCityBreakdown(records: FunnelRecord[]): CityMetricItem[] {
  const map = new Map<
    string,
    { tier: string; views: number; applies: number; responses: number; hires: number }
  >();

  for (const r of records) {
    const key = r.city;
    const existing = map.get(key) || { tier: r.city_tier, views: 0, applies: 0, responses: 0, hires: 0 };
    existing.views++;
    if (r.applied) existing.applies++;
    if (r.responded) existing.responses++;
    if (r.hired) existing.hires++;
    map.set(key, existing);
  }

  const result: CityMetricItem[] = [];
  for (const [city, d] of map.entries()) {
    const vta = d.views > 0 ? Number(((d.applies / d.views) * 100).toFixed(1)) : 0;
    const resp = d.applies > 0 ? Number(((d.responses / d.applies) * 100).toFixed(1)) : 0;
    const hire = d.applies > 0 ? Number(((d.hires / d.applies) * 100).toFixed(1)) : 0;
    result.push({
      city,
      tier: d.tier,
      views: d.views,
      applications: d.applies,
      viewToApplyPct: vta,
      responseRatePct: resp,
      hireRatePct: hire,
    });
  }

  // Sorted by worst View to Apply %
  return result.sort((a, b) => a.viewToApplyPct - b.viewToApplyPct);
}

export function calculateTierBreakdown(records: FunnelRecord[]) {
  const map = new Map<string, { views: number; applies: number }>();
  for (const r of records) {
    const existing = map.get(r.city_tier) || { views: 0, applies: 0 };
    existing.views++;
    if (r.applied) existing.applies++;
    map.set(r.city_tier, existing);
  }

  return ['Tier-2', 'Tier-3'].map((tier) => {
    const d = map.get(tier) || { views: 0, applies: 0 };
    const pct = d.views > 0 ? Number(((d.applies / d.views) * 100).toFixed(1)) : 0;
    return {
      tier,
      viewToApplyPct: pct,
      color: tier === 'Tier-2' ? '#2a9d8f' : '#e76f51',
    };
  });
}

export function calculateCategoryBreakdown(records: FunnelRecord[]): CategoryMetricItem[] {
  const map = new Map<
    string,
    { applies: number; responses: number; totalHours: number; countHours: number }
  >();

  for (const r of records) {
    const key = r.category;
    const existing = map.get(key) || { applies: 0, responses: 0, totalHours: 0, countHours: 0 };
    if (r.applied) existing.applies++;
    if (r.responded) existing.responses++;
    if (r.hours_to_first_response != null) {
      existing.totalHours += r.hours_to_first_response;
      existing.countHours++;
    }
    map.set(key, existing);
  }

  const result: CategoryMetricItem[] = [];
  for (const [category, d] of map.entries()) {
    const respRate = d.applies > 0 ? Number(((d.responses / d.applies) * 100).toFixed(1)) : 0;
    const avgHrs = d.countHours > 0 ? Number((d.totalHours / d.countHours).toFixed(1)) : 0;
    result.push({
      category,
      applications: d.applies,
      responses: d.responses,
      responseRatePct: respRate,
      avgHours: avgHrs,
    });
  }

  return result;
}

export function calculateVerifiedBreakdown(records: FunnelRecord[]): VerifiedMetricItem[] {
  const map = new Map<string, { applies: number; responses: number; hires: number }>();

  for (const r of records) {
    const key = r.employer_verified === 'Yes' ? 'Verified' : 'Unverified';
    const existing = map.get(key) || { applies: 0, responses: 0, hires: 0 };
    if (r.applied) existing.applies++;
    if (r.responded) existing.responses++;
    if (r.hired) existing.hires++;
    map.set(key, existing);
  }

  return ['Verified', 'Unverified'].map((status) => {
    const d = map.get(status) || { applies: 0, responses: 0, hires: 0 };
    const resp = d.applies > 0 ? Number(((d.responses / d.applies) * 100).toFixed(1)) : 0;
    const hire = d.applies > 0 ? Number(((d.hires / d.applies) * 100).toFixed(1)) : 0;
    return {
      status,
      responseRatePct: resp,
      hireRatePct: hire,
    };
  });
}

export function calculateChannelBreakdown(records: FunnelRecord[]): ChannelMetricItem[] {
  const map = new Map<string, { views: number; applies: number }>();
  for (const r of records) {
    const existing = map.get(r.acquisition_channel) || { views: 0, applies: 0 };
    existing.views++;
    if (r.applied) existing.applies++;
    map.set(r.acquisition_channel, existing);
  }

  const result: ChannelMetricItem[] = [];
  for (const [channel, d] of map.entries()) {
    const vta = d.views > 0 ? Number(((d.applies / d.views) * 100).toFixed(1)) : 0;
    result.push({
      channel,
      views: d.views,
      applications: d.applies,
      viewToApplyPct: vta,
    });
  }

  return result.sort((a, b) => a.viewToApplyPct - b.viewToApplyPct);
}

export function calculateDayTypeBreakdown(records: FunnelRecord[]): DayTypeMetricItem[] {
  const map = new Map<
    string,
    { applies: number; responses: number; totalHours: number; countHours: number }
  >();

  for (const r of records) {
    const key = r.posted_day_type;
    const existing = map.get(key) || { applies: 0, responses: 0, totalHours: 0, countHours: 0 };
    if (r.applied) existing.applies++;
    if (r.responded) existing.responses++;
    if (r.hours_to_first_response != null) {
      existing.totalHours += r.hours_to_first_response;
      existing.countHours++;
    }
    map.set(key, existing);
  }

  return ['Weekday', 'Weekend'].map((dayType) => {
    const d = map.get(dayType) || { applies: 0, responses: 0, totalHours: 0, countHours: 0 };
    const resp = d.applies > 0 ? Number(((d.responses / d.applies) * 100).toFixed(1)) : 0;
    const avgH = d.countHours > 0 ? Number((d.totalHours / d.countHours).toFixed(1)) : 0;
    return {
      dayType,
      responseRatePct: resp,
      avgHours: avgH,
    };
  });
}

export function calculateNagpurTrend(allRawRecords: FunnelRecord[]): NagpurWeeklyItem[] {
  const nagpur = allRawRecords.filter((r) => r.city === 'Nagpur');
  const map = new Map<string, { views: number; applies: number }>();

  for (const r of nagpur) {
    if (!r.view_week) continue;
    const existing = map.get(r.view_week) || { views: 0, applies: 0 };
    existing.views++;
    if (r.applied) existing.applies++;
    map.set(r.view_week, existing);
  }

  const sortedWeeks = Array.from(map.keys()).sort();

  return sortedWeeks.map((week) => {
    const d = map.get(week)!;
    const vta = d.views > 0 ? Number(((d.applies / d.views) * 100).toFixed(1)) : 0;
    // Jul 10 to Jul 27 period is roughly 2026-07-13 & 2026-07-20 weeks
    const isDip = week.includes('2026-07-13') || week.includes('2026-07-20');
    return {
      week,
      applications: d.applies,
      viewToApplyPct: vta,
      isDip,
    };
  });
}

export function calculateSalaryBandBreakdown(records: FunnelRecord[]): SalaryBandItem[] {
  const order = ['<12k', '12-18k', '18-25k', '25k+'];
  const map = new Map<string, { views: number; applies: number }>();

  for (const r of records) {
    const existing = map.get(r.salary_band) || { views: 0, applies: 0 };
    existing.views++;
    if (r.applied) existing.applies++;
    map.set(r.salary_band, existing);
  }

  return order.map((band) => {
    const d = map.get(band) || { views: 0, applies: 0 };
    const vta = d.views > 0 ? Number(((d.applies / d.views) * 100).toFixed(1)) : 0;
    return {
      band,
      viewToApplyPct: vta,
    };
  });
}
