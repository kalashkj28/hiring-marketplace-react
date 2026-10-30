import React from 'react';
import { RefreshCw, Database, WifiOff, AlertCircle, HardDrive, Trash2 } from 'lucide-react';
import { SyncStatus } from '../sync/syncEngine';

interface HeaderProps {
  onSyncNow: () => void;
  syncStatus: SyncStatus;
  lastSyncedAt: string;
  totalRecordsCount: number;
  isPersistent: boolean;
  onResetDb?: () => void;
}

function formatLastSynced(isoString: string): string {
  if (!isoString) return 'Never';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return 'Recently';
  }
}

export const Header: React.FC<HeaderProps> = ({
  onSyncNow,
  syncStatus,
  lastSyncedAt,
  totalRecordsCount,
  isPersistent,
  onResetDb,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hiring Marketplace Analytics Dashboard
            </h1>

            {/* Local-First Storage Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                isPersistent
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                isPersistent
                  ? 'Data stored persistently in browser OPFS via DuckDB-Wasm'
                  : 'OPFS not available; running in-memory'
              }
            >
              <Database className="w-3 h-3 text-emerald-600" />
              <span>{isPersistent ? 'DuckDB (OPFS)' : 'DuckDB (In-Memory)'}</span>
            </span>

            {/* Sync State Pill */}
            {syncStatus === 'syncing' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
                Syncing Sheet...
              </span>
            )}
            {syncStatus === 'offline' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <WifiOff className="w-3 h-3 text-amber-600" />
                Offline Mode
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Sync Error
              </span>
            )}
            {(syncStatus === 'synced' || syncStatus === 'idle') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <HardDrive className="w-3 h-3 text-slate-500" />
                Local-first
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Tracking the job-seeker journey from view to hire across 21 Tier-2 & Tier-3 cities | Jun to Aug 2026 |{' '}
            <span className="italic text-slate-400">Synthetic data for portfolio purposes</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right text-xs text-slate-500">
            <div>
              Dataset: <span className="text-slate-800 font-semibold">{totalRecordsCount.toLocaleString()}</span> rows
            </div>
            <div className="text-[10px] text-slate-400">
              Last synced: <span className="font-medium text-slate-600">{formatLastSynced(lastSyncedAt)}</span>
            </div>
          </div>

          <button
            onClick={onSyncNow}
            disabled={syncStatus === 'syncing'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-md transition-colors disabled:opacity-50"
            title="Fetch new or updated records from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-teal-600' : ''}`} />
            Sync now
          </button>

          {onResetDb && (
            <button
              onClick={onResetDb}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Reset local database (re-sync fresh)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
