import React, { createContext, useCallback, useContext, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons: Record<ToastType, React.ReactElement> = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l2.5 2.5L16 9" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2.2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
    </svg>
  ),
};

const styles: Record<ToastType, { bar: string; icon: string; bg: string; border: string; title: string }> = {
  success: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-400',
    bg: 'bg-slate-900',
    border: 'border-emerald-600/50',
    title: 'text-emerald-300',
  },
  error: {
    bar: 'bg-rose-500',
    icon: 'text-rose-400',
    bg: 'bg-slate-900',
    border: 'border-rose-600/50',
    title: 'text-rose-300',
  },
  warning: {
    bar: 'bg-amber-500',
    icon: 'text-amber-400',
    bg: 'bg-slate-900',
    border: 'border-amber-600/50',
    title: 'text-amber-300',
  },
  info: {
    bar: 'bg-indigo-500',
    icon: 'text-indigo-400',
    bg: 'bg-slate-900',
    border: 'border-indigo-600/50',
    title: 'text-indigo-300',
  },
};

// ─── Single Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const s = styles[toast.type];
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // mount animation
    const showTimer = setTimeout(() => setVisible(true), 10);
    // auto-dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 400);
    }, 10000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, [toast.id, onRemove]);

  return (
    <div
      style={{
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
      }}
      className={`relative flex items-start gap-3 w-80 max-w-xs rounded-xl border ${s.bg} ${s.border} shadow-2xl overflow-hidden px-4 py-3`}
    >
      {/* left colour bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />

      {/* icon */}
      <div className={`mt-0.5 shrink-0 ${s.icon}`}>{icons[toast.type]}</div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${s.title}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed break-words">{toast.message}</p>
        )}
      </div>

      {/* close button */}
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 400); }}
        className="shrink-0 mt-0.5 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${s.bar} opacity-40`}
        style={{ animation: 'toastProgress 10s linear forwards' }}
      />

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Portal-like fixed container */}
      <div
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}
        className="flex flex-col gap-3 items-end pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
