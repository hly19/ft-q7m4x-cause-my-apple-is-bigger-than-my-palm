import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Undo = () => Promise<void> | void;
interface ToastState { id: number; message: string; undo?: Undo }

const ToastCtx = createContext<(message: string, undo?: Undo) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, undo?: Undo) => {
    clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, message, undo });
    timer.current = window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 5000);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 pointer-events-none" role="status" aria-live="polite">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 pl-4 pr-1 py-1 shadow-lg max-w-md w-full">
            <span className="flex-1 truncate">{toast.message}</span>
            {toast.undo && (
              <button
                className="min-h-11 px-4 font-semibold text-emerald-400 dark:text-emerald-700"
                onClick={async () => {
                  const u = toast.undo!;
                  setToast(null);
                  await u();
                }}
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}
