import React from 'react';
import { RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  totalRecordsCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading, totalRecordsCount }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hiring Marketplace Analytics Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Radio className="w-3 h-3 animate-pulse text-emerald-500" />
              Live Sheets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking the job-seeker journey from view to hire across 21 Tier-2 & Tier-3 cities | Jun to Aug 2026 |{' '}
            <span className="italic text-slate-400">Synthetic data for portfolio purposes</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Dataset: <span className="text-slate-800 font-semibold">{totalRecordsCount.toLocaleString()}</span> rows
          </span>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-md transition-colors disabled:opacity-50"
            title="Reload latest data from Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            Sync Sheet
          </button>
        </div>
      </div>
    </header>
  );
};
