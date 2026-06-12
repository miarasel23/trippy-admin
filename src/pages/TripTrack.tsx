import React, { useEffect, useState } from 'react';
import { fetchAllRentalTripList, fetchCustomerList, newwork_image_url, cancelTripByAdmin, updateTripBid, acceptTripForCustomer } from '../utilities/api';
import type { AllRentalTripItem, CustomerUserItem } from '../utilities/api';
import noImage from '../assets/no-image.png';
import { useToast } from '../context/ToastContext';

export default function TripTrack() {
  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const { showToast } = useToast();
  const [trips, setTrips] = useState<AllRentalTripItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [tripStatus, setTripStatus] = useState<string>('');
  const [customerUuid, setCustomerUuid] = useState<string>('');
  const [customerQuery, setCustomerQuery] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [driverPhone, setDriverPhone] = useState<string>('');
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [today, setToday] = useState<boolean>(false);

  // Automatically uncheck "Today Only" when a custom date range is set
  useEffect(() => {
    if (startDate || endDate) {
      setToday(false);
    }
  }, [startDate, endDate]);

  // UI States
  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({});
  const [selectedTripForMap, setSelectedTripForMap] = useState<AllRentalTripItem | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const [cancelTripUuid, setCancelTripUuid] = useState<string | null>(null);
  const [cancelDriverUuid, setCancelDriverUuid] = useState<string | null>(null);
  const [cancelComment, setCancelComment] = useState<string>('');
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [editingBid, setEditingBid] = useState<{trip_uuid: string, driver_uuid: string, bid_amount: string} | null>(null);
  const [updatingBid, setUpdatingBid] = useState<boolean>(false);
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);

  const handleAcceptBid = async (bid_uuid: string, custUuid?: string) => {
    try {
      setAcceptingBid(bid_uuid);
      const message = await acceptTripForCustomer({
        bid_uuid,
        customer_uuid: custUuid || undefined
      });
      showToast('success', 'Trip Accepted', message);
      loadTrips();
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
      loadTrips();
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
      // Reload trips
      loadTrips();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to cancel trip';
      setCancelError(errMsg);
      showToast('error', 'Cancellation Failed', errMsg);
    } finally {
      setCancelling(false);
    }
  };

  // Load Customers list
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

  const currentCustomer = customers.find(c => c.uuid === customerUuid);

  // Load Trips
  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllRentalTripList({
        customer_uuid: customerUuid || undefined,
        trip_status: tripStatus || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        customer_phone: customerPhone || undefined,
        driver_phone: driverPhone || undefined,
        today: today || undefined
      });
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Error loading trips');
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [tripStatus, customerUuid, startDate, endDate, customerPhone, driverPhone, today]);

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

  const toggleTripExpand = (uuid: string) => {
    setExpandedTrips(prev => ({ ...prev, [uuid]: !prev[uuid] }));
  };

  const handleOpenMap = (trip: AllRentalTripItem) => {
    setMapZoom(trip.location_details?.dropoff_locations?.[0] ? 11 : 14);
    setSelectedTripForMap(trip);
  };



  const suggestedCustomers = customers.filter(c => {
    const q = customerQuery.toLowerCase();
    const fullName = (c.full_name || '').toLowerCase();
    const phone = (c.phone_number || '').toLowerCase();
    return fullName.includes(q) || phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Trip Track Dashboard</h1>
          <p className="text-slate-400 text-xs mt-0.5">Track and filter all rental trips in real-time</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Autocomplete Customer Selector */}
          <div className="flex flex-col gap-2 relative select-customer-container">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Search Customer
            </label>
            <div className="relative w-full">
              <input
                type="text"
                className="w-full pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="Type name or phone number..."
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
                    setCustomerUuid('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {showSuggestions && (
                <div className="absolute left-0 mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto py-1">
                  {suggestedCustomers.length === 0 ? (
                    <div className="px-4 py-2 text-xs text-slate-500 italic">No customers found</div>
                  ) : (
                    suggestedCustomers.map((c) => (
                      <button
                        key={c.uuid}
                        type="button"
                        onClick={() => {
                          setCustomerUuid(c.uuid);
                          setCustomerQuery(c.full_name ? `${c.full_name} (${c.phone_number})` : c.phone_number);
                          setShowSuggestions(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left hover:bg-slate-800 transition-colors cursor-pointer ${
                          customerUuid === c.uuid ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{c.full_name || 'No Name'}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.phone_number}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Customer Phone Search */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Customer Phone
            </label>
            <input
              type="text"
              placeholder="e.g. 019XXXXXXXX"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          {/* Driver Phone Search */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Driver Phone
            </label>
            <input
              type="text"
              placeholder="e.g. 017XXXXXXXX"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
            />
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Trip Status Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Trip Status
            </label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm cursor-pointer"
              value={tripStatus}
              onChange={(e) => setTripStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Today Checkbox */}
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="today-filter"
              className="w-4 h-4 text-indigo-600 border-slate-700 bg-slate-800 rounded focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer"
              checked={today}
              onChange={(e) => setToday(e.target.checked)}
            />
            <label htmlFor="today-filter" className="text-xs font-semibold text-slate-300 cursor-pointer uppercase tracking-wider">
              Today Only
            </label>
          </div>

          {/* Reset Filters Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setCustomerUuid('');
                setCustomerQuery('');
                setCustomerPhone('');
                setDriverPhone('');
                setStartDate('');
                setEndDate('');
                setToday(false);
                setTripStatus('');
              }}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors cursor-pointer border border-slate-700/60"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loader or Error */}
      {loading && (
        <div className="flex justify-center items-center py-24 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Trips Table */}
      {!loading && !error && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-14">SL</th>
                  <th className="px-4 py-3">Customer Info</th>
                  <th className="px-4 py-3">Driver Info</th>
                  <th className="px-4 py-3">Service Details</th>
                  <th className="px-4 py-3">Locations (Pickup & Dropoff)</th>
                  <th className="px-4 py-3">Fare Details</th>
                  <th className="px-4 py-3 text-center">Bidders</th>
                  <th className="px-4 py-3">Schedule Time</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trips.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                      No matching trips tracked for this date range.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, idx) => {
                    const customerAvatar = trip.customer_details?.profile_picture
                      ? `${newwork_image_url}${trip.customer_details.profile_picture}`
                      : noImage;

                    return (
                      <React.Fragment key={trip.trip_details.uuid}>
                        <tr className="hover:bg-slate-800/30 transition-colors align-top border-b border-slate-800/60">
                          <td className="px-4 py-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <img
                                src={customerAvatar}
                                alt={trip.customer_details?.full_name || 'Customer'}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = noImage;
                                }}
                              />
                              <div>
                                <div className="font-semibold text-slate-200 text-xs">
                                  {trip.customer_details?.full_name || 'Anonymous'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {trip.customer_details?.phone_number}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {trip.accepted_driver_details ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    trip.accepted_driver_details.profile_picture
                                      ? `${newwork_image_url}${trip.accepted_driver_details.profile_picture}`
                                      : noImage
                                  }
                                  alt={trip.accepted_driver_details.full_name || 'Driver'}
                                  className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = noImage;
                                  }}
                                />
                                <div>
                                  <div className="font-semibold text-slate-200 text-xs">
                                    {trip.accepted_driver_details.full_name || 'Anonymous Driver'}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {trip.accepted_driver_details.phone_number}
                                  </div>
                                  {trip.accepted_driver_details.email && (
                                    <div className="text-[9px] text-slate-500 font-mono">
                                      {trip.accepted_driver_details.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-xs">No driver assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-4 space-y-1">
                            <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-800/50">
                              {trip.trip_details.service_name}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1.5">
                              Platform: <span className="font-semibold text-slate-300">{trip.trip_details.platform || 'N/A'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Payment: <span className="font-semibold text-slate-300">{trip.trip_details.payment_method || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 space-y-2 max-w-xs">
                            {/* Pickup locations */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Pickup</span>
                              {trip.location_details?.pickup_locations && trip.location_details.pickup_locations.length > 0 ? (
                                trip.location_details.pickup_locations.map((loc) => (
                                  <div key={loc.uuid} className="text-xs text-slate-300 leading-tight">
                                    📍 {loc.address}
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-slate-500 italic">No pickup location</div>
                              )}
                            </div>
                            {/* Dropoff locations */}
                            <div>
                              <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Drop-off</span>
                              {trip.location_details?.dropoff_locations && trip.location_details.dropoff_locations.length > 0 ? (
                                trip.location_details.dropoff_locations.map((loc) => (
                                  <div key={loc.uuid} className="text-xs text-slate-300 leading-tight">
                                    🏁 {loc.address}
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-slate-500 italic">No dropoff location</div>
                              )}
                            </div>
                            {((trip.location_details?.pickup_locations && trip.location_details.pickup_locations.length > 0) || (trip.location_details?.dropoff_locations && trip.location_details.dropoff_locations.length > 0)) && (
                              <button
                                onClick={() => handleOpenMap(trip)}
                                className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 text-[10px] font-semibold rounded transition-colors cursor-pointer border border-slate-700/60"
                              >
                                🗺️ View on Map
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-4 space-y-1">
                            {trip.amount_details ? (
                              <div className="text-xs text-slate-300 space-y-0.5">
                                <div>Min Price: <span className="text-slate-100 font-semibold">{trip.amount_details.minimum_booking_price} ৳</span></div>
                                <div>Per KM: <span className="text-slate-100">{trip.amount_details.price_per_km} ৳</span></div>
                                {trip.amount_details.accepted_bid_amount && (
                                  <div className="text-emerald-400 font-semibold">Accepted Fare: {trip.amount_details.accepted_bid_amount} ৳</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="inline-block bg-slate-800/60 rounded-lg p-2 text-xs border border-slate-700/60 text-left min-w-[100px]">
                              <div className="text-slate-400">Total Bidders: <span className="text-white font-bold">{trip.all_bidders?.length ?? 0}</span></div>
                            </div>
                            {trip.all_bidders && trip.all_bidders.length > 0 && (
                              <button
                                onClick={() => toggleTripExpand(trip.trip_details.uuid)}
                                className="mt-2 w-full text-center px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded transition-colors cursor-pointer"
                              >
                                {expandedTrips[trip.trip_details.uuid] ? 'Hide Bids ▲' : 'View Bids ▼'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-300 space-y-1">
                            <div>Start: <span className="font-mono text-slate-100">{new Date(trip.trip_details.start_datetime).toLocaleString()}</span></div>
                            {trip.trip_details.end_datetime && (
                              <div>End: <span className="font-mono text-slate-100">{new Date(trip.trip_details.end_datetime).toLocaleString()}</span></div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              trip.trip_details.trip_status === 'ACCEPTED'
                                ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                                : trip.trip_details.trip_status === 'REQUESTED'
                                ? 'bg-amber-900/50 text-amber-300 border-amber-700/50'
                                : trip.trip_details.trip_status === 'COMPLETED'
                                ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50'
                                : 'bg-rose-900/50 text-rose-300 border-rose-700/50'
                            }`}>
                              {trip.trip_details.trip_status}
                            </span>
                            {(trip.trip_details.trip_status === 'REQUESTED' || trip.trip_details.trip_status === 'ACCEPTED') && (
                              <button
                                onClick={() => {
                                  setCancelTripUuid(trip.trip_details.uuid);
                                  setCancelDriverUuid(trip.accepted_driver_details?.uuid || null);
                                  setCancelComment('');
                                  setCancelError(null);
                                }}
                                className="mt-2 block w-full text-center px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[10px] font-semibold rounded transition-colors cursor-pointer border border-rose-500/30"
                              >
                                Cancel Trip
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Bid Details Expansion */}
                        {expandedTrips[trip.trip_details.uuid] && trip.all_bidders && trip.all_bidders.length > 0 && (
                          <tr className="bg-slate-900/65 border-b border-slate-800">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                  Bidders list ({trip.all_bidders.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {trip.all_bidders.map((bid, idx) => (
                                    <div
                                      key={bid.bid_uuid || idx}
                                      className={`p-4 rounded-xl space-y-3 transition-colors shadow-lg ${
                                        bid.status === 'CANCELLED'
                                          ? 'bg-rose-950/20 border border-rose-900/50'
                                          : 'bg-slate-950 border border-slate-800/80 hover:border-slate-700/80'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <img
                                            src={
                                              bid.driver_details?.profile_picture
                                                ? `${newwork_image_url}${bid.driver_details.profile_picture}`
                                                : noImage
                                            }
                                            alt={bid.driver_details?.full_name || 'Driver'}
                                            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-800/60"
                                            onError={(e) => {
                                              e.currentTarget.onerror = null;
                                              e.currentTarget.src = noImage;
                                            }}
                                          />
                                          <div>
                                            <div className="text-xs font-bold text-slate-200">
                                              {bid.driver_details?.full_name || 'Anonymous Driver'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                              Phone: {bid.driver_details?.phone_number || 'N/A'}
                                            </div>
                                          </div>
                                        </div>
                                        <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded text-[10px] font-semibold uppercase tracking-wider">
                                          {bid.status}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-2.5">
                                        <div className="col-span-2 flex items-center justify-between text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800">
                                          <div className="flex items-center gap-2">
                                            <span>Bid Amount:</span>
                                            {editingBid?.trip_uuid === trip.trip_details.uuid && editingBid?.driver_uuid === bid.driver_details?.uuid ? (
                                              <form onSubmit={handleUpdateBid} className="flex items-center gap-2">
                                                <input
                                                  type="number"
                                                  value={editingBid.bid_amount}
                                                  onChange={(e) => setEditingBid({ ...editingBid, bid_amount: e.target.value })}
                                                  className="w-20 px-2 py-1 text-xs bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                  required
                                                />
                                                <button type="submit" disabled={updatingBid} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500 transition-colors">
                                                  {updatingBid ? '...' : 'Save'}
                                                </button>
                                                <button type="button" onClick={() => setEditingBid(null)} className="px-2 py-1 bg-slate-700 text-white rounded text-xs hover:bg-slate-600 transition-colors">
                                                  Cancel
                                                </button>
                                              </form>
                                            ) : (
                                              <span className="text-white font-bold">{bid.bid_amount} ৳</span>
                                            )}
                                          </div>
                                          <div className="flex gap-2">
                                            {(!editingBid || editingBid.trip_uuid !== trip.trip_details.uuid || editingBid.driver_uuid !== bid.driver_details?.uuid) && bid.status !== 'CANCELLED' && (
                                              <button 
                                                onClick={() => setEditingBid({ trip_uuid: trip.trip_details.uuid, driver_uuid: bid.driver_details?.uuid || '', bid_amount: String(bid.bid_amount) })}
                                                className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer bg-slate-800 px-2 py-1 rounded border border-slate-700 transition-colors"
                                              >
                                                Edit Bid
                                              </button>
                                            )}
                                            {bid.status === 'REQUESTED' && (
                                              <button
                                                onClick={() => handleAcceptBid(bid.bid_uuid, trip.customer_details?.uuid)}
                                                disabled={acceptingBid === bid.bid_uuid}
                                                className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer bg-emerald-900/30 px-2 py-1 rounded border border-emerald-800 transition-colors disabled:opacity-50"
                                              >
                                                {acceptingBid === bid.bid_uuid ? '...' : 'Accept'}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-slate-400">
                                          Total Payable: <span className="text-emerald-400 font-bold">{bid.total_amount} ৳</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          Commission: {bid.commission_amount} ৳
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          Booking Charge: {bid.booking_charge_amount} ৳
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          Insurance Charge: {bid.insurance_charge_amount} ৳
                                        </div>
                                      </div>

                                      {bid.driver_details?.car_photos && bid.driver_details.car_photos.length > 0 && (
                                        <div className="space-y-1.5 mt-3 pt-2.5 border-t border-slate-800/60">
                                          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Car Pictures
                                          </span>
                                          <div className="flex flex-wrap gap-2">
                                            {bid.driver_details.car_photos.map((photo: string, pIdx: number) => {
                                              const picUrl = photo.startsWith('http') ? photo : `${newwork_image_url}${photo}`;
                                              return (
                                                <img
                                                  key={pIdx}
                                                  src={picUrl}
                                                  alt={`Car Photo ${pIdx + 1}`}
                                                  className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80 border border-slate-800 transition-opacity"
                                                  onClick={() =>
                                                    setPreviewImage({
                                                      url: picUrl,
                                                      title: `${bid.driver_details?.full_name || 'Driver'}'s Car - Image ${pIdx + 1}`
                                                    })
                                                  }
                                                  onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = noImage;
                                                  }}
                                                />
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Cancellation Details Row for CANCELLED trips */}
                        {trip.trip_details.trip_status === 'CANCELLED' && (
                          <tr className="bg-rose-950/20 border-b border-rose-900/30">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span>🚫</span> Cancellation Details
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Assigned Driver at cancellation */}
                                  {trip.accepted_driver_details && (
                                    <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 space-y-2">
                                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Assigned Driver</p>
                                      <div className="flex items-center gap-3">
                                        <img
                                          src={
                                            trip.accepted_driver_details.profile_picture
                                              ? `${newwork_image_url}${trip.accepted_driver_details.profile_picture}`
                                              : noImage
                                          }
                                          alt={trip.accepted_driver_details.full_name || 'Driver'}
                                          className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-800/40"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = noImage;
                                          }}
                                        />
                                        <div>
                                          <div className="text-sm font-semibold text-slate-200">
                                            {trip.accepted_driver_details.full_name || 'N/A'}
                                          </div>
                                          <div className="text-xs text-slate-400 font-mono">
                                            {trip.accepted_driver_details.phone_number}
                                          </div>
                                          {trip.accepted_driver_details.email && (
                                            <div className="text-xs text-slate-500">
                                              {trip.accepted_driver_details.email}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Cancellation Comments */}
                                  {trip.cancellation_comments && trip.cancellation_comments.length > 0 ? (
                                    <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 space-y-2">
                                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Cancellation Reason</p>
                                      {trip.cancellation_comments.map((c) => (
                                        <div key={c.uuid} className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                              c.cancelled_by === 'ADMIN'
                                                ? 'bg-purple-900/50 text-purple-300'
                                                : c.cancelled_by === 'DRIVER'
                                                ? 'bg-blue-900/50 text-blue-300'
                                                : 'bg-amber-900/50 text-amber-300'
                                            }`}>
                                              {c.cancelled_by}
                                            </span>
                                            {c.created_at && (
                                              <span className="text-[10px] text-slate-500 font-mono">
                                                {new Date(c.created_at).toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-slate-300 bg-slate-900/60 rounded p-2 border border-slate-800/60">
                                            {c.comment}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40">
                                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Cancellation Reason</p>
                                      <p className="text-xs text-slate-500 italic">No comment recorded.</p>
                                    </div>
                                  )}
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

      {/* Map Modal */}
      {selectedTripForMap && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span>🗺️</span> Trip Route Map
                </h3>
                <button
                  onClick={() => setSelectedTripForMap(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-emerald-500 tracking-wider mb-1">Pickup Location</span>
                    <span className="text-slate-300 font-medium">
                      {selectedTripForMap.location_details?.pickup_locations?.[0]?.address || 'No Address'}
                    </span>
                    {selectedTripForMap.location_details?.pickup_locations?.[0] && (
                      <span className="block font-mono text-slate-500 text-[10px] mt-1">
                        Coordinates: {selectedTripForMap.location_details.pickup_locations[0].latitude}, {selectedTripForMap.location_details.pickup_locations[0].longitude}
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1">Dropoff Location</span>
                    <span className="text-slate-300 font-medium">
                      {selectedTripForMap.location_details?.dropoff_locations?.[0]?.address || 'No Address'}
                    </span>
                    {selectedTripForMap.location_details?.dropoff_locations?.[0] && (
                      <span className="block font-mono text-slate-500 text-[10px] mt-1">
                        Coordinates: {selectedTripForMap.location_details.dropoff_locations[0].latitude}, {selectedTripForMap.location_details.dropoff_locations[0].longitude}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full h-96 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative">
                  {/* Floating Custom Zoom Controls */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                    <button
                      onClick={() => setMapZoom((prev) => Math.min(prev + 1, 21))}
                      className="w-8 h-8 flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-lg border border-slate-700 shadow-lg cursor-pointer focus:outline-none transition-colors"
                      title="Zoom In"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setMapZoom((prev) => Math.max(prev - 1, 1))}
                      className="w-8 h-8 flex items-center justify-center bg-slate-900/90 hover:bg-slate-800 text-white font-bold rounded-lg border border-slate-700 shadow-lg cursor-pointer focus:outline-none transition-colors"
                      title="Zoom Out"
                    >
                      −
                    </button>
                  </div>

                  {selectedTripForMap.location_details?.pickup_locations?.[0] ? (
                    <iframe
                      title="Trip Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={
                        selectedTripForMap.location_details.dropoff_locations?.[0]
                          ? `https://maps.google.com/maps?saddr=${selectedTripForMap.location_details.pickup_locations[0].latitude},${selectedTripForMap.location_details.pickup_locations[0].longitude}&daddr=${selectedTripForMap.location_details.dropoff_locations[0].latitude},${selectedTripForMap.location_details.dropoff_locations[0].longitude}&t=m&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`
                          : `https://maps.google.com/maps?q=${selectedTripForMap.location_details.pickup_locations[0].latitude},${selectedTripForMap.location_details.pickup_locations[0].longitude}&t=m&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`
                      }
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                      Coordinates are missing for this trip map.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
                {selectedTripForMap.location_details?.pickup_locations?.[0] && selectedTripForMap.location_details?.dropoff_locations?.[0] ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${selectedTripForMap.location_details.pickup_locations[0].latitude},${selectedTripForMap.location_details.pickup_locations[0].longitude}&destination=${selectedTripForMap.location_details.dropoff_locations[0].latitude},${selectedTripForMap.location_details.dropoff_locations[0].longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>🧭</span> Open in Google Maps
                  </a>
                ) : selectedTripForMap.location_details?.pickup_locations?.[0] ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedTripForMap.location_details.pickup_locations[0].latitude},${selectedTripForMap.location_details.pickup_locations[0].longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>🧭</span> Open in Google Maps
                  </a>
                ) : (
                  <div></div>
                )}
                <button
                  onClick={() => setSelectedTripForMap(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}

      {/* Preview Image Modal */}
      {previewImage && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                <h3 className="text-white font-semibold">{previewImage.title}</h3>
                <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 flex justify-center bg-slate-950">
                <img src={previewImage.url} alt={previewImage.title} className="max-w-full max-h-96 object-contain" />
              </div>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}

      {/* Cancellation Modal */}
      {cancelTripUuid && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span className="text-rose-500 text-lg">⚠️</span> Cancel Trip Confirmation
                </h3>
                <button
                  onClick={() => setCancelTripUuid(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCancelTripSubmit}>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Are you sure you want to cancel this trip? This action cannot be undone. Please provide a reason or comment for the cancellation.
                  </p>
                  
                  {cancelError && (
                    <div className="p-3 bg-rose-900/40 border border-rose-700/50 text-rose-300 rounded-lg text-xs">
                      {cancelError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Cancellation Reason *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={cancelComment}
                      onChange={(e) => setCancelComment(e.target.value)}
                      placeholder="Enter comment/reason for cancellation..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
                  <button
                    type="button"
                    onClick={() => setCancelTripUuid(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    disabled={cancelling}
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    disabled={cancelling || !cancelComment.trim()}
                  >
                    {cancelling ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                        Cancelling...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
        </>
      )}
    </div>
  );
}
