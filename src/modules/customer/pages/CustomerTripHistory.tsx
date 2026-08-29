import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchCustomerTripHistory, cancelTripByAdmin, updateTripBid, acceptTripForCustomer } from '../../trip/services/tripApi';
import { fetchCustomerList, fetchCurrentCustomerUser } from '../services/customerApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import type { RentalTripCustomerItem } from '../../trip/services/types';
import type { CustomerUserItem } from '../services/types';
import noImage from '../../../shared/assets/images/no-image.png';
import MapModal from '../../trip/components/MapModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import CancelTripModal from '../../trip/components/CancelTripModal';
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

export default function CustomerTripHistory() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const customerUuid = searchParams.get('customer_uuid') || '';

  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [trips, setTrips] = useState<RentalTripCustomerItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'REQUESTED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED'>('REQUESTED');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripForMap, setSelectedTripForMap] = useState<RentalTripCustomerItem | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [confirmPopup, setConfirmPopup] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserLoading, setCurrentUserLoading] = useState<boolean>(false);
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const [cancelTripUuid, setCancelTripUuid] = useState<string | null>(null);
  const [cancelDriverUuid, setCancelDriverUuid] = useState<string | null>(null);
  const [cancelComment, setCancelComment] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [editingBid, setEditingBid] = useState<{ trip_uuid: string; driver_uuid: string; bid_uuid: string; bid_amount: string } | null>(null);
  const [updatingBid, setUpdatingBid] = useState<boolean>(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  const handleAcceptBid = async (bid_uuid: string) => {
    try {
      setAcceptingBid(bid_uuid);
      const message = await acceptTripForCustomer({
        bid_uuid,
        customer_uuid: customerUuid || undefined
      });
      showToast('success', 'Trip Accepted', message);
      loadTripHistory();
    } catch (err: any) {
      showToast('error', 'Accept Failed', err.message || 'Failed to accept trip');
    } finally {
      setAcceptingBid(null);
    }
  };

  const handleUpdateBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBid || !editingBid.bid_amount) return;
    try {
      setUpdatingBid(true);
      const message = await updateTripBid({
        trip_uuid: editingBid.trip_uuid,
        driver_uuid: editingBid.driver_uuid,
        bid_amount: editingBid.bid_amount
      });
      showToast('success', 'Bid Updated', message);
      setEditingBid(null);
      loadTripHistory();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Failed to update bid');
    } finally {
      setUpdatingBid(false);
    }
  };

  const handleCancelTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTripUuid || !cancelComment.trim()) return;
    try {
      setCancelling(true);
      setCancelError(null);
      const message = await cancelTripByAdmin({
        trip_uuid: cancelTripUuid,
        comment: cancelComment.trim(),
        driver_uuid: cancelDriverUuid || undefined
      });
      setCancelTripUuid(null);
      setCancelDriverUuid(null);
      setCancelComment('');
      showToast('success', 'Trip Cancelled', message);
      loadTripHistory();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to cancel trip';
      setCancelError(errMsg);
      showToast('error', 'Cancellation Failed', errMsg);
    } finally {
      setCancelling(false);
    }
  };

  const currentCustomer = customers.find(c => c.uuid === customerUuid);

  useEffect(() => {
    if (currentCustomer && !showSuggestions) {
      setCustomerQuery(currentCustomer.full_name ? `${currentCustomer.full_name} (${currentCustomer.phone_number})` : currentCustomer.phone_number);
    } else if (!customerUuid) {
      setCustomerQuery('');
    }
  }, [customerUuid, currentCustomer, showSuggestions]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.select-customer-container')) {
        setShowSuggestions(false);
        if (currentCustomer) {
          setCustomerQuery(currentCustomer.full_name ? `${currentCustomer.full_name} (${currentCustomer.phone_number})` : currentCustomer.phone_number);
        } else {
          setCustomerQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [currentCustomer]);

  const toggleTripExpand = async (uuid: string) => {
    const isExpanding = !expandedTrips[uuid];
    setExpandedTrips(prev => ({ ...prev, [uuid]: isExpanding }));
    if (isExpanding && !currentUser && !currentUserLoading) {
      try {
        setCurrentUserLoading(true);
        const userData = await fetchCurrentCustomerUser();
        setCurrentUser(userData);
      } catch (err) {
        console.error("Failed to fetch current customer user", err);
      } finally {
        setCurrentUserLoading(false);
      }
    }
  };

  const handleOpenMap = (trip: RentalTripCustomerItem) => {
    setMapZoom(trip.dropoff_locations?.[0] ? 11 : 14);
    setSelectedTripForMap(trip);
  };

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await fetchCustomerList();
        setCustomers(data);
      } catch (err) {
        console.error('Failed to load customers', err);
      }
    };
    loadCustomers();
  }, []);

  const loadTripHistory = async () => {
    if (!customerUuid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCustomerTripHistory(customerUuid, selectedStatus);
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Error loading trip history');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripHistory();
  }, [customerUuid, selectedStatus]);

  const statusTabs: { value: 'REQUESTED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED'; label: string; colorClass: string; activeClass: string }[] = [
    { value: 'REQUESTED', label: 'Requested', colorClass: 'text-amber-400', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' },
    { value: 'ACCEPTED', label: 'Accepted', colorClass: 'text-emerald-400', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' },
    { value: 'COMPLETED', label: 'Completed', colorClass: 'text-blue-400', activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm' },
    { value: 'CANCELLED', label: 'Cancelled', colorClass: 'text-rose-400', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm' }
  ];

  const suggestedCustomers = customers.filter(c => {
    const q = customerQuery.toLowerCase();
    const fullName = (c.full_name || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    return fullName.includes(q) || phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* ── Customer Selection Card ─────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 rounded-2xl shadow-2xl border border-slate-800/80 p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate('/dashboard/customer')}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700/60 shadow-sm"
              title="Back to Customer List"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Customer Trip History</h1>
              <p className="text-slate-400 text-xs mt-0.5">View and filter trip history for registered customer</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto md:max-w-md relative select-customer-container">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
              Select Customer:
            </label>
            <div className="relative w-full">
              <input
                type="text"
                className="w-full pl-3.5 pr-9 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/50 transition-all text-sm"
                placeholder="Search name or phone number..."
                value={customerQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setShowSuggestions(true);
                }}
              />
              {customerQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerQuery('');
                    setSearchParams({});
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {showSuggestions && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto py-1">
                  {suggestedCustomers.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-400 italic">No customers found</div>
                  ) : (
                    suggestedCustomers.map((c) => (
                      <button
                        key={c.uuid}
                        type="button"
                        onClick={() => {
                          setSearchParams({ customer_uuid: c.uuid });
                          setCustomerQuery(c.full_name ? `${c.full_name} (${c.phone_number})` : c.phone_number);
                          setShowSuggestions(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-slate-800 transition-colors cursor-pointer ${customerUuid === c.uuid ? 'bg-violet-600/20 text-violet-300 font-semibold' : 'text-slate-300'
                          }`}
                      >
                        <div>
                          <div className="font-semibold">{c.full_name || 'No Name'}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{c.phone_number}</div>
                        </div>
                        {customerUuid === c.uuid && (
                          <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Customer Header Card */}
        {currentCustomer && (
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-5 border-t border-slate-800/80 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <button
              type="button"
              title="Click to preview photo"
              onClick={() => setPreviewImage({
                url: currentCustomer.profile_picture ? (currentCustomer.profile_picture.startsWith('http') ? currentCustomer.profile_picture : `${newwork_image_url}${currentCustomer.profile_picture}`) : noImage,
                title: currentCustomer.full_name || 'Customer'
              })}
              className="shrink-0 ring-0 hover:ring-2 hover:ring-violet-500/60 rounded-xl transition-all cursor-pointer"
            >
              <Avatar
                src={currentCustomer.profile_picture ? (currentCustomer.profile_picture.startsWith('http') ? currentCustomer.profile_picture : `${newwork_image_url}${currentCustomer.profile_picture}`) : noImage}
                alt={currentCustomer.full_name || 'Customer'}
              />
            </button>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/customer?search=${encodeURIComponent(currentCustomer.phone_number || currentCustomer.full_name || '')}`)}
                  className="text-base font-bold text-slate-100 hover:text-violet-400 transition-colors cursor-pointer group flex items-center gap-1"
                  title="View customer profile"
                >
                  {currentCustomer.full_name || 'Anonymous Customer'}
                  <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </button>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${currentCustomer.is_active ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}>
                  {currentCustomer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                <span className="font-mono">Phone: <span className="text-slate-200">{currentCustomer.country_code} {currentCustomer.phone_number}</span></span>
                {currentCustomer.email && (
                  <>
                    <span>•</span>
                    <span className="font-mono">Email: <span className="text-slate-200">{currentCustomer.email}</span></span>
                  </>
                )}
                <span>•</span>
                <span className="font-mono text-slate-500">UUID: {currentCustomer.uuid}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Trip History Content ─────────────────────────── */}
      {!customerUuid ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center text-slate-500">
          <svg className="w-14 h-14 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-slate-300 font-semibold text-base">Select a customer above to view their trip history.</p>
          <p className="text-slate-500 text-xs mt-1">You can search by customer name, phone number, or select from the dropdown.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Tabs Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl w-fit">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedStatus(tab.value)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${isActive
                      ? tab.activeClass
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Loader or Error */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-28 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Loading trip history…</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 px-5 py-4 bg-rose-900/20 border border-rose-700/50 text-rose-300 rounded-xl text-sm font-medium">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              {error}
            </div>
          )}

          {/* Trips Table */}
          {!loading && !error && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
              {/* Table Toolbar */}
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-900/80 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-sm text-slate-300 font-medium">
                    Showing <span className="text-white font-bold">{trips.length}</span> {selectedStatus.toLowerCase()} trips for <span className="text-violet-300 font-bold">{currentCustomer?.full_name || 'Customer'}</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40">
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-12">#</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[170px]">Vehicle</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[170px]">Driver</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[220px]">Route</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[170px]">Fare Details</th>
                      <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[190px]">Schedule</th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-20">Bids</th>
                      <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-12 h-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-slate-400 text-sm font-medium">No {selectedStatus.toLowerCase()} trips found for this customer.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      trips.map((trip, idx) => {
                        const avatarUrl = trip.car_category?.car_avatar
                          ? `${newwork_image_url}${trip.car_category.car_avatar}`
                          : noImage;
                        const acceptedDriver = trip.drivers?.find((d: any) => d.bid_status === 'ACCEPTED' || d.bid_status === 'COMPLETED' || d.bid_status === 'IN_PROGRESS');
                        const isExpanded = expandedTrips[trip.uuid];
                        const isCANCELLED = trip.trip_status === 'CANCELLED';

                        const rowBg = isCANCELLED
                          ? 'bg-rose-950/10 hover:bg-rose-950/20'
                          : 'hover:bg-slate-800/40';

                        return (
                          <React.Fragment key={trip.uuid}>
                            {/* ── Main row ── */}
                            <tr className={`group border-b border-slate-800/50 transition-colors ${rowBg}`}>
                              {/* # */}
                              <td className="px-4 py-4 text-center">
                                <span className="text-xs text-slate-400 font-mono font-semibold tabular-nums">{idx + 1}</span>
                              </td>

                              {/* Vehicle */}
                              <td className="px-4 py-4">
                                {trip.car_category ? (
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      title="Click to preview vehicle image"
                                      onClick={() => setPreviewImage({ url: avatarUrl, title: trip.car_category?.car_type || 'Vehicle' })}
                                      className="w-16 h-12 rounded-xl bg-white border border-slate-200/20 shadow-md overflow-hidden flex items-center justify-center p-1 shrink-0 hover:ring-2 hover:ring-violet-500/60 transition-all cursor-pointer"
                                    >
                                      <img src={avatarUrl} alt={trip.car_category.car_type} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = noImage; }} />
                                    </button>
                                    <div>
                                      <p className="text-sm font-bold text-slate-100 leading-snug">{trip.car_category.car_type}</p>
                                      <p className="text-xs text-slate-400 mt-0.5">{trip.car_category.set_capacity} seats</p>
                                      <span className="mt-1 inline-block text-[11px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md">
                                        {formatEnumText(trip.service_name)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs italic">N/A</span>
                                )}
                              </td>

                              {/* Driver */}
                              <td className="px-4 py-4">
                                {acceptedDriver ? (
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      title="Click to preview photo"
                                      onClick={() => setPreviewImage({
                                        url: acceptedDriver.profile_picture ? `${newwork_image_url}${acceptedDriver.profile_picture}` : noImage,
                                        title: acceptedDriver.name || 'Driver'
                                      })}
                                      className="shrink-0 ring-0 hover:ring-2 hover:ring-violet-500/60 rounded-xl transition-all cursor-pointer"
                                    >
                                      <Avatar src={acceptedDriver.profile_picture ? `${newwork_image_url}${acceptedDriver.profile_picture}` : noImage} alt={acceptedDriver.name || 'Driver'} />
                                    </button>
                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/dashboard/rider?search=${encodeURIComponent(acceptedDriver.phone || acceptedDriver.name || '')}`)}
                                        className="text-sm font-bold text-slate-100 hover:text-violet-400 leading-snug text-left transition-colors cursor-pointer group flex items-center gap-1"
                                        title="View driver profile"
                                      >
                                        {acceptedDriver.name || 'Anonymous Driver'}
                                        <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                      </button>
                                      <p className="text-xs text-slate-400 font-mono mt-0.5">{acceptedDriver.phone || '—'}</p>
                                      {acceptedDriver.bid_amount && (
                                        <p className="text-xs text-emerald-400 mt-0.5 font-bold">{acceptedDriver.bid_amount} ৳ bid</p>
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
                                  {trip.pickup_locations && trip.pickup_locations.length > 0 && (
                                    <div className="flex items-start gap-2">
                                      <span className="mt-1 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                      <p className="text-xs text-slate-200 leading-snug line-clamp-2">{trip.pickup_locations[0].address}</p>
                                    </div>
                                  )}
                                  {trip.dropoff_locations && trip.dropoff_locations.length > 0 && (
                                    <div className="flex items-start gap-2">
                                      <span className="mt-1 w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                                      <p className="text-xs text-slate-200 leading-snug line-clamp-2">{trip.dropoff_locations[0].address}</p>
                                    </div>
                                  )}
                                  {((trip.pickup_locations && trip.pickup_locations.length > 0) || (trip.dropoff_locations && trip.dropoff_locations.length > 0)) && (
                                    <button
                                      onClick={() => handleOpenMap(trip)}
                                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors mt-1"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                                      View Route on Map
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Fare Details */}
                              <td className="px-4 py-4">
                                {trip.price_info ? (
                                  <div className="space-y-1.5">
                                    <InfoRow label="Min Book" value={`${trip.price_info.minimum_booking_price} ৳`} />
                                    <InfoRow label="Per KM" value={`${trip.price_info.price_per_km} ৳`} />
                                    <InfoRow label="Waiting" value={`${trip.price_info.waiting_price} ৳`} />
                                    <InfoRow label="Cancel Fee" value={`${trip.price_info.cancellation_fee} ৳`} accent="text-rose-400" />
                                    <div className="pt-0.5">
                                      <InfoRow label="Payment" value={formatEnumText(trip.payment_method)} accent="text-slate-200" />
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic text-xs">N/A</span>
                                )}
                              </td>

                              {/* Schedule */}
                              <td className="px-4 py-4">
                                <div className="space-y-1.5">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start Time</p>
                                    <p className="text-xs text-slate-100 font-mono font-medium leading-snug">{formatTripDateTime(trip.start_datetime)}</p>
                                  </div>
                                  {trip.service_name === 'RETURN' && trip.end_datetime && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Return Time</p>
                                      <p className="text-xs text-slate-100 font-mono font-medium leading-snug">{formatTripDateTime(trip.end_datetime)}</p>
                                    </div>
                                  )}
                                  {trip.hours_booked && (
                                    <p className="text-xs text-violet-400 font-medium">Duration: {trip.hours_booked} hours</p>
                                  )}
                                  <p className="text-[11px] text-slate-400 font-mono pt-0.5">Platform: {trip.platform || 'N/A'}</p>
                                </div>
                              </td>

                              {/* Bids */}
                              <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shadow-inner">
                                    <span className="text-lg font-bold text-white leading-none">{trip.total_bids ?? 0}</span>
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">bids</span>
                                  </div>
                                  {trip.drivers && trip.drivers.length > 0 && (
                                    <button
                                      onClick={() => toggleTripExpand(trip.uuid)}
                                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isExpanded
                                          ? 'bg-violet-600/30 text-violet-300 border border-violet-500/40'
                                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-violet-500/40 hover:text-violet-300'
                                        }`}
                                    >
                                      {isExpanded ? '▲ Hide' : '▼ View'}
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-4 py-4 text-center">
                                <div className="flex flex-col items-center gap-2.5">
                                  <StatusBadge status={trip.trip_status} />
                                  {(trip.trip_status === 'REQUESTED' || trip.trip_status === 'ACCEPTED') && (
                                    <button
                                      onClick={() => {
                                        setCancelTripUuid(trip.uuid);
                                        const acceptedDrv = trip.drivers?.find((d: any) => d.bid_status === 'ACCEPTED' || d.bid_status === 'COMPLETED');
                                        setCancelDriverUuid(acceptedDrv?.driver_uuid || acceptedDrv?.uuid || null);
                                        setCancelComment('');
                                        setCancelError(null);
                                      }}
                                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* ── Bids expansion ── */}
                            {isExpanded && trip.drivers && trip.drivers.length > 0 && (
                              <tr className="border-b border-slate-800/50">
                                <td colSpan={8} className="p-0">
                                  <div className="bg-slate-950/70 border-t border-violet-500/15 px-8 py-6">
                                    <div className="flex items-center gap-3 mb-5">
                                      <div className="h-px flex-1 bg-slate-800" />
                                      <span className="text-xs font-bold text-violet-300 uppercase tracking-widest px-3 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
                                        {trip.drivers.length} Bid{trip.drivers.length !== 1 ? 's' : ''} Received
                                      </span>
                                      <div className="h-px flex-1 bg-slate-800" />
                                    </div>

                                    {currentUser && (
                                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                          <div>
                                            Authorized Admin: <span className="font-semibold text-white">{currentUser.full_name || 'N/A'}</span>
                                            {currentUser.email && <span className="text-slate-400 ml-1.5">({currentUser.email})</span>}
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                          action: admin_login
                                        </span>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                      {[...trip.drivers].sort((a, b) => b.bid_amount - a.bid_amount).map((driver: any, bIdx: number) => {
                                        const isBidAccepted = driver.bid_status === 'ACCEPTED' || driver.bid_status === 'IN_PROGRESS' || driver.bid_status === 'COMPLETED';
                                        const isBidCancelled = driver.bid_status === 'CANCELLED';
                                        const cardCls = isBidAccepted
                                          ? 'bg-emerald-950/30 border-emerald-800/40'
                                          : isBidCancelled
                                            ? 'bg-rose-950/20 border-rose-800/30'
                                            : 'bg-slate-900/90 border-slate-800';

                                        return (
                                          <div
                                            key={driver.rent_bid_uuid || bIdx}
                                            className={`rounded-2xl border p-4.5 space-y-3.5 shadow-lg ${cardCls}`}
                                          >
                                            {/* Bid Header */}
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                <button
                                                  type="button"
                                                  title="Click to preview photo"
                                                  onClick={() => setPreviewImage({
                                                    url: driver.profile_picture ? (driver.profile_picture.startsWith('http') ? driver.profile_picture : `${newwork_image_url}${driver.profile_picture}`) : noImage,
                                                    title: driver.name || 'Driver'
                                                  })}
                                                  className="shrink-0 ring-0 hover:ring-2 hover:ring-violet-500/60 rounded-xl transition-all cursor-pointer"
                                                >
                                                  <Avatar
                                                    size="sm"
                                                    src={driver.profile_picture ? (driver.profile_picture.startsWith('http') ? driver.profile_picture : `${newwork_image_url}${driver.profile_picture}`) : noImage}
                                                    alt={driver.name || 'Driver'}
                                                  />
                                                </button>
                                                <div>
                                                  <button
                                                    type="button"
                                                    onClick={() => navigate(`/dashboard/rider?search=${encodeURIComponent(driver.phone || driver.name || '')}`)}
                                                    className="text-sm font-bold text-slate-100 hover:text-violet-400 leading-snug text-left transition-colors cursor-pointer group flex items-center gap-1"
                                                    title="View driver profile"
                                                  >
                                                    {driver.name || 'Anonymous Driver'}
                                                    <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                  </button>
                                                  <p className="text-xs text-slate-400 font-mono mt-0.5">{driver.phone || '—'}</p>
                                                </div>
                                              </div>
                                              <StatusBadge status={driver.bid_status} />
                                            </div>

                                            {/* Amounts */}
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-800/80">
                                              <div className="col-span-2">
                                                <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-3.5 py-2.5 border border-slate-800">
                                                  <div className="flex items-center gap-2.5">
                                                    <span className="text-xs text-slate-400 font-medium">Bid Amount:</span>
                                                    {editingBid?.trip_uuid === trip.uuid && editingBid?.bid_uuid === driver.rent_bid_uuid ? (
                                                      <form onSubmit={handleUpdateBid} className="flex items-center gap-1.5">
                                                        <input
                                                          type="number"
                                                          value={editingBid.bid_amount}
                                                          onChange={(e) => setEditingBid({ ...editingBid, bid_amount: e.target.value })}
                                                          className="w-20 px-2.5 py-1 text-xs bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                          required
                                                        />
                                                        <button type="submit" disabled={updatingBid} className="px-2.5 py-1 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-500">{updatingBid ? '…' : 'Save'}</button>
                                                        <button type="button" onClick={() => setEditingBid(null)} className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs hover:bg-slate-600">✕</button>
                                                      </form>
                                                    ) : (
                                                      <span className="text-base font-bold text-white">{driver.bid_amount} ৳</span>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-2">
                                                    {(!editingBid || editingBid.trip_uuid !== trip.uuid || editingBid.bid_uuid !== driver.rent_bid_uuid) && driver.bid_status === 'REQUESTED' && trip.trip_status === 'REQUESTED' && (
                                                      <button
                                                        onClick={() => setEditingBid({ trip_uuid: trip.uuid, driver_uuid: driver.driver_uuid || '', bid_uuid: driver.rent_bid_uuid, bid_amount: String(driver.bid_amount) })}
                                                        className="text-xs font-semibold text-violet-300 hover:text-violet-200 bg-violet-500/15 border border-violet-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                                      >
                                                        Edit
                                                      </button>
                                                    )}
                                                    {driver.bid_status === 'REQUESTED' && (
                                                      <button
                                                        onClick={() => {
                                                          setConfirmPopup({
                                                            show: true,
                                                            title: 'Confirm Accept',
                                                            message: 'Are you sure you want to accept this bid for the customer?',
                                                            onConfirm: () => handleAcceptBid(driver.rent_bid_uuid),
                                                          });
                                                        }}
                                                        disabled={acceptingBid === driver.rent_bid_uuid}
                                                        className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                                      >
                                                        {acceptingBid === driver.rent_bid_uuid ? '…' : 'Accept'}
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <InfoRow label="Total" value={`${driver.total_amount} ৳`} accent="text-emerald-400 font-bold" />
                                              <InfoRow label="Insurance" value={`${driver.insurance_charge_amount || 0} ৳`} />
                                              {driver.customer_discount_amount > 0 && <InfoRow label="Discount" value={`${driver.customer_discount_amount} ৳`} accent="text-amber-400 font-bold" />}
                                            </div>

                                            {/* Car Pictures */}
                                            {driver.car_photos && driver.car_photos.length > 0 && (
                                              <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                  Vehicle Pictures
                                                </span>
                                                <div className="flex flex-wrap gap-2">
                                                  {driver.car_photos.map((photo: string, pIdx: number) => {
                                                    const picUrl = photo.startsWith('http') ? photo : `${newwork_image_url}${photo}`;
                                                    return (
                                                      <button
                                                        key={pIdx}
                                                        type="button"
                                                        onClick={() =>
                                                          setPreviewImage({
                                                            url: picUrl,
                                                            title: `${driver.name || 'Driver'}'s Vehicle - Photo ${pIdx + 1}`
                                                          })
                                                        }
                                                        className="w-14 h-11 rounded-lg bg-white border border-slate-200/20 overflow-hidden flex items-center justify-center p-0.5 hover:ring-2 hover:ring-violet-500/60 transition-all cursor-pointer"
                                                      >
                                                        <img
                                                          src={picUrl}
                                                          alt={`Vehicle ${pIdx + 1}`}
                                                          className="w-full h-full object-contain"
                                                          onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = noImage;
                                                          }}
                                                        />
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <MapModal
        selectedTripForMap={selectedTripForMap}
        mapZoom={mapZoom}
        setMapZoom={setMapZoom}
        onClose={() => setSelectedTripForMap(null)}
      />

      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      <CancelTripModal
        isOpen={!!cancelTripUuid}
        onClose={() => setCancelTripUuid(null)}
        onSubmit={handleCancelTripSubmit}
        cancelComment={cancelComment}
        setCancelComment={setCancelComment}
        cancelling={cancelling}
        cancelError={cancelError}
      />

      <PopupMessage
        show={confirmPopup.show}
        type="confirm"
        title={confirmPopup.title}
        message={confirmPopup.message}
        onClose={() => setConfirmPopup(prev => ({ ...prev, show: false }))}
        onConfirm={() => {
          setConfirmPopup(prev => ({ ...prev, show: false }));
          confirmPopup.onConfirm();
        }}
      />
    </div>
  );
}
