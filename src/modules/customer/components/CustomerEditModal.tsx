import type { FormEvent, ChangeEvent, RefObject } from 'react';

export interface CustomerEditModalProps {
  editForm: {
    uuid: string;
    full_name: string;
    email: string;
    phone_number: string;
    country_code: string;
    is_notification_enabled: boolean;
    device_token_for_notification: string;
    is_active: boolean;
  };
  setEditForm: (val: any) => void;
  editAvatarUrl: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleAvatarFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  formError: string | null;
  submitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
}

export default function CustomerEditModal({
  editForm,
  setEditForm,
  editAvatarUrl,
  fileInputRef,
  handleAvatarFileChange,
  formError,
  submitting,
  onSubmit,
  onClose
}: CustomerEditModalProps) {
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
            <h3 className="text-lg font-semibold text-white">Edit Customer Profile</h3>
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

          <form onSubmit={onSubmit}>
            <div className="p-6 space-y-6">
              {formError && (
                <div className="px-4 py-3 bg-rose-900/40 border border-rose-700 text-rose-300 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              {/* Profile Picture interactive preview */}
              <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-6">
                <div className="relative cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                  <img
                    src={editAvatarUrl}
                    alt="Customer Avatar"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-slate-700 group-hover:ring-indigo-500 transition-all"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs text-slate-500">Click image to upload new avatar</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Country Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +880"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={editForm.country_code}
                    onChange={(e) => setEditForm({ ...editForm, country_code: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={editForm.phone_number}
                    onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Device Token for Notification</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    value={editForm.device_token_for_notification}
                    onChange={(e) => setEditForm({ ...editForm, device_token_for_notification: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_notification_enabled"
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    checked={editForm.is_notification_enabled}
                    onChange={(e) => setEditForm({ ...editForm, is_notification_enabled: e.target.checked })}
                  />
                  <label htmlFor="is_notification_enabled" className="text-sm font-semibold text-slate-300 select-none cursor-pointer">
                    Enable Notifications
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active" className="text-sm font-semibold text-slate-300 select-none cursor-pointer">
                    Account Active
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/40 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"></div>
    </>
  );
}
