import { newwork_image_url } from '../../../shared/utils/constants';
import noImage from '../../../shared/assets/images/no-image.png';
import type { CustomerUserItem } from '../services/types';

export interface CustomerDetailsModalProps {
  selectedCustomer: CustomerUserItem | null;
  onClose: () => void;
  onPreviewImage: (image: { url: string; title: string }) => void;
}

export default function CustomerDetailsModal({ selectedCustomer, onClose, onPreviewImage }: CustomerDetailsModalProps) {
  if (!selectedCustomer) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
            <h3 className="text-lg font-semibold text-white">Customer Profile Details</h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-800 pb-6">
              <img
                src={
                  selectedCustomer.profile_picture
                    ? selectedCustomer.profile_picture.startsWith('http')
                      ? selectedCustomer.profile_picture
                      : `${newwork_image_url}${selectedCustomer.profile_picture}`
                    : noImage
                }
                alt={selectedCustomer.full_name || 'Customer'}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-700 cursor-pointer hover:ring-indigo-500 transition-all"
                onClick={() => {
                  const url = selectedCustomer.profile_picture
                    ? selectedCustomer.profile_picture.startsWith('http')
                      ? selectedCustomer.profile_picture
                      : `${newwork_image_url}${selectedCustomer.profile_picture}`
                    : noImage;
                  onPreviewImage({ url, title: selectedCustomer.full_name || 'Customer' });
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = noImage;
                }}
              />
              <div className="text-center sm:text-left">
                <h4 className="text-xl font-bold text-white">
                  {selectedCustomer.full_name || <span className="text-slate-500 italic">No Name Provided</span>}
                </h4>
                <p className="text-slate-400 text-sm mt-0.5">{selectedCustomer.email || 'No email registered'}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                  <span className="px-2.5 py-0.5 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-semibold border border-indigo-700/50">
                    {selectedCustomer.role?.name || 'Customer'}
                  </span>
                  {selectedCustomer.is_active ? (
                    <span className="px-2.5 py-0.5 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-700/50">
                      Active Account
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-800 text-slate-500 rounded-full text-xs font-semibold border border-slate-700">
                      Inactive Account
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">UUID</span>
                <span className="block text-slate-300 text-sm font-mono mt-0.5 break-all">{selectedCustomer.uuid}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</span>
                <span className="block text-slate-300 text-sm font-mono mt-0.5">
                  {selectedCustomer.country_code} {selectedCustomer.phone_number}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">NID Number</span>
                <span className="block text-slate-300 text-sm font-mono mt-0.5">
                  {selectedCustomer.nid_number || <span className="text-slate-500 italic">N/A</span>}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Notification Device Token</span>
                <span className="block text-slate-300 text-sm font-mono mt-0.5 break-all">
                  {selectedCustomer.device_token_for_notification || <span className="text-slate-500 italic">None</span>}
                </span>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="border-t border-slate-800 pt-6">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assigned Permissions</span>
              {selectedCustomer.permissions && selectedCustomer.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                  {selectedCustomer.permissions.map((perm) => (
                    <span
                      key={perm.uuid}
                      className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700/60"
                      title={perm.code}
                    >
                      {perm.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 text-sm italic">No custom permissions assigned.</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
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
