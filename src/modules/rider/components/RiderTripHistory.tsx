import React, { useEffect, useState } from 'react';
import { fetchRiderTripHistory } from '../../trip/services/tripApi';
import { newwork_image_url } from '../../../shared/utils/constants';
import type { RentalTripCustomerItem } from '../../trip/services/types';
import noImage from '../../../shared/assets/images/no-image.png';
import MapModal from '../../trip/components/MapModal';
import ImagePreviewModal from '../../trip/components/ImagePreviewModal';

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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border whitespace-nowrap ${cls}`}>
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
  <div className="flex items-center gap-2 whitespace-nowrap">
    <span className="text-xs text-slate-400 font-medium min-w-[62px] shrink-0">{label}</span>
    <span className={`text-xs font-semibold ${accent ?? 'text-slate-100'}`}>{value}</span>
  </div>
);

const statusTabs: { value: string; label: string; activeClass: string }[] = [
  { value: 'REQUESTED', label: 'Requested', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' },
  { value: 'ACCEPTED', label: 'Accepted', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm' },
  { value: 'COMPLETED', label: 'Completed', activeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm' },
  { value: 'CANCELLED', label: 'Cancelled', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm' },
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
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800/80 rounded-2xl w-fit overflow-x-auto custom-scrollbar">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${isActive
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
        <div className="flex flex-col items-center justify-center py-24 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading driver trip history…</p>
        </div>
      )}

      {error && !loading && (
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
                Found <span className="text-white font-bold">{trips.length}</span> {selectedStatus.toLowerCase()} trips
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[950px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40">
                  <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-12">#</th>
                  <th className="px-4 py-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[180px]">Vehicle</th>
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
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-slate-400 text-sm font-medium">No {selectedStatus.toLowerCase()} trips found for this driver.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trips.map((trip, idx) => {
                    const avatarUrl = trip.car_category?.car_avatar
                      ? `${newwork_image_url}${trip.car_category.car_avatar}`
                      : noImage;
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
                                  <span className="mt-1 inline-block text-[11px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {formatEnumText(trip.service_name)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs italic">N/A</span>
                            )}
                          </td>

                          {/* Route */}
                          <td className="px-4 py-4 max-w-[240px]">
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
                                  className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors mt-1 cursor-pointer whitespace-nowrap"
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
                                <p className="text-xs text-slate-100 font-mono font-medium leading-snug whitespace-nowrap">{formatTripDateTime(trip.start_datetime)}</p>
                              </div>
                              {trip.service_name === 'RETURN' && trip.end_datetime && (
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Return Time</p>
                                  <p className="text-xs text-slate-100 font-mono font-medium leading-snug whitespace-nowrap">{formatTripDateTime(trip.end_datetime)}</p>
                                </div>
                              )}
                              {trip.hours_booked && (
                                <p className="text-xs text-violet-400 font-medium whitespace-nowrap">Duration: {trip.hours_booked} hours</p>
                              )}
                              <p className="text-[11px] text-slate-400 font-mono pt-0.5 whitespace-nowrap">Platform: {trip.platform || 'N/A'}</p>
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
                                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${isExpanded
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
                            <StatusBadge status={trip.trip_status} />
                          </td>
                        </tr>

                        {/* ── Bids expansion ── */}
                        {isExpanded && trip.drivers && trip.drivers.length > 0 && (
                          <tr className="border-b border-slate-800/50">
                            <td colSpan={7} className="p-0">
                              <div className="bg-slate-950/70 border-t border-violet-500/15 px-6 py-5">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="h-px flex-1 bg-slate-800" />
                                  <span className="text-xs font-bold text-violet-300 uppercase tracking-widest px-3 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
                                    {trip.drivers.length} Placed Bid{trip.drivers.length !== 1 ? 's' : ''}
                                  </span>
                                  <div className="h-px flex-1 bg-slate-800" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {[...trip.drivers].sort((a, b) => b.bid_amount - a.bid_amount).map((driver: any, bIdx: number) => {
                                    const isBidAccepted = driver.bid_status === 'ACCEPTED' || driver.bid_status === 'IN_PROGRESS' || driver.bid_status === 'COMPLETED';
                                    const isBidCancelled = driver.bid_status === 'CANCELLED' || driver.bid_status === 'REJECTED';
                                    const cardCls = isBidAccepted
                                      ? 'bg-emerald-950/30 border-emerald-800/40'
                                      : isBidCancelled
                                        ? 'bg-rose-950/20 border-rose-800/30'
                                        : 'bg-slate-900/90 border-slate-800';

                                    return (
                                      <div
                                        key={driver.rent_bid_uuid || bIdx}
                                        className={`rounded-2xl border p-4 space-y-3 shadow-lg ${cardCls}`}
                                      >
                                        {/* Bid Header */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <div className="flex items-center gap-2.5">
                                            <Avatar
                                              size="sm"
                                              src={driver.profile_picture ? (driver.profile_picture.startsWith('http') ? driver.profile_picture : `${newwork_image_url}${driver.profile_picture}`) : noImage}
                                              alt={driver.name || 'Driver'}
                                            />
                                            <div>
                                              <p className="text-sm font-bold text-slate-100 leading-snug">
                                                {driver.name || 'Anonymous Driver'}
                                              </p>
                                              <p className="text-xs text-slate-400 font-mono mt-0.5">{driver.phone || '—'}</p>
                                            </div>
                                          </div>
                                          <StatusBadge status={driver.bid_status} />
                                        </div>

                                        {/* Amounts */}
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2.5 border-t border-slate-800/80">
                                          <div className="col-span-2">
                                            <div className="flex items-center justify-between bg-slate-900/80 rounded-xl px-3 py-2 border border-slate-800">
                                              <span className="text-xs text-slate-400 font-medium">Bid Amount:</span>
                                              <span className="text-base font-bold text-white">{driver.bid_amount} ৳</span>
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
