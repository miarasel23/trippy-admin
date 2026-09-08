import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchCommissionInsuranceList,
  createCommissionInsurance,
  updateCommissionInsurance,
  deleteCommissionInsurance,
} from '../services/settingsApi';
import type { CommissionInsuranceItem } from '../services/types';
import { useTranslation } from '../../../shared/utils/translation';
import { PopupMessage } from '../../../shared/components/PopupMessage';

const inputCls =
  'w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm';
const labelCls =
  'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5';
const selectCls =
  'w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm';

export default function CommissionInsuranceList() {
  const t = useTranslation();

  // Data states
  const [items, setItems] = useState<CommissionInsuranceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states (Add / Edit)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<CommissionInsuranceItem | null>(null);
  const [amountRange, setAmountRange] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');
  const [insurancePercentage, setInsurancePercentage] = useState<string>('');
  const [cancellationFinePercentage, setCancellationFinePercentage] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Live calculation preview test amount
  const [testAmount, setTestAmount] = useState<number>(1000);

  // Notification and delete states
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);
  const [popup, setPopup] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
    title?: string;
  }>({ show: false, type: 'error', message: '' });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<CommissionInsuranceItem | null>(null);

  // Fetch list
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchCommissionInsuranceList({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setItems(res.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load commission and insurance slabs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditItem(null);
    setAmountRange('');
    setPercentage('10');
    setInsurancePercentage('2.5');
    setCancellationFinePercentage('5');
    setStatus('ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: CommissionInsuranceItem) => {
    setEditItem(item);
    setAmountRange(item.amount_range.toString());
    setPercentage(item.percentage.toString());
    setInsurancePercentage(item.insurance_percentage.toString());
    setCancellationFinePercentage(item.booking_cancelled_fine_percentage.toString());
    setStatus(item.status || 'ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  const handleDeletePrompt = (item: CommissionInsuranceItem) => {
    setDeleteTarget(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      setShowDeleteConfirm(false);
      const msg = await deleteCommissionInsurance(deleteTarget.uuid);
      setDeleteTarget(null);
      await loadData();
      setPopup({
        show: true,
        type: 'success',
        title: 'Deleted Successfully',
        message: msg || 'Commission slab was deleted successfully.',
      });
    } catch (err: any) {
      setDeleteTarget(null);
      setPopup({
        show: true,
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || err.message || 'Failed to delete commission slab.',
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amountRange);
    const parsedPercentage = parseFloat(percentage);
    const parsedInsurance = parseFloat(insurancePercentage);
    const parsedFine = parseFloat(cancellationFinePercentage);

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setFormError('Trip fare slab range must be a number greater than or equal to 0.');
      return;
    }
    if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
      setFormError('Commission percentage must be between 0 and 100.');
      return;
    }
    if (isNaN(parsedInsurance) || parsedInsurance < 0 || parsedInsurance > 100) {
      setFormError('Insurance percentage must be between 0 and 100.');
      return;
    }
    if (isNaN(parsedFine) || parsedFine < 0 || parsedFine > 100) {
      setFormError('Cancellation fine percentage must be between 0 and 100.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        amount_range: parsedAmount,
        percentage: parsedPercentage,
        insurance_percentage: parsedInsurance,
        booking_cancelled_fine_percentage: parsedFine,
        status,
        ...(editItem ? { uuid: editItem.uuid } : {}),
      };

      let msg = '';
      if (editItem) {
        msg = await updateCommissionInsurance(payload);
      } else {
        msg = await createCommissionInsurance(payload);
      }

      setShowModal(false);
      await loadData();
      setPopup({
        show: true,
        type: 'success',
        title: editItem ? 'Updated Successfully' : 'Created Successfully',
        message: msg || (editItem ? 'Slab updated successfully' : 'Slab created successfully'),
      });
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          err.message ||
          'Failed to save commission and insurance slab.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUuid = (uuid: string) => {
    navigator.clipboard.writeText(uuid);
    setCopiedUuid(uuid);
    setTimeout(() => setCopiedUuid(null), 2000);
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        item.uuid.toLowerCase().includes(q) ||
        item.amount_range.toString().includes(q) ||
        item.percentage.toString().includes(q) ||
        item.insurance_percentage.toString().includes(q) ||
        item.status.toLowerCase().includes(q);

      return matchSearch;
    });
  }, [items, searchQuery]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.status === 'ACTIVE').length;
    const avgCommission =
      total > 0
        ? (items.reduce((acc, curr) => acc + curr.percentage, 0) / total).toFixed(1)
        : '0';
    const avgInsurance =
      total > 0
        ? (items.reduce((acc, curr) => acc + curr.insurance_percentage, 0) / total).toFixed(1)
        : '0';
    return { total, active, avgCommission, avgInsurance };
  }, [items]);

  // Live simulation values for modal
  const sim = useMemo(() => {
    const amt = testAmount > 0 ? testAmount : 1000;
    const pComm = parseFloat(percentage) || 0;
    const pIns = parseFloat(insurancePercentage) || 0;
    const pFine = parseFloat(cancellationFinePercentage) || 0;

    const commAmt = amt * (pComm / 100);
    const afterComm = Math.max(0, amt - commAmt);
    const insAmt = afterComm * (pIns / 100);
    const driverEarning = Math.max(0, afterComm - insAmt);
    const fineAmt = amt * (pFine / 100);

    return {
      commAmt: commAmt.toFixed(2),
      insAmt: insAmt.toFixed(2),
      driverEarning: driverEarning.toFixed(2),
      fineAmt: fineAmt.toFixed(2),
    };
  }, [testAmount, percentage, insurancePercentage, cancellationFinePercentage]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                {t('commissionInsurance') || 'Commission & Insurance'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure trip fare slabs, platform service charges, passenger insurance, and cancellation fine rates.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            title="Refresh list"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`}
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

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Slab</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Slabs</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Slabs</p>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{stats.active}</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Avg Commission</p>
            <p className="text-xl font-bold text-indigo-400 mt-0.5">{stats.avgCommission}%</p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Avg Insurance</p>
            <p className="text-xl font-bold text-purple-400 mt-0.5">{stats.avgInsurance}%</p>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Table Filters Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/95 border-b border-slate-800">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                placeholder="Search by amount, %, UUID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Status Filter */}
            <div className="w-36">
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="text-white font-semibold">{filteredItems.length}</span> of{' '}
            <span className="text-white font-semibold">{items.length}</span> slabs
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-6 p-4 bg-rose-900/30 border border-rose-700/50 rounded-xl text-rose-300 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="text-xs text-slate-400">Loading commission and insurance slabs...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-200">No slabs found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search query or status filter.'
                  : 'No commission slabs have been created yet. Click "Add New Slab" to get started.'}
              </p>
              {!searchQuery && statusFilter === 'ALL' && (
                <button
                  onClick={handleOpenAddModal}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/30"
                >
                  Create First Slab
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-4 py-3.5 w-14 font-semibold text-center">#</th>
                  <th className="px-4 py-3.5 font-semibold">Slab Fare Ceiling</th>
                  <th className="px-4 py-3.5 font-semibold">Commission</th>
                  <th className="px-4 py-3.5 font-semibold">Insurance</th>
                  <th className="px-4 py-3.5 font-semibold">Cancel Fine</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">UUID</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item, index) => {
                  const isCopied = copiedUuid === item.uuid;
                  return (
                    <tr
                      key={item.uuid}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* SL No */}
                      <td className="px-4 py-4 text-center text-slate-500 font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Amount Range Ceiling */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-slate-800 border border-slate-700/80 rounded-lg font-semibold text-slate-100 font-mono text-sm shadow-sm">
                            ৳ {Number(item.amount_range).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] text-slate-400">max</span>
                        </div>
                      </td>

                      {/* Commission % */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-900/30 border border-indigo-700/50 text-indigo-300 font-medium rounded-lg text-xs">
                          <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item.percentage}%
                        </span>
                      </td>

                      {/* Insurance % */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 font-medium rounded-lg text-xs">
                          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          {item.insurance_percentage}%
                        </span>
                      </td>

                      {/* Fine % */}
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-900/30 border border-amber-700/50 text-amber-300 font-medium rounded-lg text-xs">
                          <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {item.booking_cancelled_fine_percentage}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {item.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-400 border border-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            INACTIVE
                          </span>
                        )}
                      </td>

                      {/* UUID with Copy */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleCopyUuid(item.uuid)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/70 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all group/uuid cursor-pointer"
                          title="Click to copy UUID"
                        >
                          <span className="max-w-[120px] truncate">{item.uuid}</span>
                          <svg
                            className={`w-3.5 h-3.5 shrink-0 ${isCopied ? 'text-emerald-400' : 'text-slate-500 group-hover/uuid:text-slate-300'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {isCopied ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            )}
                          </svg>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                            title="Edit Slab"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeletePrompt(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                            title="Delete Slab"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all transform scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={
                        editItem
                          ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                          : 'M12 4v16m8-8H4'
                      }
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editItem ? 'Edit Commission & Insurance Slab' : 'Add Commission & Insurance Slab'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editItem
                      ? `Updating slab for UUID: ${editItem.uuid}`
                      : 'Define trip fare ceiling and calculation percentages'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-900/40 border border-rose-700/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Amount Range */}
                <div>
                  <label className={labelCls}>
                    Trip Fare Ceiling (Amount Range) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="e.g. 500.00"
                      className={`${inputCls} pl-8`}
                      value={amountRange}
                      onChange={(e) => setAmountRange(e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Maximum fare amount this slab covers (e.g. up to ৳ 500).
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className={labelCls}>Status *</label>
                  <select
                    className={selectCls}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Only ACTIVE slabs are evaluated for trip calculations.
                  </p>
                </div>

                {/* Commission % */}
                <div>
                  <label className={labelCls}>
                    Platform Commission (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      placeholder="e.g. 10.00"
                      className={`${inputCls} pr-8`}
                      value={percentage}
                      onChange={(e) => setPercentage(e.target.value)}
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-semibold text-sm">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Service charge taken from the trip fare.
                  </p>
                </div>

                {/* Insurance % */}
                <div>
                  <label className={labelCls}>
                    Passenger Insurance (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      placeholder="e.g. 2.50"
                      className={`${inputCls} pr-8`}
                      value={insurancePercentage}
                      onChange={(e) => setInsurancePercentage(e.target.value)}
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-semibold text-sm">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Calculated on fare remaining after commission.
                  </p>
                </div>

                {/* Cancellation Fine % */}
                <div className="md:col-span-2">
                  <label className={labelCls}>
                    Booking Cancellation Fine (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      placeholder="e.g. 5.00"
                      className={`${inputCls} pr-8`}
                      value={cancellationFinePercentage}
                      onChange={(e) => setCancellationFinePercentage(e.target.value)}
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-semibold text-sm">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Penalty percentage assessed if driver/booking is cancelled.
                  </p>
                </div>
              </div>

              {/* Live Calculation Simulator */}
              <div className="p-4 bg-slate-850/90 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Live Calculation Simulator
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Sample Fare:</span>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1 text-[11px] text-slate-400">৳</span>
                      <input
                        type="number"
                        min="1"
                        className="w-full pl-5 pr-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-white text-right font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={testAmount}
                        onChange={(e) => setTestAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-750">
                    <p className="text-[10px] text-slate-400 font-medium">Commission</p>
                    <p className="text-sm font-bold text-indigo-400 font-mono mt-0.5">
                      ৳ {sim.commAmt}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-750">
                    <p className="text-[10px] text-slate-400 font-medium">Insurance</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      ৳ {sim.insAmt}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-750">
                    <p className="text-[10px] text-slate-400 font-medium">Driver Earning</p>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">
                      ৳ {sim.driverEarning}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-750">
                    <p className="text-[10px] text-slate-400 font-medium">Cancel Fine</p>
                    <p className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                      ৳ {sim.fineAmt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {submitting && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  <span>{editItem ? 'Save Changes' : 'Create Slab'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Delete Commission Slab?</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1.5 text-xs text-slate-300 mb-5">
              <div className="flex justify-between">
                <span className="text-slate-400">Fare Ceiling:</span>
                <span className="font-semibold text-white">৳ {deleteTarget.amount_range}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Commission Rate:</span>
                <span className="font-semibold text-indigo-400">{deleteTarget.percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Insurance Rate:</span>
                <span className="font-semibold text-emerald-400">{deleteTarget.insurance_percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UUID:</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">{deleteTarget.uuid}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast / PopupMessage */}
      <PopupMessage
        show={popup.show}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup({ show: false, type: 'error', message: '' })}
      />
    </div>
  );
}
