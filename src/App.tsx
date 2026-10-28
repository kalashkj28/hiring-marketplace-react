import React, { useState, useEffect, useMemo } from 'react';
import { FunnelRecord, FilterState } from './types/dashboard';
import { fetchFunnelData } from './utils/dataFetcher';
import {
  calculateHeadlineMetrics,
  calculateFunnelStages,
  calculateWeeklyTrends,
  calculateCityBreakdown,
  calculateTierBreakdown,
  calculateCategoryBreakdown,
  calculateVerifiedBreakdown,
  calculateChannelBreakdown,
  calculateDayTypeBreakdown,
  calculateNagpurTrend,
  calculateSalaryBandBreakdown,
} from './utils/aggregations';
import { Header } from './components/Header';
import { SidebarFilters } from './components/SidebarFilters';
import { OverviewTab } from './components/OverviewTab';
import { SegmentsTab } from './components/SegmentsTab';
import { InsightsTab } from './components/InsightsTab';
import { Loader2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [data, setData] = useState<FunnelRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'insights'>('overview');

  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    cityTier: 'All',
    city: 'All',
    language: 'All',
    category: 'All',
    channel: 'All',
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await fetchFunnelData();
      setData(records);

      // Initialize date bounds
      const dates = records.map((r) => r.view_date).filter(Boolean).sort();
      if (dates.length > 0) {
        setFilters((prev) => ({
          ...prev,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
        }));
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch Google Sheets CSV data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute unique dropdown values
  const uniqueValues = useMemo(() => {
    const tiers = Array.from(new Set(data.map((r) => r.city_tier))).filter(Boolean).sort();
    const cities = Array.from(new Set(data.map((r) => r.city))).filter(Boolean).sort();
    const languages = Array.from(new Set(data.map((r) => r.language))).filter(Boolean).sort();
    const categories = Array.from(new Set(data.map((r) => r.category))).filter(Boolean).sort();
    const channels = Array.from(new Set(data.map((r) => r.acquisition_channel))).filter(Boolean).sort();

    const dates = data.map((r) => r.view_date).filter(Boolean).sort();
    const minDate = dates[0] || '';
    const maxDate = dates[dates.length - 1] || '';

    return { tiers, cities, languages, categories, channels, minDate, maxDate };
  }, [data]);

  const handleResetFilters = () => {
    setFilters({
      startDate: uniqueValues.minDate,
      endDate: uniqueValues.maxDate,
      cityTier: 'All',
      city: 'All',
      language: 'All',
      category: 'All',
      channel: 'All',
    });
  };

  // Quick Presets Handler
  const handleApplyPreset = (presetName: string) => {
    switch (presetName) {
      case 'nagpur_dip':
        setFilters({
          startDate: '2026-07-10',
          endDate: '2026-07-27',
          cityTier: 'All',
          city: 'Nagpur',
          language: 'All',
          category: 'All',
          channel: 'All',
        });
        break;
      case 'tier3':
        setFilters({
          startDate: uniqueValues.minDate,
          endDate: uniqueValues.maxDate,
          cityTier: 'Tier-3',
          city: 'All',
          language: 'All',
          category: 'All',
          channel: 'All',
        });
        break;
      case 'whatsapp':
        setFilters({
          startDate: uniqueValues.minDate,
          endDate: uniqueValues.maxDate,
          cityTier: 'All',
          city: 'All',
          language: 'All',
          category: 'All',
          channel: 'WhatsApp Share',
        });
        break;
      case 'delivery':
        setFilters({
          startDate: uniqueValues.minDate,
          endDate: uniqueValues.maxDate,
          cityTier: 'All',
          city: 'All',
          language: 'All',
          category: 'Delivery & Logistics',
          channel: 'All',
        });
        break;
      default:
        handleResetFilters();
    }
  };

  // Memoized client-side filtering across 29k rows (< 20ms)
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (filters.startDate && row.view_date < filters.startDate) return false;
      if (filters.endDate && row.view_date > filters.endDate) return false;
      if (filters.cityTier !== 'All' && row.city_tier !== filters.cityTier) return false;
      if (filters.city !== 'All' && row.city !== filters.city) return false;
      if (filters.language !== 'All' && row.language !== filters.language) return false;
      if (filters.category !== 'All' && row.category !== filters.category) return false;
      if (filters.channel !== 'All' && row.acquisition_channel !== filters.channel) return false;
      return true;
    });
  }, [data, filters]);

  // Derived metrics
  const headlineMetrics = useMemo(() => calculateHeadlineMetrics(filteredData), [filteredData]);
  const funnelStages = useMemo(
    () => calculateFunnelStages(headlineMetrics),
    [headlineMetrics]
  );
  const weeklyTrends = useMemo(() => calculateWeeklyTrends(filteredData), [filteredData]);
  const cityData = useMemo(() => calculateCityBreakdown(filteredData), [filteredData]);
  const tierData = useMemo(() => calculateTierBreakdown(filteredData), [filteredData]);
  const categoryData = useMemo(() => calculateCategoryBreakdown(filteredData), [filteredData]);
  const verifiedData = useMemo(() => calculateVerifiedBreakdown(filteredData), [filteredData]);
  const channelData = useMemo(() => calculateChannelBreakdown(filteredData), [filteredData]);
  const dayTypeData = useMemo(() => calculateDayTypeBreakdown(filteredData), [filteredData]);
  const nagpurData = useMemo(() => calculateNagpurTrend(data), [data]);
  const salaryBandData = useMemo(() => calculateSalaryBandBreakdown(filteredData), [filteredData]);

  // Full filtered records CSV export
  const handleExportFilteredCSV = () => {
    if (filteredData.length === 0) return;
    const headers = [
      'view_id',
      'view_date',
      'city',
      'city_tier',
      'language',
      'category',
      'salary_band',
      'posted_day_type',
      'employer_verified',
      'acquisition_channel',
      'applied',
      'recruiter_viewed',
      'responded',
      'interviewed',
      'hired',
      'hours_to_first_response',
    ];

    const rows = filteredData.map((r) => [
      r.view_id,
      r.view_date,
      r.city,
      r.city_tier,
      r.language,
      `"${r.category}"`,
      r.salary_band,
      r.posted_day_type,
      r.employer_verified,
      `"${r.acquisition_channel}"`,
      r.applied,
      r.recruiter_viewed,
      r.responded,
      r.interviewed,
      r.hired,
      r.hours_to_first_response ?? '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hiring_funnel_filtered_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Header
        onRefresh={loadData}
        isLoading={isLoading}
        totalRecordsCount={data.length}
      />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <SidebarFilters
          filters={filters}
          setFilters={setFilters}
          uniqueValues={uniqueValues}
          onReset={handleResetFilters}
          onApplyPreset={handleApplyPreset}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 mb-6 pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-xs rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-teal-600 text-teal-700 bg-white font-semibold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('segments')}
              className={`px-4 py-2 font-medium text-xs rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'segments'
                  ? 'border-teal-600 text-teal-700 bg-white font-semibold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Segments
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 font-medium text-xs rounded-t-lg transition-colors border-b-2 ${
                activeTab === 'insights'
                  ? 'border-teal-600 text-teal-700 bg-white font-semibold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Insights
            </button>
          </div>

          {/* Loading state */}
          {isLoading && data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-lg border border-slate-200">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm font-medium text-slate-600">Fetching live dataset from Google Sheets...</p>
              <p className="text-xs text-slate-400">Loading ~29,000 funnel records</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadData}
                className="px-2.5 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tab Contents */}
          {(!isLoading || data.length > 0) && (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  metrics={headlineMetrics}
                  funnelStages={funnelStages}
                  weeklyTrends={weeklyTrends}
                />
              )}
              {activeTab === 'segments' && (
                <SegmentsTab
                  cityData={cityData}
                  tierData={tierData}
                  categoryData={categoryData}
                  verifiedData={verifiedData}
                  channelData={channelData}
                  dayTypeData={dayTypeData}
                  nagpurData={nagpurData}
                  salaryBandData={salaryBandData}
                  onExportFilteredCSV={handleExportFilteredCSV}
                />
              )}
              {activeTab === 'insights' && <InsightsTab />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
