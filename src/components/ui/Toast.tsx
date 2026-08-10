import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { createId } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = createId("toast");
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(100%-2rem,24rem)] -translate-x-1/2 flex-col gap-2 sm:bottom-6"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg transition-all",
              toast.type === "success" &&
                "border-success/30 bg-surface text-text shadow-success/10",
              toast.type === "error" &&
                "border-danger/30 bg-surface text-text shadow-danger/10",
              toast.type === "info" && "border-border bg-surface text-text",
            )}
            role="status"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-block h-2 w-2 shrink-0 self-center rounded-full",
                  toast.type === "success" && "bg-success",
                  toast.type === "error" && "bg-danger",
                  toast.type === "info" && "bg-primary",
                )}
                aria-hidden="true"
              />
              <span className="leading-snug">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
