import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchCustomerTripHistory, fetchCustomerList, newwork_image_url, fetchCurrentCustomerUser } from '../utilities/api';
import type { RentalTripCustomerItem, CustomerUserItem } from '../utilities/api';
import noImage from '../assets/no-image.png';

export default function CustomerTripHistory() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const customerUuid = searchParams.get('customer_uuid') || '';

  const [customers, setCustomers] = useState<CustomerUserItem[]>([]);
  const [trips, setTrips] = useState<RentalTripCustomerItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'REQUESTED' | 'ACCEPTED' | 'CANCEL'>('REQUESTED');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTripForMap, setSelectedTripForMap] = useState<RentalTripCustomerItem | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserLoading, setCurrentUserLoading] = useState<boolean>(false);

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

  // Load customer list to allow selecting or seeing customer details
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

  // Load trip history
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

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUuid = e.target.value;
    if (newUuid) {
      setSearchParams({ customer_uuid: newUuid });
    } else {
      setSearchParams({});
    }
  };

  const statusTabs: { value: 'REQUESTED' | 'ACCEPTED' | 'CANCEL'; label: string; colorClass: string }[] = [
    { value: 'REQUESTED', label: 'Requested', colorClass: 'border-amber-500 text-amber-400 bg-amber-500/10' },
    { value: 'ACCEPTED', label: 'Accepted', colorClass: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
    { value: 'CANCEL', label: 'Cancelled', colorClass: 'border-rose-500 text-rose-400 bg-rose-500/10' }
  ];

  return (
    <div className="space-y-6">
      {/* Customer Selection Card */}
      <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate('/dashboard/customer')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Back to Customer List"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Customer Trip History</h1>
              <p className="text-slate-400 text-xs mt-0.5">View and filter trip history for registered customer</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto md:max-w-md">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Select Customer:
            </label>
            <select
              value={customerUuid}
              onChange={handleCustomerChange}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-sm"
            >
              <option value="">-- Choose a Customer --</option>
              {customers.map(c => (
                <option key={c.uuid} value={c.uuid}>
                  {c.full_name || 'No Name'} ({c.phone_number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Customer Details Header */}
        {currentCustomer && (
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-800/80">
            <img
              src={
                currentCustomer.profile_picture
                  ? currentCustomer.profile_picture.startsWith('http')
                    ? currentCustomer.profile_picture
                    : `${newwork_image_url}${currentCustomer.profile_picture}`
                  : noImage
              }
              alt={currentCustomer.full_name || 'Customer'}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-700"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = noImage;
              }}
            />
            <div className="text-center sm:text-left">
              <h2 className="text-base font-bold text-slate-200">{currentCustomer.full_name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                <span className="font-mono">Email: {currentCustomer.email || 'N/A'}</span>
                <span>•</span>
                <span className="font-mono">Phone: {currentCustomer.country_code} {currentCustomer.phone_number}</span>
                <span>•</span>
                <span>Status: {currentCustomer.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Trip History Content */}
      {!customerUuid ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-slate-400 font-medium">Please select a customer to view their trip history.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Tabs Selector */}
          <div className="flex border-b border-slate-800 gap-2">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedStatus(tab.value)}
                  className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${isActive
                    ? `${tab.colorClass} border-current`
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
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

          {/* Trips Table / List */}
          {!loading && !error && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-center w-14">SL</th>
                      <th className="px-4 py-3">Service & Platform</th>
                      <th className="px-4 py-3">Vehicle Details</th>
                      <th className="px-4 py-3">Locations (Pickup & Dropoff)</th>
                      <th className="px-4 py-3">Fare Details</th>
                      <th className="px-4 py-3 text-center">Bids Summary</th>
                      <th className="px-4 py-3">Schedule Time</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                          No {selectedStatus.toLowerCase()} trips found for this customer.
                        </td>
                      </tr>
                    ) : (
                      trips.map((trip, idx) => {
                        const avatarUrl = trip.car_category?.car_avatar
                          ? `${newwork_image_url}${trip.car_category.car_avatar}`
                          : noImage;

                        return (
                          <React.Fragment key={trip.uuid}>
                            <tr className="hover:bg-slate-800/30 transition-colors align-top border-b border-slate-800/60">
                              <td className="px-4 py-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="px-4 py-4 space-y-1">
                                <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded-md text-xs font-semibold border border-indigo-800/50">
                                  {trip.service_name}
                                </span>
                                <div className="text-xs text-slate-400 mt-1">
                                  Platform: <span className="font-semibold text-slate-300">{trip.platform || 'N/A'}</span>
                                </div>
                                <div className="text-xs text-slate-400">
                                  Payment: <span className="font-semibold text-slate-300">{trip.payment_method || 'N/A'}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {trip.car_category ? (
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={avatarUrl}
                                      alt={trip.car_category.car_type}
                                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = noImage;
                                      }}
                                    />
                                    <div>
                                      <div className="font-semibold text-slate-200 text-xs">
                                        {trip.car_category.car_type}
                                      </div>
                                      <div className="text-[10px] text-slate-400">
                                        Capacity: {trip.car_category.set_capacity} seats
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic text-xs">N/A</span>
                                )}
                              </td>
                              <td className="px-4 py-4 space-y-2 max-w-xs">
                                {/* Pickup locations */}
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Pickup</span>
                                  {trip.pickup_locations && trip.pickup_locations.length > 0 ? (
                                    trip.pickup_locations.map((loc) => (
                                      <div key={loc.uuid} className="text-xs text-slate-300 leading-tight">
                                        📍 {loc.address}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs text-slate-500 italic">No pickup location specified</div>
                                  )}
                                </div>
                                {/* Dropoff locations */}
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Drop-off</span>
                                  {trip.dropoff_locations && trip.dropoff_locations.length > 0 ? (
                                    trip.dropoff_locations.map((loc) => (
                                      <div key={loc.uuid} className="text-xs text-slate-300 leading-tight">
                                        🏁 {loc.address}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs text-slate-500 italic">No dropoff location specified</div>
                                  )}
                                </div>
                                {((trip.pickup_locations && trip.pickup_locations.length > 0) || (trip.dropoff_locations && trip.dropoff_locations.length > 0)) && (
                                  <button
                                    onClick={() => handleOpenMap(trip)}
                                    className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 text-[10px] font-semibold rounded transition-colors cursor-pointer border border-slate-700/60"
                                  >
                                    🗺️ View on Map
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-4 space-y-1">
                                {trip.price_info ? (
                                  <div className="text-xs text-slate-300 space-y-0.5">
                                    <div>Min Booking: <span className="text-slate-100 font-semibold">{trip.price_info.minimum_booking_price} ৳</span></div>
                                    <div>Per KM: <span className="text-slate-100">{trip.price_info.price_per_km} ৳</span></div>
                                    <div>Waiting: <span className="text-slate-100">{trip.price_info.waiting_price} ৳</span></div>
                                    <div>Cancellation: <span className="text-slate-100 text-rose-400">{trip.price_info.cancellation_fee} ৳</span></div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic text-xs">N/A</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <div className="inline-block bg-slate-800/60 rounded-lg p-2 text-xs border border-slate-700/60 text-left min-w-[110px]">
                                  <div className="text-slate-400">Total Bids: <span className="text-white font-bold">{trip.total_bids}</span></div>
                                  <div className="text-slate-400">Lowest: <span className="text-emerald-400 font-mono">{trip.bid_summary?.lowest_bid_amount ?? '-'} ৳</span></div>
                                  <div className="text-slate-400">Highest: <span className="text-amber-400 font-mono">{trip.bid_summary?.highest_bid_amount ?? '-'} ৳</span></div>
                                </div>
                                {trip.drivers && trip.drivers.length > 0 && (
                                  <button
                                    onClick={() => toggleTripExpand(trip.uuid)}
                                    className="mt-2 w-full text-center px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded transition-colors cursor-pointer"
                                  >
                                    {expandedTrips[trip.uuid] ? 'Hide Bids ▲' : 'View Bids ▼'}
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-4 text-xs text-slate-300 space-y-1">
                                <div>Start: <span className="font-mono text-slate-100">{new Date(trip.start_datetime).toLocaleString()}</span></div>
                                {trip.end_datetime && (
                                  <div>End: <span className="font-mono text-slate-100">{new Date(trip.end_datetime).toLocaleString()}</span></div>
                                )}
                                {trip.hours_booked && (
                                  <div className="text-indigo-400">Duration: {trip.hours_booked} hours</div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${trip.trip_status === 'ACCEPTED'
                                  ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
                                  : trip.trip_status === 'REQUESTED'
                                    ? 'bg-amber-900/50 text-amber-300 border-amber-700/50'
                                    : 'bg-rose-900/50 text-rose-300 border-rose-700/50'
                                  }`}>
                                  {trip.trip_status}
                                </span>
                              </td>
                            </tr>
                            {expandedTrips[trip.uuid] && trip.drivers && trip.drivers.length > 0 && (
                              <tr className="bg-slate-900/65 border-b border-slate-800">
                                <td colSpan={8} className="px-6 py-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                        Placed Bids ({trip.drivers.length})
                                      </h4>
                                      {currentUserLoading && (
                                        <span className="text-[10px] text-slate-500 animate-pulse">Loading current user...</span>
                                      )}
                                    </div>

                                    {currentUser && (
                                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                          <div>
                                            Authorized Admin User: <span className="font-semibold text-slate-200">{currentUser.full_name || 'N/A'}</span>
                                            {currentUser.email && <span className="text-slate-500 ml-1.5">({currentUser.email})</span>}
                                          </div>
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                          action_when: admin_login (bypassed permission check)
                                        </span>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {trip.drivers.map((driver: any, idx: number) => (
                                        <div
                                          key={driver.rent_bid_uuid || idx}
                                          className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 hover:border-slate-700/80 transition-colors shadow-lg"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-slate-700">
                                                {driver.name ? driver.name.substring(0, 2).toUpperCase() : 'DR'}
                                              </div>
                                              <div>
                                                <div className="text-xs font-bold text-slate-200">
                                                  {driver.name || 'Anonymous Driver'}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono">
                                                  Phone: {driver.phone || 'N/A'}
                                                </div>
                                              </div>
                                            </div>
                                            <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded text-[10px] font-semibold uppercase tracking-wider">
                                              {driver.bid_status}
                                            </span>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-slate-800/80 py-2.5">
                                            <div className="text-slate-400">
                                              Bid Fare: <span className="text-white font-bold">{driver.bid_amount} ৳</span>
                                            </div>
                                            <div className="text-slate-400">
                                              Total Payable Amount: <span className="text-emerald-400 font-bold">{driver.total_amount} ৳</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              Insurance: {driver.insurance_charge_amount} ৳
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              Discount: {driver.customer_discount_amount} ৳
                                            </div>
                                          </div>

                                          {driver.car_photos && driver.car_photos.length > 0 && (
                                            <div className="space-y-1.5">
                                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                Car Pictures
                                              </span>
                                              <div className="flex flex-wrap gap-2">
                                                {driver.car_photos.map((photo: string, pIdx: number) => {
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
                                                          title: `${driver.name || 'Driver'}'s Car - Image ${pIdx + 1}`
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
                      {selectedTripForMap.pickup_locations?.[0]?.address || 'No Address'}
                    </span>
                    {selectedTripForMap.pickup_locations?.[0] && (
                      <span className="block font-mono text-slate-500 text-[10px] mt-1">
                        Coordinates: {selectedTripForMap.pickup_locations[0].latitude}, {selectedTripForMap.pickup_locations[0].longitude}
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="block text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1">Dropoff Location</span>
                    <span className="text-slate-300 font-medium">
                      {selectedTripForMap.dropoff_locations?.[0]?.address || 'No Address'}
                    </span>
                    {selectedTripForMap.dropoff_locations?.[0] && (
                      <span className="block font-mono text-slate-500 text-[10px] mt-1">
                        Coordinates: {selectedTripForMap.dropoff_locations[0].latitude}, {selectedTripForMap.dropoff_locations[0].longitude}
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

                  {selectedTripForMap.pickup_locations?.[0] ? (
                    <iframe
                      title="Trip Map"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={
                        selectedTripForMap.dropoff_locations?.[0]
                          ? `https://maps.google.com/maps?saddr=${selectedTripForMap.pickup_locations[0].latitude},${selectedTripForMap.pickup_locations[0].longitude}&daddr=${selectedTripForMap.dropoff_locations[0].latitude},${selectedTripForMap.dropoff_locations[0].longitude}&t=m&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`
                          : `https://maps.google.com/maps?q=${selectedTripForMap.pickup_locations[0].latitude},${selectedTripForMap.pickup_locations[0].longitude}&t=m&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`
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
                {selectedTripForMap.pickup_locations?.[0] && selectedTripForMap.dropoff_locations?.[0] ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${selectedTripForMap.pickup_locations[0].latitude},${selectedTripForMap.pickup_locations[0].longitude}&destination=${selectedTripForMap.dropoff_locations[0].latitude},${selectedTripForMap.dropoff_locations[0].longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>🧭</span> Open in Google Maps
                  </a>
                ) : selectedTripForMap.pickup_locations?.[0] ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedTripForMap.pickup_locations[0].latitude},${selectedTripForMap.pickup_locations[0].longitude}`}
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
    </div>
  );
}


