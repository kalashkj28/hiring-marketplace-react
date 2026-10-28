import React from 'react';
import { HeadlineMetrics, FunnelStageItem, WeeklyTrendItem } from '../types/dashboard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface OverviewTabProps {
  metrics: HeadlineMetrics;
  funnelStages: FunnelStageItem[];
  weeklyTrends: WeeklyTrendItem[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  funnelStages,
  weeklyTrends,
}) => {
  return (
    <div className="space-y-6">
      {/* 6 Headline Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Views</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.views.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Applications</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.applications.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">View to Apply %</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{metrics.viewToApplyPct}%</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Response Rate</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.responseRatePct}%</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Avg Hrs to Respond</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.avgHoursToRespond}h</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Hires</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics.hires.toLocaleString()}</p>
        </div>
      </div>

      {/* Row 2: Funnel Chart & Weekly Views/Applies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Funnel Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800">Where do seekers drop off?</h3>
            <p className="text-xs text-slate-400 mt-0.5">Drop-off progression across all stages</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {funnelStages.map((stage) => {
              const maxCount = funnelStages[0]?.count || 1;
              const widthPct = Math.max((stage.count / maxCount) * 100, 3);
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">{stage.stage}</span>
                    <span className="text-slate-500 font-semibold">
                      {stage.count.toLocaleString()}{' '}
                      <span className="text-slate-400 font-normal">({stage.pctOfViews}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden flex items-center p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center px-2"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      {widthPct > 20 && (
                        <span className="text-[10px] font-medium text-white truncate">
                          {stage.count.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Weekly Trend Line Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-800">Weekly trend - views and applications</h3>
            <p className="text-xs text-slate-400 mt-0.5">Total counts week on week</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#264653"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#264653' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name="Applications"
                  stroke="#2a9d8f"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2a9d8f' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Conversion Rates Stability */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-800">Are conversion rates stable week on week?</h3>
          <p className="text-xs text-slate-400 mt-0.5">View to Apply % vs Response Rate %</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => val.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                unit="%"
                domain={[0, 'auto']}
              />
              <Tooltip
                formatter={(val: number) => [`${val}%`]}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line
                type="monotone"
                dataKey="viewToApplyPct"
                name="View to Apply %"
                stroke="#264653"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#264653' }}
              />
              <Line
                type="monotone"
                dataKey="responseRatePct"
                name="Response Rate %"
                stroke="#e76f51"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#e76f51' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
