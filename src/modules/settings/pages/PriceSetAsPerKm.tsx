import React, { useEffect, useState, useMemo } from 'react';
import { fetchPriceSetAsPerKmList, fetchCarServiceCategoryList, createOrUpdatePriceSetAsPerKm, deletePriceSetAsPerKm } from '../services/settingsApi';
import type { PriceSetAsPerKmItem, CarServiceCategoryItem } from '../services/settingsApi';
import { useTranslation } from '../../../shared/utils/translation';
import { PopupMessage } from '../../../shared/components/PopupMessage';

const labelCls = "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5";
const selectCls = "w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/50 transition-all text-sm";
const inputCls = "w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/50 transition-all text-sm";

export default function PriceSetAsPerKm() {
  const t = useTranslation();
  const [prices, setPrices] = useState<PriceSetAsPerKmItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<CarServiceCategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<PriceSetAsPerKmItem | null>(null);
  const [selectedServiceCategoryUuid, setSelectedServiceCategoryUuid] = useState<string>('');
  const [pricePerKm, setPricePerKm] = useState<string>('');
  const [minimumBookingPrice, setMinimumBookingPrice] = useState<string>('');
  const [waitingTime, setWaitingTime] = useState<string>('');
  const [waitingPrice, setWaitingPrice] = useState<string>('');
  const [cancellationFee, setCancellationFee] = useState<string>('');
  const [busyStartTime, setBusyStartTime] = useState<string>('08:00:00');
  const [busyEndTime, setBusyEndTime] = useState<string>('10:30:00');
  const [busyTimePricePercentage, setBusyTimePricePercentage] = useState<string>('');
  const [countryCode, setCountryCode] = useState<string>('BD');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Popups & Deletes
  const [popup, setPopup] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'error', message: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteTargetUuid, setDeleteTargetUuid] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      let pricesData: PriceSetAsPerKmItem[] = [];
      let categoriesData: CarServiceCategoryItem[] = [];

      try {
        pricesData = await fetchPriceSetAsPerKmList();
      } catch (err: any) {
        if (err.response?.status === 404 || err.message?.includes('404')) {
          pricesData = [];
        } else {
          throw err;
        }
      }

      try {
        categoriesData = await fetchCarServiceCategoryList();
      } catch (err: any) {
        if (err.response?.status === 404 || err.message?.includes('404')) {
          categoriesData = [];
        } else {
          throw err;
        }
      }

      setPrices(pricesData);
      setServiceCategories(categoriesData);
    } catch (err: any) {
      setError(err.message || 'Error loading pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action Click Handlers
  const handleAddClick = () => {
    setEditItem(null);
    setSelectedServiceCategoryUuid(serviceCategories[0]?.uuid || '');
    setPricePerKm(''); setMinimumBookingPrice(''); setWaitingTime(''); setWaitingPrice('');
    setCancellationFee(''); setBusyStartTime('08:00:00'); setBusyEndTime('10:30:00');
    setBusyTimePricePercentage(''); setCountryCode('BD'); setStatus('ACTIVE'); setFormError(null);
    setShowModal(true);
  };

  const handleSetPriceClick = (mappingUuid: string) => {
    setEditItem(null);
    setSelectedServiceCategoryUuid(mappingUuid);
    setPricePerKm(''); setMinimumBookingPrice(''); setWaitingTime(''); setWaitingPrice('');
    setCancellationFee(''); setBusyStartTime('08:00:00'); setBusyEndTime('10:30:00');
    setBusyTimePricePercentage(''); setCountryCode('BD'); setStatus('ACTIVE'); setFormError(null);
    setShowModal(true);
  };

  const handleEditClick = (item: PriceSetAsPerKmItem) => {
    setEditItem(item);
    setSelectedServiceCategoryUuid(item.car_service_category?.uuid || (serviceCategories[0]?.uuid || ''));
    setPricePerKm(item.price_per_km?.toString() || '');
    setMinimumBookingPrice(item.minimum_booking_price?.toString() || '');
    setWaitingTime(item.waiting_time?.toString() || '');
    setWaitingPrice(item.waiting_price?.toString() || '');
    setCancellationFee(item.cancellation_fee?.toString() || '');
    setBusyStartTime(item.busy_start_time || '08:00:00');
    setBusyEndTime(item.busy_end_time || '10:30:00');
    setBusyTimePricePercentage(item.busy_time_price_percentage?.toString() || '');
    setCountryCode(item.country_code || 'BD');
    setStatus(item.status || 'ACTIVE');
    setFormError(null);
    setShowModal(true);
  };

  const handleDeleteClick = (uuid: string) => {
    setDeleteTargetUuid(uuid);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetUuid) return;
    try {
      setLoading(true);
      setShowDeleteConfirm(false);
      const msg = await deletePriceSetAsPerKm(deleteTargetUuid);
      setDeleteTargetUuid(null);
      await loadData();
      setPopup({ show: true, type: 'success', message: msg || 'Pricing deleted successfully' });
    } catch (err: any) {
      setDeleteTargetUuid(null);
      setPopup({ show: true, type: 'error', message: err.response?.data?.message || err.message || 'Failed to delete price set' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceCategoryUuid) { setFormError('Car Service Category is required'); return; }
    if (!pricePerKm || isNaN(Number(pricePerKm))) { setFormError('Price per KM must be a valid number'); return; }
    if (!minimumBookingPrice || isNaN(Number(minimumBookingPrice))) { setFormError('Minimum booking price must be a valid number'); return; }
    if (!waitingTime || isNaN(Number(waitingTime))) { setFormError('Waiting time must be a valid number'); return; }
    if (!waitingPrice || isNaN(Number(waitingPrice))) { setFormError('Waiting price must be a valid number'); return; }
    if (!cancellationFee || isNaN(Number(cancellationFee))) { setFormError('Cancellation fee must be a valid number'); return; }
    if (!busyStartTime.trim() || !busyEndTime.trim()) { setFormError('Busy hours start/end times are required'); return; }
    if (!busyTimePricePercentage || isNaN(Number(busyTimePricePercentage))) { setFormError('Busy time price percentage must be a valid number'); return; }
    if (!countryCode.trim()) { setFormError('Country code is required'); return; }
    try {
      setSubmitting(true); setFormError(null);
      const msg = await createOrUpdatePriceSetAsPerKm({
        price_per_km: Number(pricePerKm),
        minimum_booking_price: Number(minimumBookingPrice),
        waiting_time: Number(waitingTime),
        waiting_price: Number(waitingPrice),
        cancellation_fee: Number(cancellationFee),
        busy_start_time: busyStartTime.trim(),
        busy_end_time: busyEndTime.trim(),
        busy_time_price_percentage: Number(busyTimePricePercentage),
        country_code: countryCode.trim(),
        car_service_category_uuid: selectedServiceCategoryUuid,
        status,
        ...(editItem ? { uuid: editItem.uuid } : {})
      });
      setShowModal(false);
      await loadData();
      setPopup({ show: true, type: 'success', message: msg });
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error saving price configuration');
    } finally {
      setSubmitting(false);
    }
  };

  // Group hierarchical response to match the service category card layout
  const serviceGroups = useMemo(() => {
    const groups: Record<string, {
      service_name: string;
      service_uuid: string;
      avatar?: string | null;
      status: string;
      vehicles: {
        mapping_uuid: string;
        car_id: number;
        car_uuid: string;
        car_type: string;
        set_capacity: number | string;
        car_avatar?: string | null;
        price_item: PriceSetAsPerKmItem | null;
      }[];
    }> = {};

    prices.forEach((item) => {
      if (item.car_service_category) {
        const sKey = item.car_service_category.service_name;
        if (!groups[sKey]) {
          groups[sKey] = {
            service_name: item.car_service_category.service_name,
            service_uuid: item.car_service_category.uuid || '',
            avatar: item.car_service_category.avatar,
            status: item.car_service_category.status || 'ACTIVE',
            vehicles: []
          };
        }

        if (item.car_service_category.car_category) {
          groups[sKey].vehicles.push({
            mapping_uuid: item.car_service_category.uuid || '',
            car_id: item.car_service_category.car_category.id,
            car_uuid: item.car_service_category.car_category.uuid,
            car_type: item.car_service_category.car_category.car_type,
            set_capacity: item.car_service_category.car_category.set_capacity || 0,
            car_avatar: item.car_service_category.avatar || item.car_service_category.car_category.car_avatar,
            price_item: item.uuid ? item : null
          });
        }
      }
    });

    return Object.values(groups);
  }, [prices]);

  const tabKeys = useMemo(() => ['ALL', ...serviceGroups.map(g => g.service_name)], [serviceGroups]);

  // Filters visible cards by Tab and Search parameters
  const visibleGroups = useMemo(() => {
    let base = serviceGroups;
    if (activeTab !== 'ALL') {
      base = serviceGroups.filter(g => g.service_name === activeTab);
    }

    const q = searchQuery.toLowerCase();
    if (!q) return base;

    return base.filter(group =>
      group.service_name.toLowerCase().includes(q) ||
      group.vehicles.some(v => v.car_type.toLowerCase().includes(q))
    ).map(group => {
      if (group.service_name.toLowerCase().includes(q)) return group;
      return {
        ...group,
        vehicles: group.vehicles.filter(v => v.car_type.toLowerCase().includes(q))
      };
    });
  }, [serviceGroups, activeTab, searchQuery]);

  const getServiceLabel = (name: string) => {
    return name.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{t('priceSetAsPerKm')} List</h2>
          <p className="text-slate-400 text-xs mt-1">Manage rate limits, cancel fees, and busy hours</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 text-sm w-64 transition-all"
              placeholder="Search category or vehicle…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Add Price configuration button */}
          <button onClick={handleAddClick} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/40 border border-indigo-500/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Add Price Set
          </button>

          {/* Refresh button */}
          <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-xl transition-all cursor-pointer">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      {!loading && !error && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {tabKeys.map((key) => {
            const isActive = activeTab === key;
            const count = key === 'ALL'
              ? prices.length
              : prices.filter(p => p.car_service_category?.service_name === key).length;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950/20'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {key === 'ALL' ? 'All Services' : getServiceLabel(key)}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main View Body ── */}
      <div>
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-400 text-xs font-semibold">Loading pricing maps…</p>
          </div>
        )}

        {error && (
          <div className="px-5 py-4 bg-rose-950/20 border border-rose-700/50 text-rose-300 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {!loading && !error && (
          visibleGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
              <svg className="w-12 h-12 mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-slate-400 text-sm">No pricing details match your parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {visibleGroups.map((group) => {
                return (
                  <div key={group.service_name} className="flex flex-col bg-slate-900 border border-slate-800/80 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden">
                    
                    {/* Service Card Header */}
                    <div className="p-5 border-b border-slate-850 bg-slate-950/20 flex items-center justify-between">
                      <div>
                        <h3 className="text-md font-bold text-white leading-snug">{getServiceLabel(group.service_name)}</h3>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{group.service_uuid}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${
                        group.status === 'ACTIVE'
                          ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                          : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${group.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        Service {group.status}
                      </span>
                    </div>

                    {/* Vehicles & Price settings List */}
                    <div className="p-5 space-y-4 flex-1">
                      {group.vehicles.map((v) => {
                        const price = v.price_item;
                        const isConfigured = !!price;

                        return (
                          <div key={v.car_uuid} className={`border rounded-2xl overflow-hidden p-4 transition-all duration-300 ${
                            isConfigured
                              ? 'bg-slate-950/40 border-slate-800 hover:border-slate-750'
                              : 'bg-slate-900/40 border-dashed border-slate-800 hover:border-slate-700/60'
                          }`}>
                            
                            {/* Vehicle mini-row */}
                            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-850/60">
                              <div className="flex items-center gap-2.5">
                                <span className="px-2.5 py-0.8 bg-slate-800 text-slate-200 rounded-md text-xs font-bold border border-slate-700/80">
                                  {v.car_type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">({v.set_capacity} Seats)</span>
                              </div>

                              {/* Action Buttons */}
                              {isConfigured ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditClick(price)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-slate-700/80">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Edit
                                  </button>
                                  <button onClick={() => handleDeleteClick(price.uuid || '')} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-slate-700/80">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => handleSetPriceClick(v.mapping_uuid)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer border border-indigo-500/20">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                  Set Pricing
                                </button>
                              )}
                            </div>

                            {/* Pricing Specifications Display */}
                            {isConfigured ? (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3.5">
                                {/* Price per km */}
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Price / KM</span>
                                  <span className="text-sm font-extrabold text-emerald-400 mt-1 block">৳{price.price_per_km?.toFixed(2)}</span>
                                </div>

                                {/* Min booking price */}
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Min Booking</span>
                                  <span className="text-sm font-bold text-slate-200 mt-1 block">৳{price.minimum_booking_price?.toFixed(2)}</span>
                                </div>

                                {/* Waiting rules */}
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Waiting Limit</span>
                                  <span className="text-xs font-semibold text-slate-300 mt-1 block">
                                    {price.waiting_time} min <span className="text-[10px] text-slate-500">· ৳{price.waiting_price}/m</span>
                                  </span>
                                </div>

                                {/* Cancel fee */}
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Cancel Fee</span>
                                  <span className="text-xs font-bold text-slate-200 mt-1 block">৳{price.cancellation_fee?.toFixed(2)}</span>
                                </div>

                                {/* Busy hours */}
                                <div className="col-span-2">
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Busy hours slot</span>
                                  <span className="text-xs font-semibold text-slate-350 mt-1 block">
                                    {price.busy_start_time} – {price.busy_end_time}
                                  </span>
                                </div>

                                {/* Busy premium percentage */}
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Busy Hours Rate</span>
                                  <span className="mt-1 inline-flex items-center px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-extrabold rounded-md border border-amber-500/20 font-mono">
                                    +{price.busy_time_price_percentage}%
                                  </span>
                                </div>

                                {/* Country & status */}
                                <div>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Region & Status</span>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700/60 rounded text-[9px] font-extrabold font-mono uppercase">{price.country_code}</span>
                                    <span className={`w-2 h-2 rounded-full ${price.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'}`} title={price.status} />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="py-4.5 text-center bg-slate-950/15 rounded-xl mt-2 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span className="text-xs text-slate-500 font-semibold italic">Pricing specifications not set for this vehicle type.</span>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl border-b border-slate-700/40">
                <h3 className="text-base font-bold text-white">{editItem ? 'Edit Price Set' : 'Configure Price Set'}</h3>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && <div className="px-3.5 py-2.5 bg-rose-900/30 border border-rose-700/40 text-rose-300 rounded-xl text-xs font-medium">{formError}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Car Service Category *</label>
                    <select className={selectCls} value={selectedServiceCategoryUuid} onChange={(e) => setSelectedServiceCategoryUuid(e.target.value)} required>
                      <option value="">Select Service Category</option>
                      {serviceCategories.map(sc => (
                        <option key={sc.uuid} value={sc.uuid}>
                          {getServiceLabel(sc.service_name)} (Car: {sc.car_category?.car_type.replace(/_/g, ' ') || 'None'})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={labelCls}>Status *</label>
                    <select className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)} required>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={labelCls}>Price Per KM *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 15.00" value={pricePerKm} onChange={(e) => setPricePerKm(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className={labelCls}>Minimum Booking Price *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 100.00" value={minimumBookingPrice} onChange={(e) => setMinimumBookingPrice(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className={labelCls}>Waiting Time (Minutes) *</label>
                    <input type="number" className={inputCls} placeholder="e.g. 10" value={waitingTime} onChange={(e) => setWaitingTime(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className={labelCls}>Waiting Price (Per Min) *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 1.50" value={waitingPrice} onChange={(e) => setWaitingPrice(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className={labelCls}>Cancellation Fee *</label>
                    <input type="number" step="0.01" className={inputCls} placeholder="e.g. 50.00" value={cancellationFee} onChange={(e) => setCancellationFee(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className={labelCls}>Country Code *</label>
                    <input type="text" className={inputCls} placeholder="e.g. BD" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className={labelCls}>Busy Start Time (HH:MM:SS) *</label>
                    <input type="text" className={inputCls} placeholder="e.g. 08:00:00" value={busyStartTime} onChange={(e) => setBusyStartTime(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className={labelCls}>Busy End Time (HH:MM:SS) *</label>
                    <input type="text" className={inputCls} placeholder="e.g. 10:30:00" value={busyEndTime} onChange={(e) => setBusyEndTime(e.target.value)} required />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className={labelCls}>Busy Time Price Percentage (%) *</label>
                    <input type="number" className={inputCls} placeholder="e.g. 10" value={busyTimePricePercentage} onChange={(e) => setBusyTimePricePercentage(e.target.value)} required />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4.5 py-2.5 text-xs font-semibold text-slate-300 bg-slate-850 hover:bg-slate-800 rounded-xl transition-all cursor-pointer">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-5.5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-950/25">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"></div>
        </>
      )}

      <PopupMessage show={popup.show} type={popup.type} message={popup.message} onClose={() => setPopup(prev => ({ ...prev, show: false }))} />

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-855 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-gradient-to-r from-rose-600 to-red-600 p-4.5 flex items-center gap-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="text-white font-bold text-base">Confirm Delete</h3>
              </div>
              <div className="p-6 text-center">
                <p className="text-slate-300 text-sm font-medium">Are you sure you want to delete this price set?</p>
                <p className="text-slate-500 text-xs mt-1.5">This pricing configuration will be deleted permanently.</p>
              </div>
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteTargetUuid(null); }} className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-850 hover:bg-slate-800 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button onClick={confirmDelete} className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/20">Yes, Delete</button>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"></div>
        </>
      )}
    </div>
  );
}
