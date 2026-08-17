import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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

  const stack =
    typeof document === "undefined"
      ? null
      : createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 z-[250] flex justify-center px-4 sm:px-6"
            style={{
              bottom:
                "max(1rem, calc(env(safe-area-inset-bottom, 0px) + 5.25rem))",
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex w-[min(100%,24rem)] flex-col gap-2">
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
          </div>,
          document.body,
        );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {stack}
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
