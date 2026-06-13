import type { FormEvent } from 'react';

export interface CancelTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  cancelComment: string;
  setCancelComment: (val: string) => void;
  cancelling: boolean;
  cancelError: string | null;
}

export default function CancelTripModal({
  isOpen,
  onClose,
  onSubmit,
  cancelComment,
  setCancelComment,
  cancelling,
  cancelError
}: CancelTripModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="text-rose-500 text-lg">⚠️</span> Cancel Trip Confirmation
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
          <form onSubmit={onSubmit}>
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
                onClick={onClose}
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
  );
}
