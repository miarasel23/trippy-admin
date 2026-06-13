import type { Dispatch, SetStateAction } from 'react';

export interface MapModalProps {
  selectedTripForMap: any;
  mapZoom: number;
  setMapZoom: Dispatch<SetStateAction<number>>;
  onClose: () => void;
}

export default function MapModal({
  selectedTripForMap,
  mapZoom,
  setMapZoom,
  onClose
}: MapModalProps) {
  if (!selectedTripForMap) return null;

  // Handle differences between AllRentalTripItem (TripTrack) and RentalTripCustomerItem (CustomerTripHistory)
  const pickupLocation = selectedTripForMap.location_details?.pickup_locations?.[0] || selectedTripForMap.pickup_locations?.[0];
  const dropoffLocation = selectedTripForMap.location_details?.dropoff_locations?.[0] || selectedTripForMap.dropoff_locations?.[0];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span>🗺️</span> Trip Route Map
            </h3>
            <button
              onClick={onClose}
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
                  {pickupLocation?.address || 'No Address'}
                </span>
                {pickupLocation && (
                  <span className="block font-mono text-slate-500 text-[10px] mt-1">
                    Coordinates: {pickupLocation.latitude}, {pickupLocation.longitude}
                  </span>
                )}
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="block text-[10px] uppercase font-bold text-rose-500 tracking-wider mb-1">Dropoff Location</span>
                <span className="text-slate-300 font-medium">
                  {dropoffLocation?.address || 'No Address'}
                </span>
                {dropoffLocation && (
                  <span className="block font-mono text-slate-500 text-[10px] mt-1">
                    Coordinates: {dropoffLocation.latitude}, {dropoffLocation.longitude}
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

              {pickupLocation ? (
                <iframe
                  title="Trip Map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={
                    dropoffLocation
                      ? `https://maps.google.com/maps?saddr=${pickupLocation.latitude},${pickupLocation.longitude}&daddr=${dropoffLocation.latitude},${dropoffLocation.longitude}&t=m&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`
                      : `https://maps.google.com/maps?q=${pickupLocation.latitude},${pickupLocation.longitude}&t=m&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`
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
            {pickupLocation && dropoffLocation ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${pickupLocation.latitude},${pickupLocation.longitude}&destination=${dropoffLocation.latitude},${dropoffLocation.longitude}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>🧭</span> Open in Google Maps
              </a>
            ) : pickupLocation ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${pickupLocation.latitude},${pickupLocation.longitude}`}
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
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
    </>
  );
}
