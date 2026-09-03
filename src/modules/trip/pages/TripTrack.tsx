import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRentalTripList, cancelTripByAdmin, updateTripBid, acceptTripForCustomer } from '../services/tripApi';
import { fetchCustomerList } from '../../customer/services/customerApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import type { AllRentalTripItem } from '../services/types';
import type { CustomerUserItem } from '../../customer/services/types';
import noImage from '../../../shared/assets/images/no-image.png';
import MapModal from '../components/MapModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import CancelTripModal from '../components/CancelTripModal';
import { useToast } from '../../../shared/hooks/useToast';
import { PopupMessage } from '../../../shared/components/PopupMessage';

const formatTripDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return '—';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

const formatEnumText = (text: string | null | undefined) => {
  if (!text) return '—';
  return text.replace(/_/g, ' ');
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    ACCEPTED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 ring-emerald-500/20',
    REQUESTED: 'bg-amber-500/15 text-amber-300 border-amber-500/40 ring-amber-500/20',
    COMPLETED: 'bg-blue-500/15 text-blue-300 border-blue-500/40 ring-blue-500/20',
    CANCELLED: 'bg-rose-500/15 text-rose-300 border-rose-500/40 ring-rose-500/20',
    IN_PROGRESS: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 ring-cyan-500/20',
  };
  const cls = map[status] ?? 'bg-slate-500/15 text-slate-300 border-slate-500/40';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cls}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-90" />
      {formatEnumText(status)}
    </span>
  );
};

const Avatar = ({ src, alt, size = 'md' }: { src: string; alt: string; size?: 'sm' | 'md' }) => {
  const sz = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12';
  return (
    <div className={`${sz} rounded-xl bg-white border border-white/20 shadow-md overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5`}>
      <img src={src} alt={alt} className="w-full h-full object-contain"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }} />
    </div>
  );
};

const InfoRow = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-400 font-medium min-w-[62px] shrink-0">{label}</span>
    <span className={`text-xs font-semibold ${accent ?? 'text-slate-100'}`}>{value}</span>
  </div>
);

export default function TripTrack() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const { showToast } = useToast();
  const [trips, setTrips] = useState<AllRentalTripItem[]>([]);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [tripStatus, setTripStatus] = useState<string>('');
  const [customerUuid, setCustomerUuid] = useState<string>('');
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [today, setToday] = useState<boolean>(false);

  useEffect(() => {
    if (startDate || endDate) setToday(false);
  }, [startDate, endDate]);

  const [confirmPopup, setConfirmPopup] = useState<{
    show: boolean; title: string; message: string; onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => { } });

  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({});
  const [selectedTripForMap, setSelectedTripForMap] = useState<AllRentalTripItem | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [cancelTripUuid, setCancelTripUuid] = useState<string | null>(null);
  const [cancelDriverUuid, setCancelDriverUuid] = useState<string | null>(null);
  const [cancelComment, setCancelComment] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [editingBid, setEditingBid] = useState<{ trip_uuid: string; driver_uuid: string; bid_uuid: string; bid_amount: string } | null>(null);
  const [updatingBid, setUpdatingBid] = useState<boolean>(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  const handleAcceptBid = async (bid_uuid: string, custUuid?: string) => {
    try {
      setAcceptingBid(bid_uuid);
      const message = await acceptTripForCustomer({ bid_uuid, customer_uuid: custUuid || undefined });
      showToast('success', 'Trip Accepted', message);
      loadTrips();
    } catch (err: any) {
      showToast('error', 'Accept Failed', err.message || 'Failed to accept trip');
    } finally { setAcceptingBid(null); }
  };

  const handleUpdateBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBid || !editingBid.bid_amount) return;
    try {
      setUpdatingBid(true);
      const message = await updateTripBid({ trip_uuid: editingBid.trip_uuid, driver_uuid: editingBid.driver_uuid, bid_amount: editingBid.bid_amount });
      showToast('success', 'Bid Updated', message);
      setEditingBid(null);
      loadTrips();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Failed to update bid');
    } finally { setUpdatingBid(false); }
  };

  const handleCancelTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTripUuid || !cancelComment.trim()) return;
    try {
      setCancelling(true);
      setCancelError(null);
      const message = await cancelTripByAdmin({ trip_uuid: cancelTripUuid, comment: cancelComment.trim(), driver_uuid: cancelDriverUuid || undefined });
      setCancelTripUuid(null); setCancelDriverUuid(null); setCancelComment('');
      showToast('success', 'Trip Cancelled', message);
      loadTrips();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to cancel trip';
      setCancelError(errMsg);
      showToast('error', 'Cancellation Failed', errMsg);
    } finally { setCancelling(false); }
  };

  useEffect(() => {
    fetchCustomerList().then(setCustomers).catch(console.error);
  }, []);

  const currentCustomer = customers.find(c => c.uuid === customerUuid);

  const loadTrips = async (page = currentPage) => {
    try {
      setLoading(true); setError(null);
      const res = await fetchAllRentalTripList({
        customer_uuid: customerUuid || undefined,
        trip_status: tripStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        phone: phone || undefined,
        customer_phone: customerPhone || undefined,
        driver_phone: driverPhone || undefined,
        today: today || undefined,
        page,
      });
      setTrips(res.data); setTotalTrips(res.total); setCurrentPage(res.page);
    } catch (err: any) {
      setError(err.message || 'Error loading trips'); setTrips([]); setTotalTrips(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { setCurrentPage(1); loadTrips(1); }, [tripStatus, customerUuid, startDate, endDate, phone, customerPhone, driverPhone, today]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.select-customer-container')) {
        setShowSuggestions(false);
        if (!currentCustomer) setCustomerQuery('');
        else setCustomerQuery(currentCustomer.full_name ? `${currentCustomer.full_name} (${currentCustomer.phone_number})` : currentCustomer.phone_number);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [currentCustomer]);

  const toggleExpand = (uuid: string) => setExpandedTrips(p => ({ ...p, [uuid]: !p[uuid] }));

  const suggestedCustomers = customers.filter(c => {
    const q = customerQuery.toLowerCase();
    return (c.full_name || '').toLowerCase().includes(q) || (c.phone_number || '').toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(totalTrips / 50);

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/50 text-sm transition-all";
  const labelCls = "text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="space-y-6">
      {/* ── Filter Panel ─────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-800/60 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Trip Track Dashboard</h1>
            <p className="text-slate-400 text-xs mt-0.5">Filter and monitor all rental trips in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-700">
              {totalTrips} trips total
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Customer search */}
          <div className="relative select-customer-container col-span-2 sm:col-span-1">
            <label className={labelCls}>Customer</label>
            <div className="relative">
              <input type="text" className={inputCls} placeholder="Name or phone…"
                value={customerQuery} onFocus={() => setShowSuggestions(true)}
                onChange={e => { setCustomerQuery(e.target.value); setShowSuggestions(true); }} />
              {customerQuery && (
                <button type="button" onClick={() => { setCustomerQuery(''); setCustomerUuid(''); setShowSuggestions(false); }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              {showSuggestions && (
                <div className="absolute left-0 top-full mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto py-1">
                  {suggestedCustomers.length === 0
                    ? <div className="px-4 py-3 text-xs text-slate-400 italic">No results</div>
                    : suggestedCustomers.map(c => (
                      <button key={c.uuid} type="button"
                        onClick={() => { setCustomerUuid(c.uuid); setCustomerQuery(c.full_name ? `${c.full_name} (${c.phone_number})` : c.phone_number); setShowSuggestions(false); }}
                        className={`w-full flex flex-col px-4 py-2.5 text-left hover:bg-slate-800 transition-colors text-sm ${customerUuid === c.uuid ? 'bg-violet-600/20 text-violet-300 font-semibold' : 'text-slate-300'}`}>
                        <span className="font-semibold">{c.full_name || 'No Name'}</span>
                        <span className="text-xs text-slate-400 font-mono">{c.phone_number}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Phone</label>
            <input type="text" className={inputCls} placeholder="Any phone…" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Customer Phone</label>
            <input type="text" className={inputCls} placeholder="019XXXXXXXX" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Driver Phone</label>
            <input type="text" className={inputCls} placeholder="017XXXXXXXX" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={tripStatus} onChange={e => setTripStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" className={inputCls} value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input type="date" className={inputCls} value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className={`w-9 h-5 rounded-full transition-colors relative ${today ? 'bg-violet-600' : 'bg-slate-700'}`}
                onClick={() => setToday(p => !p)}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${today ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Today Only</span>
            </label>
            <button onClick={() => { setCustomerUuid(''); setCustomerQuery(''); setPhone(''); setCustomerPhone(''); setDriverPhone(''); setStartDate(''); setEndDate(''); setToday(false); setTripStatus(''); }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all border border-slate-700/60 cursor-pointer">
              ↺ Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── Loading ────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-28 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading trips…</p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-rose-900/20 border border-rose-700/50 text-rose-300 rounded-xl text-sm font-medium">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          {error}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">

          {/* Table toolbar */}
          <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-sm text-slate-300 font-medium">
                Showing <span className="text-white font-bold">{trips.length}</span>
                <span className="text-slate-400"> of </span>
                <span className="text-white font-bold">{totalTrips}</span>
                <span className="text-slate-400"> total trips</span>
              </span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button disabled={currentPage <= 1} onClick={() => loadTrips(currentPage - 1)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800/60 rounded-lg border border-slate-700/60 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button disabled={currentPage >= totalPages} onClick={() => loadTrips(currentPage + 1)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Next →
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">Driver</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">Fare</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider">Schedule</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider">Bids</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-slate-400 text-sm font-medium">No trips match your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : trips.map((trip, idx) => {
                  const customer = trip.customer;
                  const customerAvatar = customer?.profile_picture ? `${newwork_image_url}${customer.profile_picture}` : noImage;
                  const acceptedBid = trip.bids?.find(b => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS' || b.status === 'COMPLETED');
                  const acceptedDriver = acceptedBid?.driver ?? null;
                  const globalIdx = (currentPage - 1) * 50 + idx + 1;
                  const isExpanded = expandedTrips[trip.trip_details.uuid];
                  const isCANCELLED = trip.trip_details.trip_status === 'CANCELLED';

                  const rowBg = isCANCELLED
                    ? 'bg-rose-950/10 hover:bg-rose-950/20'
                    : 'hover:bg-slate-800/40';

                  return (
                    <React.Fragment key={trip.trip_details.uuid}>
                      {/* ── Main row ── */}
                      <tr className={`group border-b border-slate-800/50 transition-colors ${rowBg}`}>

                        {/* # */}
                        <td className="px-4 py-4 text-center">
                          <span className="text-xs text-slate-400 font-mono font-semibold tabular-nums">{globalIdx}</span>
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-4">
                          {trip.trip_details.car_category ? (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                title="Click to preview vehicle image"
                                onClick={() => trip.trip_details.car_category && setPreviewImage({ url: `${newwork_image_url}${trip.trip_details.car_category.car_avatar}`, title: trip.trip_details.car_category.car_type })}
                                className="w-16 h-12 rounded-xl bg-white border border-slate-200/20 shadow-md overflow-hidden flex items-center justify-center p-1 shrink-0 hover:ring-2 hover:ring-violet-500/60 transition-all cursor-pointer"
                              >
                                <img src={`${newwork_image_url}${trip.trip_details.car_category?.car_avatar || ''}`}
                                  alt={trip.trip_details.car_category?.car_type || ''}
                                  className="w-full h-full object-contain"
                                  onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }} />
                              </button>
                              <div>
                                <p className="text-sm font-bold text-slate-100 leading-snug">{trip.trip_details.car_category.car_type}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{trip.trip_details.car_category.set_capacity} seats</p>
                                <span className="mt-1 inline-block text-[11px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md">
                                  {formatEnumText(trip.trip_details.service_name)}
                                </span>
                              </div>
                            </div>
                          ) : <span className="text-slate-500 text-xs italic">N/A</span>}
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {/* Clickable avatar → image preview */}
                            <button
                              type="button"
                              title="Click to preview photo"
                              onClick={() => setPreviewImage({ url: customerAvatar, title: customer?.name || 'Customer' })}
                              className="shrink-0 ring-0 hover:ring-2 hover:ring-violet-500/60 rounded-xl transition-all cursor-pointer"
                            >
                              <Avatar src={customerAvatar} alt={customer?.name || 'Customer'} />
                            </button>
                            <div>
                              {/* Clickable name → customer trip history */}
                              <button
                                type="button"
                                onClick={() => customer?.customer_uuid && navigate(`/dashboard/trip?customer_uuid=${customer.customer_uuid}`)}
                                className="text-sm font-bold text-slate-100 hover:text-violet-400 leading-snug text-left transition-colors cursor-pointer group flex items-center gap-1"
                                title="View customer trip history"
                              >
                                {customer?.name || 'Anonymous'}
                                <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </button>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">{customer?.phone || '—'}</p>
                              {customer?.average_rating !== undefined && (
                                <p className="text-xs text-amber-400 mt-0.5 font-medium">
                                  ★ {customer.average_rating.toFixed(1)}
                                  <span className="text-slate-500 ml-1">({customer.total_trip_complete}/{customer.total_trip_count})</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Driver */}
                        <td className="px-4 py-4">
                          {acceptedDriver ? (
                            <div className="flex items-center gap-3">
                              {/* Clickable avatar → image preview */}
                              <button
                                type="button"
                                title="Click to preview photo"
                                onClick={() => setPreviewImage({ url: acceptedDriver.profile_picture ? `${newwork_image_url}${acceptedDriver.profile_picture}` : noImage, title: acceptedDriver.name || 'Driver' })}
                                className="shrink-0 ring-0 hover:ring-2 hover:ring-violet-500/60 rounded-xl transition-all cursor-pointer"
                              >
                                <Avatar src={acceptedDriver.profile_picture ? `${newwork_image_url}${acceptedDriver.profile_picture}` : noImage} alt={acceptedDriver.name || 'Driver'} />
                              </button>
                              <div>
                                {/* Clickable name → rider list */}
                                <button
                                  type="button"
                                  onClick={() => navigate(`/dashboard/rider?search=${encodeURIComponent(acceptedDriver.phone || acceptedDriver.name || '')}`)}
                                  className="text-sm font-bold text-slate-100 hover:text-violet-400 leading-snug text-left transition-colors cursor-pointer group flex items-center gap-1"
                                  title="View driver profile"
                                >
                                  {acceptedDriver.name || 'Anonymous'}
                                  <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                </button>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{acceptedDriver.phone}</p>
                                {acceptedBid && (
                                  <p className="text-xs text-emerald-400 mt-0.5 font-bold">{acceptedBid.bid_amount} ৳ bid</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </div>
                              <span className="text-slate-500 text-xs font-medium">Unassigned</span>
                            </div>
                          )}
                        </td>

                        {/* Route */}
                        <td className="px-4 py-4 max-w-[220px]">
                          <div className="space-y-2">
                            {trip.location_details?.pickup_locations?.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                <p className="text-xs text-slate-200 leading-snug line-clamp-2">{trip.location_details.pickup_locations[0].address}</p>
                              </div>
                            )}
                            {trip.location_details?.dropoff_locations?.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="mt-1 w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                                <p className="text-xs text-slate-200 leading-snug line-clamp-2">{trip.location_details.dropoff_locations[0].address}</p>
                              </div>
                            )}
                            {((trip.location_details?.pickup_locations?.length > 0) || (trip.location_details?.dropoff_locations?.length > 0)) && (
                              <button onClick={() => { setMapZoom(11); setSelectedTripForMap(trip); }}
                                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                View Route on Map
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Fare */}
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <InfoRow label="System" value={`${trip.trip_details.offer_ammount} ৳`} />
                            <InfoRow label="Offered" value={`${trip.trip_details.customer_offer_ammount} ৳`} accent="text-amber-400 font-bold" />
                            {acceptedBid && <InfoRow label="Accepted" value={`${acceptedBid.bid_amount} ৳`} accent="text-emerald-400 font-bold" />}
                            <div className="pt-0.5">
                              <InfoRow label="Payment" value={formatEnumText(trip.trip_details.payment_method)} accent="text-slate-200" />
                            </div>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start Time</p>
                              <p className="text-xs text-slate-100 font-mono font-medium leading-snug">{formatTripDateTime(trip.trip_details.start_datetime)}</p>
                            </div>
                            {trip.trip_details.end_datetime && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Return Time</p>
                                <p className="text-xs text-slate-100 font-mono font-medium leading-snug">{formatTripDateTime(trip.trip_details.end_datetime)}</p>
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400 font-mono pt-0.5">Created: {formatTripDateTime(trip.trip_details.created_at)}</p>
                          </div>
                        </td>

                        {/* Bids */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shadow-inner">
                              <span className="text-lg font-bold text-white leading-none">{trip.total_bids ?? 0}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">bids</span>
                            </div>
                            {trip.bids && trip.bids.length > 0 && (
                              <button onClick={() => toggleExpand(trip.trip_details.uuid)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isExpanded ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-violet-500/40 hover:text-violet-300'}`}>
                                {isExpanded ? '▲ Hide' : '▼ View'}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-2.5">
                            <StatusBadge status={trip.trip_details.trip_status} />
                            {(trip.trip_details.trip_status === 'REQUESTED' || trip.trip_details.trip_status === 'ACCEPTED') && (
                              <button
                                onClick={() => { setCancelTripUuid(trip.trip_details.uuid); setCancelDriverUuid(acceptedDriver?.driver_uuid || null); setCancelComment(''); setCancelError(null); }}
                                className="text-xs font-semibold px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── Bids expansion ── */}
                      {isExpanded && trip.bids && trip.bids.length > 0 && (
                        <tr className="border-b border-slate-800/50">
                          <td colSpan={9} className="p-0">
                            <div className="bg-slate-950/70 border-t border-violet-500/15 px-8 py-6">
                              <div className="flex items-center gap-3 mb-5">
                                <div className="h-px flex-1 bg-slate-800" />
                                <span className="text-xs font-bold text-violet-300 uppercase tracking-widest px-3 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
                                  {trip.bids.length} Bid{trip.bids.length !== 1 ? 's' : ''} Received
                                </span>
                                <div className="h-px flex-1 bg-slate-800" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {trip.bids.map((bid, bidIdx) => {
                                  const isBidAccepted = bid.status === 'ACCEPTED' || bid.status === 'IN_PROGRESS';
                                  const isBidCancelled = bid.status === 'CANCELLED';
                                  const cardCls = isBidAccepted
                                    ? 'bg-emerald-950/30 border-emerald-800/40'
                                    : isBidCancelled
                                      ? 'bg-rose-950/20 border-rose-800/30'
                                      : 'bg-slate-900/90 border-slate-800';

                                  return (
                                    <div key={bid.uuid || bidIdx} className={`rounded-2xl border p-4.5 space-y-3.5 shadow-lg ${cardCls}`}>
                                      {/* Bid header */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          {/* Clickable avatar → image preview */}
                                          <button
                                            type="button"
                                            title="Click to preview photo"
                                            onClick={() => setPreviewImage({
                                              url: bid.driver?.profile_picture ? `${newwork_image_url}${bid.driver.profile_picture}` : noImage,
                                              title: bid.driver?.name || 'Driver'
                                            })}
                                            className="shrink-0 ring-0 hover:ring-2 hover:ring-violet-500/60 rounded-xl transition-all cursor-pointer"
                                          >
                                            <Avatar size="sm"
                                              src={bid.driver?.profile_picture ? `${newwork_image_url}${bid.driver.profile_picture}` : noImage}
                                              alt={bid.driver?.name || 'Driver'} />
                                          </button>
                                          <div>
                                            {/* Clickable driver name → rider profile */}
                                            <button
                                              type="button"
                                              onClick={() => navigate(`/dashboard/rider?search=${encodeURIComponent(bid.driver?.phone || bid.driver?.name || '')}`)}
                                              className="text-sm font-bold text-slate-100 hover:text-violet-400 leading-snug text-left transition-colors cursor-pointer group flex items-center gap-1"
                                              title="View driver profile"
                                            >
                                              {bid.driver?.name || 'Anonymous'}
                                              <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </button>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">{bid.driver?.phone || '—'}</p>
                                          </div>
                                        </div>
                                        <StatusBadge status={bid.status} />
                                      </div>

                                      {/* Amounts */}
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-800/80">
                                        <div className="col-span-2">
                                          <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-3.5 py-2.5 border border-slate-800">
                                            <div className="flex items-center gap-2.5">
                                              <span className="text-xs text-slate-400 font-medium">Bid Amount:</span>
                                              {editingBid?.trip_uuid === trip.trip_details.uuid && editingBid?.bid_uuid === bid.uuid ? (
                                                <form onSubmit={handleUpdateBid} className="flex items-center gap-1.5">
                                                  <input type="number" value={editingBid.bid_amount}
                                                    onChange={e => setEditingBid({ ...editingBid, bid_amount: e.target.value })}
                                                    className="w-20 px-2.5 py-1 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500" required />
                                                  <button type="submit" disabled={updatingBid} className="px-2.5 py-1 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-500">{updatingBid ? '…' : 'Save'}</button>
                                                  <button type="button" onClick={() => setEditingBid(null)} className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">✕</button>
                                                </form>
                                              ) : (
                                                <span className="text-base font-bold text-white">{bid.bid_amount} ৳</span>
                                              )}
                                            </div>
                                            <div className="flex gap-2">
                                              {(!editingBid || editingBid.bid_uuid !== bid.uuid) && bid.status === 'REQUESTED' && trip.trip_details.trip_status === 'REQUESTED' && (
                                                <button onClick={() => setEditingBid({ trip_uuid: trip.trip_details.uuid, driver_uuid: bid.driver?.driver_uuid || '', bid_uuid: bid.uuid, bid_amount: String(bid.bid_amount) })}
                                                  className="text-xs font-semibold text-violet-300 hover:text-violet-200 bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer">Edit</button>
                                              )}
                                              {bid.status === 'REQUESTED' && (
                                                <button onClick={() => setConfirmPopup({ show: true, title: 'Confirm Accept', message: 'Accept this bid for the customer?', onConfirm: () => handleAcceptBid(bid.uuid, customer?.customer_uuid) })}
                                                  disabled={acceptingBid === bid.uuid}
                                                  className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                                                  {acceptingBid === bid.uuid ? '…' : 'Accept'}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <InfoRow label="Total" value={`${bid.total_amount} ৳`} accent="text-emerald-400 font-bold" />
                                        <InfoRow label="Commission" value={`${bid.commission_amount} ৳`} />
                                        <InfoRow label="Booking" value={`${bid.booking_charge_amount} ৳`} />
                                        <InfoRow label="Insurance" value={`${bid.insurance_charge_amount} ৳`} />
                                        {(bid.driver_bonus_amount ?? 0) > 0 && <InfoRow label="Bonus" value={`${bid.driver_bonus_amount} ৳`} accent="text-amber-400 font-bold" />}
                                        <div className="col-span-2 pt-2 border-t border-slate-800/60">
                                          <p className="text-xs text-slate-400 font-mono truncate">Bid: {bid.uuid}</p>
                                          <p className="text-xs text-slate-400 font-mono">{formatTripDateTime(bid.created_at)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between bg-slate-900/50">
              <span className="text-xs text-slate-400">Page <span className="text-slate-200 font-bold">{currentPage}</span> of <span className="text-slate-200 font-bold">{totalPages}</span> — {totalTrips} trips</span>
              <div className="flex gap-2">
                <button disabled={currentPage <= 1} onClick={() => loadTrips(currentPage - 1)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  ← Prev
                </button>
                <button disabled={currentPage >= totalPages} onClick={() => loadTrips(currentPage + 1)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <MapModal selectedTripForMap={selectedTripForMap} mapZoom={mapZoom} setMapZoom={setMapZoom} onClose={() => setSelectedTripForMap(null)} />
      <ImagePreviewModal previewImage={previewImage} onClose={() => setPreviewImage(null)} />
      <CancelTripModal isOpen={!!cancelTripUuid} onClose={() => setCancelTripUuid(null)} onSubmit={handleCancelTripSubmit} cancelComment={cancelComment} setCancelComment={setCancelComment} cancelling={cancelling} cancelError={cancelError} />
      <PopupMessage show={confirmPopup.show} type="confirm" title={confirmPopup.title} message={confirmPopup.message}
        onClose={() => setConfirmPopup(p => ({ ...p, show: false }))}
        onConfirm={() => { setConfirmPopup(p => ({ ...p, show: false })); confirmPopup.onConfirm(); }} />
    </div>
  );
}
