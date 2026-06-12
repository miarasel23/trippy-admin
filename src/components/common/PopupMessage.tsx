import React from 'react';

interface PopupMessageProps {
  show: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'confirm';
  onClose: () => void;
  onConfirm?: () => void;
}

export const PopupMessage: React.FC<PopupMessageProps> = ({
  show,
  title,
  message,
  type = 'error',
  onClose,
  onConfirm,
}) => {
  if (!show) return null;

  const isSuccess = type === 'success';
  const isConfirm = type === 'confirm';

  const headerBg = isConfirm
    ? 'bg-gradient-to-r from-indigo-500 to-blue-600'
    : isSuccess 
      ? 'bg-gradient-to-r from-emerald-500 to-teal-600' 
      : 'bg-gradient-to-r from-rose-500 to-red-600';

  const icon = isConfirm ? (
    <svg className="w-6 h-6 text-indigo-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : isSuccess ? (
    <svg className="w-6 h-6 text-emerald-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-6 h-6 text-rose-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
        <div className="relative w-full max-w-md mx-auto my-6 transition-all duration-300 transform scale-100">
          <div className="relative flex flex-col w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl outline-none focus:outline-none overflow-hidden">
            {/* Header */}
            <div className={`flex items-center justify-between p-4 ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white/20 rounded-lg">
                  {icon}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {title ?? (isConfirm ? 'Confirm Action' : isSuccess ? 'Success' : 'Error')}
                </h3>
              </div>
              <button 
                type="button" 
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer" 
                onClick={onClose} 
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className="relative p-6 flex-auto">
              <p className="text-slate-300 text-base leading-relaxed">
                {message}
              </p>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end p-4 border-t border-slate-800/80 bg-slate-950/50 gap-3">
              {isConfirm ? (
                <>
                  <button 
                    type="button" 
                    className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow" 
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow" 
                    onClick={onConfirm}
                  >
                    Confirm
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow" 
                  onClick={onClose}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"></div>
    </>
  );
};

