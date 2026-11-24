import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
          const accent =
            t.type === 'success'
              ? 'border-emerald-500/40 text-emerald-300'
              : t.type === 'error'
              ? 'border-[#E50914]/50 text-red-300'
              : 'border-white/15 text-zinc-200';
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-lg bg-[#141418]/95 backdrop-blur-md border px-4 py-3 shadow-2xl text-sm ${accent}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-white">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
