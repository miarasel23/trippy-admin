import type { RiderItem } from '../services/types';
import { newwork_image_url } from '../../../shared/utils/constants';
import noImage from '../../../shared/assets/images/no-image.png';
import RiderTransactionView from './RiderTransactionView';

interface RiderTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: RiderItem | null;
}

export default function RiderTransactionModal({ isOpen, onClose, rider }: RiderTransactionModalProps) {
  if (!isOpen || !rider) return null;

  const avatarUrl = rider.profile_picture
    ? rider.profile_picture.startsWith('http')
      ? rider.profile_picture
      : `${newwork_image_url}${rider.profile_picture}`
    : noImage;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto outline-none focus:outline-none">
        <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          
          {/* ─── Header ─── */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={rider.full_name || 'Driver'}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow-md bg-slate-800"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = noImage;
                }}
              />
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {rider.full_name || 'Driver'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                      rider.is_active === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {rider.is_active || 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>{rider.country_code} {rider.phone_number}</span>
                  <span>•</span>
                  <span className="text-slate-400 truncate max-w-[200px]" title={rider.uuid}>
                    UUID: {rider.uuid}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* ─── Scrollable Modal Body ─── */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            <RiderTransactionView rider={rider} />
          </div>

          {/* ─── Footer ─── */}
          <div className="flex items-center justify-end p-4 border-t border-slate-800 bg-slate-950/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer shadow"
            >
              Close
            </button>
          </div>

        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
    </>
  );
}
