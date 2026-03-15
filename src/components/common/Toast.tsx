import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon =
    toast.type === "success"
      ? CheckCircle
      : toast.type === "error"
        ? XCircle
        : Info;

  const borderColor =
    toast.type === "success"
      ? "border-success/30"
      : toast.type === "error"
        ? "border-danger/30"
        : "border-accent/30";

  const iconColor =
    toast.type === "success"
      ? "text-success"
      : toast.type === "error"
        ? "text-danger"
        : "text-accent";

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 bg-surface-900 border ${borderColor} rounded-lg px-4 py-3 shadow-xl min-w-[300px] max-w-[420px] ${
        toast.exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      <Icon size={18} className={iconColor} />
      <p className="text-sm text-surface-200 flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-surface-500 hover:text-surface-300 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
