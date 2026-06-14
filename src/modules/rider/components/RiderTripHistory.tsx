import React, { useEffect, useState } from 'react';
import { fetchRiderTripHistory } from '../../trip/services/tripApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import type { RentalTripCustomerItem } from '../../trip/services/types';
import noImage from '../../../shared/assets/images/no-image.png';
import MapModal from '../../trip/components/MapModal';
import ImagePreviewModal from '../../trip/components/ImagePreviewModal';

const formatTripDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day} ${month} ${year} (${dayName}) ${hours}:${minutes} ${ampm}`;
};

const statusTabs = [
  { value: 'REQUESTED', label: 'Requested', colorClass: 'text-amber-400' },
  { value: 'ACCEPTED', label: 'Accepted', colorClass: 'text-emerald-400' },
  { value: 'COMPLETED', label: 'Completed', colorClass: 'text-indigo-400' },
  { value: 'CANCELLED', label: 'Cancelled', colorClass: 'text-rose-400' },
];

export default function RiderTripHistory({ driverUuid }: { driverUuid: string }) {
  const [trips, setTrips] = useState<RentalTripCustomerItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('REQUESTED');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedTripForMap, setSelectedTripForMap] = useState<RentalTripCustomerItem | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(11);
  const [expandedTrips, setExpandedTrips] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRiderTripHistory(driverUuid, selectedStatus);
      setTrips(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load trip history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverUuid) {
      loadTrips();
    }
  }, [driverUuid, selectedStatus]);

  const handleOpenMap = (trip: RentalTripCustomerItem) => {
    setSelectedTripForMap(trip);
    setMapZoom(11);
  };

  const toggleTripExpand = (tripUuid: string) => {
    setExpandedTrips(prev => ({ ...prev, [tripUuid]: !prev[tripUuid] }));
  };

  return (
    <div className="space-y-6">
      {/* Status Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto custom-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${isActive
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

      {error && !loading && (
        <div className="px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Trips Table */}
      {!loading && !error && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
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
                      No {selectedStatus.toLowerCase()} trips found for this driver.
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
                            <div>Start: <span className="font-mono text-slate-100">{formatTripDateTime(trip.start_datetime)}</span></div>
                            {trip.service_name === 'RETURN' && trip.end_datetime && (
                              <div>Return: <span className="font-mono text-slate-100">{formatTripDateTime(trip.end_datetime)}</span></div>
                            )}
                            {trip.hours_booked && (
                              <div className="text-indigo-400">Duration: {trip.hours_booked} hours</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${trip.trip_status === 'ACCEPTED' || trip.trip_status === 'COMPLETED'
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
                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                                  Placed Bids ({trip.drivers.length})
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[...trip.drivers].sort((a, b) => b.bid_amount - a.bid_amount).map((driver: any, idx: number) => (
                                    <div
                                      key={driver.rent_bid_uuid || idx}
                                      className={`p-4 rounded-xl space-y-3 transition-colors shadow-lg ${driver.bid_status === 'CANCELLED' || driver.bid_status === 'REJECTED'
                                        ? 'bg-rose-950/20 border border-rose-900/50'
                                        : 'bg-slate-950 border border-slate-800/80 hover:border-slate-700/80'
                                        }`}
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
                                        <div className="col-span-2 flex items-center justify-between text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-800">
                                          <div className="flex items-center gap-2">
                                            <span>Bid Fare:</span>
                                            <span className="text-white font-bold">{driver.bid_amount} ৳</span>
                                          </div>
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
    </div>
  );
}
