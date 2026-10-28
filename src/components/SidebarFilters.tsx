import React from 'react';
import { FilterState } from '../types/dashboard';
import { Filter, RotateCcw, Zap } from 'lucide-react';

interface SidebarFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  uniqueValues: {
    tiers: string[];
    cities: string[];
    languages: string[];
    categories: string[];
    channels: string[];
    minDate: string;
    maxDate: string;
  };
  onReset: () => void;
  onApplyPreset: (presetName: string) => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  filters,
  setFilters,
  uniqueValues,
  onReset,
  onApplyPreset,
}) => {
  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters =
    filters.cityTier !== 'All' ||
    filters.city !== 'All' ||
    filters.language !== 'All' ||
    filters.category !== 'All' ||
    filters.channel !== 'All' ||
    (filters.startDate && filters.startDate !== uniqueValues.minDate) ||
    (filters.endDate && filters.endDate !== uniqueValues.maxDate);

  return (
    <aside className="w-full lg:w-64 bg-white border-r border-slate-200 p-5 shrink-0 flex flex-col gap-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          <Filter className="w-4 h-4 text-teal-600" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Quick Action Presets (User Enhancement) */}
      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-2">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Quick Investigation Presets</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onApplyPreset('nagpur_dip')}
            className="text-[10px] text-left px-2 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded text-slate-600 font-medium transition-colors"
          >
            🔴 Nagpur Dip
          </button>
          <button
            onClick={() => onApplyPreset('tier3')}
            className="text-[10px] text-left px-2 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded text-slate-600 font-medium transition-colors"
          >
            🏢 Tier-3 Deep Dive
          </button>
          <button
            onClick={() => onApplyPreset('whatsapp')}
            className="text-[10px] text-left px-2 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded text-slate-600 font-medium transition-colors"
          >
            💬 WhatsApp Channel
          </button>
          <button
            onClick={() => onApplyPreset('delivery')}
            className="text-[10px] text-left px-2 py-1 bg-white hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded text-slate-600 font-medium transition-colors"
          >
            🚚 Delivery Category
          </button>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Date Range */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">Date Range</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">From</span>
              <input
                type="date"
                value={filters.startDate}
                min={uniqueValues.minDate}
                max={filters.endDate || uniqueValues.maxDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">To</span>
              <input
                type="date"
                value={filters.endDate}
                min={filters.startDate || uniqueValues.minDate}
                max={uniqueValues.maxDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* City Tier */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">City Tier</label>
          <select
            value={filters.cityTier}
            onChange={(e) => handleChange('cityTier', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            <option value="All">All Tiers</option>
            {uniqueValues.tiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">City</label>
          <select
            value={filters.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            <option value="All">All Cities</option>
            {uniqueValues.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">Language</label>
          <select
            value={filters.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            <option value="All">All Languages</option>
            {uniqueValues.languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {uniqueValues.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Acquisition Channel */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">Acquisition Channel</label>
          <select
            value={filters.channel}
            onChange={(e) => handleChange('channel', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
          >
            <option value="All">All Channels</option>
            {uniqueValues.channels.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 text-center">
          Data: Jun to Aug 2026 (synthetic)
        </p>
      </div>
    </aside>
  );
};
