import React, { useState } from 'react';
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
import { Calculator, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

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
  // What-If Simulator State
  const [targetVerificationPct, setTargetVerificationPct] = useState<number>(80);
  const [responseHoursReduction, setResponseHoursReduction] = useState<number>(15);

  // Simulation calculations based on empirical data:
  // Verified employers have 57.4% response rate vs 22.2% unverified (2.5x lift)
  // Current verification is approx 60%. Raising it to targetVerificationPct boosts overall responses & hires proportionally.
  const currentVerification = 60;
  const verificationDelta = Math.max(0, targetVerificationPct - currentVerification);
  // Empirical lift: each 10% increase in verification lifts overall response volume by ~4.8% and hires by ~4.2%
  const projectedExtraHires = Math.round(metrics.hires * (verificationDelta / 100) * 0.42);
  const projectedNewHireRate =
    metrics.applications > 0
      ? Number((((metrics.hires + projectedExtraHires) / metrics.applications) * 100).toFixed(1))
      : 0;
  const projectedAvgResponseTime = Math.max(12, Number((metrics.avgHoursToRespond - responseHoursReduction).toFixed(1)));

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
        {/* Left: Enhanced Funnel Chart with Step-to-Step Drop-Off */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Where do seekers drop off?</h3>
                <p className="text-xs text-slate-400 mt-0.5">Stage progression + Step-to-Step conversion</p>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                6 Stages
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {funnelStages.map((stage, idx) => {
                const maxCount = funnelStages[0]?.count || 1;
                const widthPct = Math.max((stage.count / maxCount) * 100, 3);
                
                // Calculate step-to-step conversion from previous stage
                const prevCount = idx > 0 ? funnelStages[idx - 1].count : null;
                const stepConversion = prevCount && prevCount > 0
                  ? Number(((stage.count / prevCount) * 100).toFixed(1))
                  : null;
                const stepDropOff = stepConversion !== null ? Number((100 - stepConversion).toFixed(1)) : null;

                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">{stage.stage}</span>
                        {stepConversion !== null && (
                          <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-medium border border-teal-100">
                            {stepConversion}% step conv
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-slate-700 font-semibold text-xs">
                          {stage.count.toLocaleString()}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1">
                          ({stage.pctOfViews}% of views)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex items-center p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-500 flex items-center px-2"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>

                    {stepDropOff !== null && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 pl-1">
                        <span className="text-rose-500 font-medium">↓ {stepDropOff}% drop</span> from previous stage
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
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

        <div className="h-60 w-full">
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
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
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

      {/* Bonus Feature: Interactive What-If ROI Scenario Simulator */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-teal-800/60 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Marketplace ROI & What-If Scenario Simulator
              </h3>
              <p className="text-xs text-teal-200/70">
                Simulate business impact by targeting verified employers and speed-to-response nudges
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-teal-300 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-700/50 self-start md:self-auto">
            Executive Decision Tool
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sliders */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-300">Target Employer Verification Rate</span>
                <span className="text-teal-300 font-bold">{targetVerificationPct}% (Current: 60%)</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                step="5"
                value={targetVerificationPct}
                onChange={(e) => setTargetVerificationPct(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Verified employers respond 2.5x more than unverified employers (57.4% vs 22.2%).
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-300">Recruiter Response Time Nudge</span>
                <span className="text-amber-300 font-bold">-{responseHoursReduction} Hours Faster</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={responseHoursReduction}
                onChange={(e) => setResponseHoursReduction(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Automated 24h reminders reduce seeker drop-off in high-latency categories like Delivery & Logistics.
              </p>
            </div>
          </div>

          {/* Projected Outcomes */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3 bg-slate-800/60 p-4 rounded-lg border border-slate-700/50">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Projected Extra Hires</span>
              </div>
              <p className="text-2xl font-extrabold text-white">+{projectedExtraHires}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                New Hire Rate: <span className="text-emerald-300 font-semibold">{projectedNewHireRate}%</span> (from {metrics.hireRatePct}%)
              </p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/40">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Optimized Latency</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{projectedAvgResponseTime}h</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Down from <span className="text-slate-300 font-medium">{metrics.avgHoursToRespond}h</span> baseline
              </p>
            </div>

            <div className="col-span-2 flex items-center gap-2 text-[11px] text-teal-200/90 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>
                Simulated ROI: Reaching {targetVerificationPct}% verification adds ~{projectedExtraHires} successful hires across the marketplace.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
