import React, { useState, useMemo } from 'react';
import {
  CityMetricItem,
  CategoryMetricItem,
  VerifiedMetricItem,
  ChannelMetricItem,
  DayTypeMetricItem,
  NagpurWeeklyItem,
  SalaryBandItem,
} from '../types/dashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Line,
  ComposedChart,
  ReferenceArea,
} from 'recharts';
import { Search, Download } from 'lucide-react';

interface SegmentsTabProps {
  cityData: CityMetricItem[];
  tierData: { tier: string; viewToApplyPct: number; color: string }[];
  categoryData: CategoryMetricItem[];
  verifiedData: VerifiedMetricItem[];
  channelData: ChannelMetricItem[];
  dayTypeData: DayTypeMetricItem[];
  nagpurData: NagpurWeeklyItem[];
  salaryBandData: SalaryBandItem[];
  onExportFilteredCSV?: () => void;
}

export const SegmentsTab: React.FC<SegmentsTabProps> = ({
  cityData,
  tierData,
  categoryData,
  verifiedData,
  channelData,
  dayTypeData,
  nagpurData,
  salaryBandData,
  onExportFilteredCSV,
}) => {
  const [searchCity, setSearchCity] = useState<string>('');

  const filteredCityData = useMemo(() => {
    if (!searchCity.trim()) return cityData;
    return cityData.filter((item) =>
      item.city.toLowerCase().includes(searchCity.toLowerCase().trim())
    );
  }, [cityData, searchCity]);

  // Client-side CSV export of city summary
  const handleExportCityCSV = () => {
    const headers = ['City', 'Tier', 'Views', 'Applications', 'View to Apply %', 'Response Rate %', 'Hire Rate %'];
    const rows = filteredCityData.map((r) => [
      r.city,
      r.tier,
      r.views,
      r.applications,
      `${r.viewToApplyPct}%`,
      `${r.responseRatePct}%`,
      `${r.hireRatePct}%`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `city_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. City-Level Table with Search & Export */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              City-level breakdown (sorted by worst view-to-apply)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare city funnel health, application conversion, and hire rates
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none w-36 md:w-48"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCityCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Download city table as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Table</span>
            </button>

            {onExportFilteredCSV && (
              <button
                onClick={onExportFilteredCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors"
                title="Download full filtered rows as CSV"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>Export All Records</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">City</th>
                <th className="px-3 py-2.5">Tier</th>
                <th className="px-3 py-2.5 text-right">Views</th>
                <th className="px-3 py-2.5 text-right">Applications</th>
                <th className="px-4 py-2.5 min-w-[150px]">View to Apply %</th>
                <th className="px-4 py-2.5 min-w-[150px]">Response Rate %</th>
                <th className="px-3 py-2.5 text-right">Hire Rate %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCityData.map((row, idx) => (
                <tr key={row.city} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{row.city}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.tier === 'Tier-2'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}
                    >
                      {row.tier}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{row.views.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{row.applications.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full"
                          style={{ width: `${Math.min((row.viewToApplyPct / 35) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700">{row.viewToApplyPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${Math.min((row.responseRatePct / 70) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700">{row.responseRatePct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-700">{row.hireRatePct}%</td>
                </tr>
              ))}
              {filteredCityData.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">
                    No cities matching "{searchCity}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Three Charts Row: Tier-2 vs Tier-3, Category Response, Category Avg Hours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier-2 vs Tier-3 */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Tier-2 vs Tier-3 apply rate</h4>
          <p className="text-xs text-slate-400 mb-4">View to Apply % comparison</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tier" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" domain={[0, 30]} />
                <Tooltip formatter={(val: number) => [`${val}%`, 'View to Apply']} />
                <Bar dataKey="viewToApplyPct" radius={[4, 4, 0, 0]}>
                  {tierData.map((entry) => (
                    <Cell key={entry.tier} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Response Rate */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Response rate by category</h4>
          <p className="text-xs text-slate-400 mb-4">% applications responded to</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...categoryData].sort((a, b) => a.responseRatePct - b.responseRatePct)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" unit="%" domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#475569' }} width={90} />
                <Tooltip formatter={(val: number) => [`${val}%`, 'Response Rate']} />
                <Bar dataKey="responseRatePct" fill="#2a9d8f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Hours to Respond by Category */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Avg hours to respond by category</h4>
          <p className="text-xs text-slate-400 mb-4">Delivery & Logistics is slowest</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...categoryData].sort((a, b) => b.avgHours - a.avgHours)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" unit="h" domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#475569' }} width={90} />
                <Tooltip formatter={(val: number) => [`${val}h`, 'Avg Hours']} />
                <Bar dataKey="avgHours" fill="#e76f51" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Three Charts Row: Verified vs Unverified, Channel View-to-Apply, Posting Day */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verified vs Unverified */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Verified vs unverified employers</h4>
          <p className="text-xs text-slate-400 mb-4">Response & Hire Rates</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verifiedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <Tooltip formatter={(val: number) => [`${val}%`]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="responseRatePct" name="Response Rate %" fill="#2a9d8f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hireRatePct" name="Hire Rate %" fill="#264653" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acquisition Channel */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Which channel brings seekers who apply?</h4>
          <p className="text-xs text-slate-400 mb-4">WhatsApp Share vs Paid Ads</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" unit="%" domain={[0, 30]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="channel" tick={{ fontSize: 10, fill: '#475569' }} width={90} />
                <Tooltip formatter={(val: number) => [`${val}%`, 'View to Apply']} />
                <Bar dataKey="viewToApplyPct" fill="#2a9d8f" radius={[0, 4, 4, 0]}>
                  {channelData.map((ch) => (
                    <Cell
                      key={ch.channel}
                      fill={
                        ch.channel === 'WhatsApp Share'
                          ? '#2a9d8f'
                          : ch.channel === 'Paid Ads'
                          ? '#e76f51'
                          : '#264653'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Posting Day Type */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Does posting day affect response?</h4>
          <p className="text-xs text-slate-400 mb-4">Weekday vs Weekend</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayTypeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="dayType" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="responseRatePct" name="Response Rate %" fill="#2a9d8f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgHours" name="Avg Hours to Respond" fill="#e76f51" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Nagpur July Dip & Salary Band */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nagpur Weekly Dip */}
        <div className="lg:col-span-8 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Nagpur applications by week - notice the July dip
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Dual-axis view of volume vs conversion %</p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded">
              July 10 - 27 Dip
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={nagpurData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  domain={[0, 40]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip />
                <Legend iconType="circle" verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceArea
                  yAxisId="left"
                  x1="2026-07-13"
                  x2="2026-07-20"
                  fill="#e76f51"
                  fillOpacity={0.08}
                  label={{ value: 'Dip Period', position: 'top', fill: '#e76f51', fontSize: 11 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="applications"
                  name="Applications"
                  fill="#2a9d8f"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="viewToApplyPct"
                  name="View to Apply %"
                  stroke="#e76f51"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#e76f51' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Band */}
        <div className="lg:col-span-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-1">Salary band vs apply rate</h4>
          <p className="text-xs text-slate-400 mb-4">Higher pay drives higher apply intent</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryBandData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="band" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="%" domain={[0, 35]} />
                <Tooltip formatter={(val: number) => [`${val}%`, 'View to Apply']} />
                <Bar dataKey="viewToApplyPct" radius={[4, 4, 0, 0]}>
                  {salaryBandData.map((entry, index) => (
                    <Cell
                      key={entry.band}
                      fill={['#e76f51', '#f4a261', '#52b788', '#2a9d8f'][index] || '#2a9d8f'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
