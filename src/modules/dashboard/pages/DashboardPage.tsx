import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDashboardOverview } from '../services/dashboardApi';
import type { DashboardOverviewData, DashboardFilterParams } from '../services/types';
import { useTranslation } from '../../../shared/utils/translation';

type FilterPreset = 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom';

/**
 * Format a Date object as "YYYY-MM-DD HH:mm:ss" in local time.
 */
const formatDateTime = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Format a Date object as "YYYY-MM-DD" in local time for input[type="date"].
 */
const formatDateInput = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
};

export default function DashboardPage() {
  const t = useTranslation();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Filter State
  const [preset, setPreset] = useState<FilterPreset>('today');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateInput(d);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return formatDateInput(new Date());
  });
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(false);

  /**
   * Performs the API fetch for the specified preset or custom range.
   */
  const performFetch = useCallback(async (selectedPreset: FilterPreset, customStart?: string, customEnd?: string) => {
    try {
      setLoading(true);
      setError(null);

      let params: DashboardFilterParams | undefined;

      if (selectedPreset === 'today') {
        params = undefined;
      } else if (selectedPreset === 'yesterday') {
        const yStart = new Date();
        yStart.setDate(yStart.getDate() - 1);
        yStart.setHours(0, 0, 0, 0);

        const yEnd = new Date();
        yEnd.setDate(yEnd.getDate() - 1);
        yEnd.setHours(23, 59, 59, 999);

        params = {
          start_date: formatDateTime(yStart),
          end_date: formatDateTime(yEnd),
        };
      } else if (selectedPreset === '7days') {
        const start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        params = {
          start_date: formatDateTime(start),
          end_date: formatDateTime(end),
        };
      } else if (selectedPreset === '30days') {
        const start = new Date();
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        params = {
          start_date: formatDateTime(start),
          end_date: formatDateTime(end),
        };
      } else if (selectedPreset === 'month') {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        params = {
          start_date: formatDateTime(start),
          end_date: formatDateTime(end),
        };
      } else if (selectedPreset === 'custom' && customStart && customEnd) {
        params = {
          start_date: `${customStart} 00:00:00`,
          end_date: `${customEnd} 23:59:59`,
        };
      }

      const overviewData = await fetchDashboardOverview(params);
      setData(overviewData);
      setLastSyncTime(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard overview';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load without synchronous setState in effect
  useEffect(() => {
    let ignore = false;
    fetchDashboardOverview()
      .then((overviewData) => {
        if (!ignore) {
          setData(overviewData);
          setLastSyncTime(new Date());
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Failed to load dashboard overview';
          setError(msg);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectPreset = (p: FilterPreset) => {
    setPreset(p);
    if (p === 'custom') {
      setIsCustomOpen(true);
    } else {
      setIsCustomOpen(false);
      performFetch(p);
    }
  };

  const handleApplyCustomFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) return;
    performFetch('custom', customStartDate, customEndDate);
  };

  // Derived Calculations
  const allTimeTrips = data?.trips.all_time_total_trips || 0;
  const allTimeCompleted = data?.trips.all_time_completed_trips || 0;
  const allTimeCancelled = data?.trips.all_time_cancelled_trips || 0;

  const completionRate = allTimeTrips > 0 ? Math.round((allTimeCompleted / allTimeTrips) * 100) : 0;
  const cancellationRate = allTimeTrips > 0 ? Math.round((allTimeCancelled / allTimeTrips) * 100) : 0;

  const totalDrivers = data?.drivers.total_drivers || 0;
  const activeDrivers = data?.drivers.total_active_drivers || 0;
  const offlineDrivers = data?.drivers.total_offline_drivers || 0;
  const driverActivePct = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Filter Controls ────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 relative overflow-hidden">
        {/* Background Subtle Gradient Glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {t('dashboard')} Overview
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Feed
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Real-time vehicle operations, driver telemetry, and rental activity metrics.
            </p>
          </div>

          {/* Right Action & Sync Status */}
          <div className="flex items-center gap-3 flex-wrap">
            {lastSyncTime && (
              <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                Updated: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => performFetch(preset, customStartDate, customEndDate)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700/80 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Preset Filter Selector ─────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              Period:
            </span>
            {(
              [
                { id: 'today', label: 'Today (Auto)' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom Range...' },
              ] as const
            ).map((item) => {
              const isActive = preset === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPreset(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Active Range Display */}
          {data?.filter && (
            <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
              <span className="text-slate-500">Filter Range:</span>
              <span className="text-slate-200">
                {data.filter.start_date
                  ? `${data.filter.start_date.slice(0, 10)} → ${data.filter.end_date?.slice(0, 10)}`
                  : 'Today (Full Day)'}
              </span>
            </div>
          )}
        </div>

        {/* ── Collapsible Custom Date Form ─────────────────────────── */}
        {isCustomOpen && (
          <form
            onSubmit={handleApplyCustomFilter}
            className="mt-4 p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-end gap-4 animate-in fade-in duration-200"
          >
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                required
                className="px-3 py-1.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                required
                className="px-3 py-1.5 bg-slate-850 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              Apply Filter
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('today')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Reset to Today
            </button>
          </form>
        )}
      </div>

      {/* ── Error Banner ───────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => performFetch(preset, customStartDate, customEndDate)}
            className="px-3 py-1 bg-rose-800/50 hover:bg-rose-800 text-white rounded-lg font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Hero Metric KPI Cards (4 Grid) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Trips in Period */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trip Volume
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-800 animate-pulse rounded" />
              ) : (
                data?.trips.total_trips_in_period ?? 0
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Trips in selected period
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">All-Time Trips:</span>
            <span className="text-slate-200 font-bold font-mono">
              {data?.trips.all_time_total_trips ?? '—'}
            </span>
          </div>
        </div>

        {/* Card 2: Driver Fleet */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Driver Fleet
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-800 animate-pulse rounded" />
              ) : (
                data?.drivers.total_drivers ?? 0
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {data?.drivers.total_active_drivers ?? 0} active
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                {data?.drivers.total_offline_drivers ?? 0} offline
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">New in period:</span>
            <span className="text-emerald-400 font-bold font-mono">
              +{data?.drivers.new_drivers ?? 0}
            </span>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customer Base
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-800 animate-pulse rounded" />
              ) : (
                data?.customers.total_customers ?? 0
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Registered trippy customers
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">New signups:</span>
            <span className="text-sky-400 font-bold font-mono">
              +{data?.customers.new_customers ?? 0}
            </span>
          </div>
        </div>

        {/* Card 4: Fulfillment Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trip Completion
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-800 animate-pulse rounded" />
              ) : (
                `${completionRate}%`
              )}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden flex">
              <div
                style={{ width: `${completionRate}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              />
              <div
                style={{ width: `${cancellationRate}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Cancellation Rate:</span>
            <span className="text-rose-400 font-bold font-mono">
              {cancellationRate}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Mid Section: Detailed Breakdown & Operations ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Trip Status Breakdown Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Trip Status Breakdown
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Detailed metrics for trips created or updated in this timeframe
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/trip-track')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View All Trips</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* New Requests */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  New Requests
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-3 font-mono">
                {data?.trips.new_trip_requests ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Awaiting driver bids
              </p>
            </div>

            {/* Completed Trips */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Completed Trips
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-3 font-mono">
                {data?.trips.completed_trips ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Successfully fulfilled
              </p>
            </div>

            {/* Cancelled Trips */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Cancelled Trips
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              </div>
              <div className="text-2xl font-black text-white mt-3 font-mono">
                {data?.trips.cancelled_trips ?? 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cancelled by user / admin
              </p>
            </div>
          </div>

          {/* Historical Aggregate Bar */}
          <div className="mt-6 p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Historical Platform Totals (All-Time)
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Total Bookings</span>
                <span className="text-sm font-extrabold text-white font-mono mt-0.5 block">
                  {allTimeTrips}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-emerald-400 text-[11px] block">Completed</span>
                <span className="text-sm font-extrabold text-emerald-300 font-mono mt-0.5 block">
                  {allTimeCompleted}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-rose-400 text-[11px] block">Cancelled</span>
                <span className="text-sm font-extrabold text-rose-300 font-mono mt-0.5 block">
                  {allTimeCancelled}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Fleet Health Gauge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Fleet Availability
              </h2>
              <button
                onClick={() => navigate('/dashboard/rider')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Manage
              </button>
            </div>

            {/* Active vs Offline Gauge Indicator */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Active Online Ratio:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  {driverActivePct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${driverActivePct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${100 - driverActivePct}%` }}
                  className="bg-slate-700 h-full transition-all duration-500"
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[11px] text-slate-400 font-medium">Active</span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {activeDrivers}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-400 font-medium">Offline</span>
                  </div>
                  <div className="text-xl font-bold text-white font-mono mt-1">
                    {offlineDrivers}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Drivers online can receive customer rental bidding notifications.</span>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Quick Operations Hub ─────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-bold text-white tracking-tight mb-4">
          Quick Operations Hub
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Trip Track */}
          <button
            onClick={() => navigate('/dashboard/trip-track')}
            className="p-4 bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group shadow-sm hover:border-indigo-500/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
                </svg>
              </span>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white">
              Trip Dispatch & Track
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Monitor active trips, bids, map routing & cancellations
            </p>
          </button>

          {/* Rider / Driver Management */}
          <button
            onClick={() => navigate('/dashboard/rider')}
            className="p-4 bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group shadow-sm hover:border-emerald-500/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white">
              Driver Operations
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Manage driver licenses, car documents & balance top-ups
            </p>
          </button>

          {/* Customer Management */}
          <button
            onClick={() => navigate('/dashboard/customer')}
            className="p-4 bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group shadow-sm hover:border-sky-500/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white">
              Customer Directory
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Customer profiles, NID info & trip history lookup
            </p>
          </button>

          {/* Live Chat Support */}
          <button
            onClick={() => navigate('/dashboard/live-chat')}
            className="p-4 bg-slate-950/70 hover:bg-slate-800/70 border border-slate-800 rounded-xl text-left transition-all cursor-pointer group shadow-sm hover:border-violet-500/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </span>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-200 group-hover:text-white">
              Support Live Chat
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Direct live communication with drivers and customers
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
