import React, { useState, useEffect, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { FilterState, HeadlineMetrics, FunnelStageItem, WeeklyTrendItem, CityMetricItem, CategoryMetricItem, VerifiedMetricItem, ChannelMetricItem, DayTypeMetricItem, NagpurWeeklyItem, SalaryBandItem } from './types/dashboard';
import { Header } from './components/Header';
import { SidebarFilters } from './components/SidebarFilters';
import { OverviewTab } from './components/OverviewTab';
import { SegmentsTab } from './components/SegmentsTab';
import { InsightsTab } from './components/InsightsTab';
import { Loader2, AlertCircle, HardDrive } from 'lucide-react';
import { useLocalDb } from './hooks/useLocalDb';
import { useSyncStatus, dataRevisionEmitter } from './hooks/useSyncStatus';
import { resetLocalDb } from './db/client';
import {
  fetchUniqueFilterValues,
  queryHeadlineMetrics,
  buildFunnelStages,
  queryWeeklyTrends,
  queryCityBreakdown,
  queryTierBreakdown,
  queryCategoryBreakdown,
  queryVerifiedBreakdown,
  queryChannelBreakdown,
  queryDayTypeBreakdown,
  queryNagpurTrend,
  querySalaryBandBreakdown,
  queryFilteredRecordsForExport,
  getTableRowCount,
} from './db/queries';

export const App: React.FC = () => {
  const { isReady: isDbReady, isPersistent, error: dbError } = useLocalDb();
  const { syncStatus, lastSyncedAt, rowCount: syncRowCount, triggerSync, syncError } = useSyncStatus(isDbReady);

  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'insights'>('overview');
  const [dataRevision, setDataRevision] = useState<number>(0);
  const [isQueryLoading, setIsQueryLoading] = useState<boolean>(true);
  const [currentDbRowCount, setCurrentDbRowCount] = useState<number>(0);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    cityTier: 'All',
    city: 'All',
    language: 'All',
    category: 'All',
    channel: 'All',
  });

  const [uniqueValues, setUniqueValues] = useState<{
    tiers: string[];
    cities: string[];
    languages: string[];
    categories: string[];
    channels: string[];
    minDate: string;
    maxDate: string;
  }>({
    tiers: [],
    cities: [],
    languages: [],
    categories: [],
    channels: [],
    minDate: '',
    maxDate: '',
  });

  // Query Result State (Loaded directly from DuckDB SQL)
  const [headlineMetrics, setHeadlineMetrics] = useState<HeadlineMetrics>({
    views: 0,
    applications: 0,
    recruiterViews: 0,
    responded: 0,
    interviews: 0,
    hires: 0,
    viewToApplyPct: 0,
    responseRatePct: 0,
    hireRatePct: 0,
    avgHoursToRespond: 0,
  });
  const [funnelStages, setFunnelStages] = useState<FunnelStageItem[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendItem[]>([]);
  const [cityData, setCityData] = useState<CityMetricItem[]>([]);
  const [tierData, setTierData] = useState<{ tier: string; viewToApplyPct: number; color: string }[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryMetricItem[]>([]);
  const [verifiedData, setVerifiedData] = useState<VerifiedMetricItem[]>([]);
  const [channelData, setChannelData] = useState<ChannelMetricItem[]>([]);
  const [dayTypeData, setDayTypeData] = useState<DayTypeMetricItem[]>([]);
  const [nagpurData, setNagpurData] = useState<NagpurWeeklyItem[]>([]);
  const [salaryBandData, setSalaryBandData] = useState<SalaryBandItem[]>([]);

  // Listen to background sync notifications
  useEffect(() => {
    const handleDataChanged = () => {
      setDataRevision((r) => r + 1);
    };
    dataRevisionEmitter.addEventListener('change', handleDataChanged);
    return () => {
      dataRevisionEmitter.removeEventListener('change', handleDataChanged);
    };
  }, []);

  // Initial startup: check if local DB has records
  // If records exist, render immediately from local storage (Step 4: Instant open)
  // If empty, trigger initial sync
  useEffect(() => {
    if (!isDbReady) return;

    getTableRowCount().then((count) => {
      setCurrentDbRowCount(count);
      if (count === 0) {
        console.log('[App] Local database is empty. Triggering initial sync from Google Sheet...');
        triggerSync({ forceReload: true });
      } else {
        console.log(`[App] Instant startup: ${count.toLocaleString()} records loaded from local DuckDB storage.`);
        // Background sync check without blocking the UI
        triggerSync();
      }
    });
  }, [isDbReady, triggerSync]);

  // Load unique filter options once DB has data or updates
  useEffect(() => {
    if (!isDbReady) return;
    fetchUniqueFilterValues()
      .then((uv) => {
        setUniqueValues(uv);
        setFilters((prev) => {
          // Keep current dates if already set, otherwise initialize with dataset bounds
          if (!prev.startDate && uv.minDate) {
            return {
              ...prev,
              startDate: uv.minDate,
              endDate: uv.maxDate,
            };
          }
          return prev;
        });
      })
      .catch((err) => console.error('[App] Failed to load filter options:', err));
  }, [isDbReady, dataRevision, syncRowCount]);

  // Execute all SQL queries on local DuckDB whenever filters or data revision change
  const executeQueries = useCallback(async () => {
    if (!isDbReady) return;

    const count = await getTableRowCount();
    setCurrentDbRowCount(count);
    if (count === 0) {
      setIsQueryLoading(false);
      return;
    }

    setIsQueryLoading(true);
    try {
      const [
        metrics,
        weekly,
        cities,
        tiers,
        categories,
        verified,
        channels,
        dayTypes,
        nagpur,
        salaryBands,
      ] = await Promise.all([
        queryHeadlineMetrics(filters),
        queryWeeklyTrends(filters),
        queryCityBreakdown(filters),
        queryTierBreakdown(filters),
        queryCategoryBreakdown(filters),
        queryVerifiedBreakdown(filters),
        queryChannelBreakdown(filters),
        queryDayTypeBreakdown(filters),
        queryNagpurTrend(),
        querySalaryBandBreakdown(filters),
      ]);

      setHeadlineMetrics(metrics);
      setFunnelStages(buildFunnelStages(metrics));
      setWeeklyTrends(weekly);
      setCityData(cities);
      setTierData(tiers);
      setCategoryData(categories);
      setVerifiedData(verified);
      setChannelData(channels);
      setDayTypeData(dayTypes);
      setNagpurData(nagpur);
      setSalaryBandData(salaryBands);
    } catch (err) {
      console.error('[App] Error executing local DuckDB queries:', err);
    } finally {
      setIsQueryLoading(false);
    }
  }, [isDbReady, filters]);

  useEffect(() => {
    executeQueries();
  }, [executeQueries, dataRevision]);

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

  // Full filtered records CSV export (Queried locally from DuckDB - zero network request!)
  const handleExportFilteredCSV = async () => {
    const records = await queryFilteredRecordsForExport(filters);
    if (records.length === 0) return;

    const headers = [
      'id',
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

    const rows = records.map((r) => [
      r.id,
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

  const handleResetDb = async () => {
    if (window.confirm('Reset local DuckDB storage and re-sync from Google Sheets?')) {
      await resetLocalDb();
      setDataRevision((r) => r + 1);
      triggerSync({ forceReload: true });
    }
  };

  const isInitialLoading = !isDbReady || (currentDbRowCount === 0 && syncStatus === 'syncing');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Analytics />
      <Header
        onSyncNow={() => triggerSync({ bypassHashCheck: true })}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        totalRecordsCount={currentDbRowCount}
        isPersistent={isPersistent}
        onResetDb={handleResetDb}
      />

      {/* Notice if OPFS is unavailable and running in-memory */}
      {!isPersistent && isDbReady && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> Persistent OPFS storage is not supported in this browser. Running in-memory mode (data will refresh from Google Sheets on tab reload).
            </span>
          </div>
        </div>
      )}

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

          {/* First-time Loading state (only shown if local DB is empty) */}
          {isInitialLoading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm font-medium text-slate-700">Initial sync from Google Sheets into local DuckDB...</p>
              <p className="text-xs text-slate-400">Loading and indexing ~29,000 records in browser WebAssembly</p>
            </div>
          )}

          {/* Sync or DB Error Banner */}
          {(dbError || syncError) && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{dbError || syncError}</span>
              </div>
              <button
                onClick={() => triggerSync(true)}
                className="px-2.5 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 transition"
              >
                Retry Sync
              </button>
            </div>
          )}

          {/* Dashboard View (Rendered directly from DuckDB SQL query results) */}
          {!isInitialLoading && currentDbRowCount > 0 && (
            <div className={`transition-opacity duration-200 ${isQueryLoading ? 'opacity-70' : 'opacity-100'}`}>
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
