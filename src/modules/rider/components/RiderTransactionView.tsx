import { useEffect, useState, useCallback } from 'react';
import type { RiderItem, TransactionFilterType, DriverTransactionHistoryResponse } from '../services/types';
import { fetchDriverTransactionHistory, rechargeDriverAccount } from '../services/riderApi';

interface RiderTransactionViewProps {
  rider: RiderItem;
}

const filterOptions: { value: TransactionFilterType; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_three_month', label: 'Last 3 Months' },
];

const formatDateTime = (isoString?: string | null) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

export default function RiderTransactionView({ rider }: RiderTransactionViewProps) {
  const [filterType, setFilterType] = useState<TransactionFilterType>('today');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<DriverTransactionHistoryResponse | null>(null);

  // Manual Recharge State
  const [manualTrxId, setManualTrxId] = useState<string>('');
  const [recharging, setRecharging] = useState<boolean>(false);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  const loadTransactions = useCallback(async (currentFilter: TransactionFilterType, currentPage: number) => {
    if (!rider?.uuid) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDriverTransactionHistory({
        driver_uuid: rider.uuid,
        filter_type: currentFilter,
        page: currentPage,
      });
      setHistoryData(res);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load driver transactions');
    } finally {
      setLoading(false);
    }
  }, [rider?.uuid]);

  useEffect(() => {
    if (rider?.uuid) {
      setPage(1);
      loadTransactions(filterType, 1);
    }
  }, [rider?.uuid, filterType, loadTransactions]);

  const handleFilterChange = (newFilter: TransactionFilterType) => {
    if (newFilter === filterType) return;
    setFilterType(newFilter);
    setPage(1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      loadTransactions(filterType, newPage);
    }
  };

  const handleNextPage = () => {
    const newPage = page + 1;
    setPage(newPage);
    loadTransactions(filterType, newPage);
  };

  const handleManualRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTrxId.trim()) {
      setRechargeError('Please enter a Transaction ID');
      return;
    }
    if (!rider?.uuid) return;

    try {
      setRecharging(true);
      setRechargeError(null);
      setRechargeSuccess(null);

      const res = await rechargeDriverAccount({
        driver_uuid: rider.uuid,
        transaction_id: manualTrxId.trim(),
        country_code: rider.country_code || 'BD',
        subscription_uuid: activePackage?.subscription_uuid || undefined,
      });

      setRechargeSuccess(res.message || 'Driver account recharged successfully!');
      setManualTrxId('');
      // Refresh ledger data & balances
      loadTransactions(filterType, page);
    } catch (err: any) {
      console.error(err);
      setRechargeError(err?.message || 'Failed to recharge driver account. Please check the Transaction ID.');
    } finally {
      setRecharging(false);
    }
  };

  const activePackage = historyData?.active_pacage_details;
  const transactions = historyData?.data || [];
  const currentBalance = historyData?.current_blanc ?? 0;
  const dueBalance = historyData?.due_blanc ?? 0;
  const totalEarning = historyData?.total_earning ?? 0;

  return (
    <div className="space-y-5">
      {/* ─── Financial Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Current Balance */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Current Balance</p>
            <p className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">
              ৳ {currentBalance.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <i className="fa fa-wallet text-lg"></i>
          </div>
        </div>

        {/* Due Balance */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Due Balance</p>
            <p className={`text-xl font-extrabold mt-1 font-mono ${dueBalance > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              ৳ {dueBalance.toLocaleString()}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dueBalance > 0 ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
            <i className="fa fa-exclamation-triangle text-lg"></i>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Total Earnings</p>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-medium">
                {filterOptions.find(f => f.value === filterType)?.label}
              </span>
            </div>
            <p className="text-xl font-extrabold text-indigo-400 mt-1 font-mono">
              ৳ {totalEarning.toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <i className="fa fa-line-chart text-lg"></i>
          </div>
        </div>

        {/* Active Subscription Package */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between shadow-sm">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Active Package</p>
            {activePackage && activePackage.car_subscription_type ? (
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-md uppercase">
                    {activePackage.car_subscription_type}
                  </span>
                  <span className="text-xs font-mono text-slate-300 font-semibold">
                    ৳ {activePackage.car_subscription_price}
                  </span>
                </div>
                {activePackage.subscription_expiry_date_time && (
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    Exp: {formatDateTime(activePackage.subscription_expiry_date_time)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1 italic">No active subscription</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <i className="fa fa-car text-lg"></i>
          </div>
        </div>

      </div>

      {/* ─── Manual Account Recharge (Add Missing Transaction) ─── */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-indigo-500/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <i className="fa fa-credit-card text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white">Manual Balance Recharge</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider border border-indigo-500/30">
                  Sync Missing Payment
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                If driver transferred money mistakenly not added to account, enter the Transaction ID to sync balance.
              </p>
            </div>
          </div>

          <form onSubmit={handleManualRecharge} className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="relative min-w-[260px] sm:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fa fa-barcode text-xs"></i>
              </span>
              <input
                type="text"
                value={manualTrxId}
                onChange={(e) => {
                  setManualTrxId(e.target.value);
                  if (rechargeError) setRechargeError(null);
                  if (rechargeSuccess) setRechargeSuccess(null);
                }}
                placeholder="Transaction ID (e.g. TRX_...)"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                disabled={recharging}
              />
            </div>
            <button
              type="submit"
              disabled={recharging || !manualTrxId.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              {recharging ? (
                <>
                  <i className="fa fa-spinner fa-spin text-xs"></i>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <i className="fa fa-plus-circle text-xs"></i>
                  <span>Add Balance</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Feedback Alerts */}
        {rechargeSuccess && (
          <div className="mt-3 p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa fa-check-circle text-emerald-400 text-sm"></i>
              <span>{rechargeSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setRechargeSuccess(null)}
              className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}

        {rechargeError && (
          <div className="mt-3 p-3 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="fa fa-exclamation-triangle text-rose-400 text-sm"></i>
              <span>{rechargeError}</span>
            </div>
            <button
              type="button"
              onClick={() => setRechargeError(null)}
              className="text-rose-400 hover:text-rose-200 cursor-pointer"
            >
              <i className="fa fa-times"></i>
            </button>
          </div>
        )}
      </div>

      {/* ─── Filter Pills Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
            <i className="fa fa-filter text-slate-400"></i>
            Period:
          </span>
          {filterOptions.map((opt) => {
            const isActive = filterType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadTransactions(filterType, page)}
            disabled={loading}
            title="Refresh transactions"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <i className={`fa fa-refresh ${loading ? 'fa-spin' : ''}`}></i>
            <span>Refresh</span>
          </button>
          <span className="text-xs text-slate-400 font-mono">
            {transactions.length} records (Page {page})
          </span>
        </div>
      </div>

      {/* ─── Error Message ─── */}
      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa fa-exclamation-circle text-sm"></i>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadTransactions(filterType, page)}
            className="px-2.5 py-1 bg-rose-900/50 hover:bg-rose-900 text-rose-200 rounded font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── Transactions Table ─── */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">Loading transaction records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-1">
              <i className="fa fa-list-alt text-xl"></i>
            </div>
            <p className="text-sm font-semibold text-slate-300">No transactions found</p>
            <p className="text-xs text-slate-400">
              No ledger records match the &ldquo;{filterOptions.find(f => f.value === filterType)?.label}&rdquo; filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3 min-w-[150px]">Date & Time</th>
                  <th className="px-4 py-3 min-w-[280px]">Description</th>
                  <th className="px-4 py-3 text-right">Debit (-)</th>
                  <th className="px-4 py-3 text-right">Credit (+)</th>
                  <th className="px-4 py-3 text-right">Main Balance</th>
                  <th className="px-4 py-3 text-right">Bonus Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transactions.map((txn, idx) => {
                  const globalIndex = (page - 1) * 15 + idx + 1;
                  const isDebit = txn.debit > 0;
                  const isCredit = txn.credit > 0;
                  const isNegativeBalance = txn.main_balance < 0;

                  return (
                    <tr key={txn.uuid || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-400">{globalIndex}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {formatDateTime(txn.created_at)}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-200">
                        <span className="leading-relaxed break-words">{txn.description || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        {isDebit ? (
                          <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            - ৳{txn.debit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        {isCredit ? (
                          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            + ৳{txn.credit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                        <span className={isNegativeBalance ? 'text-rose-400' : 'text-slate-100'}>
                          ৳{txn.main_balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                        ৳{txn.bounce_main_balance.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Pagination Controls ─── */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={page <= 1 || loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <i className="fa fa-chevron-left text-[10px]"></i>
          <span>Previous</span>
        </button>

        <span className="text-xs text-slate-400 font-mono font-medium">
          Page <span className="text-white font-bold">{page}</span>
        </span>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={transactions.length < 15 || loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <span>Next</span>
          <i className="fa fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>
  );
}
