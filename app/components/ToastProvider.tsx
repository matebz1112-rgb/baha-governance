"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const value = useMemo(
    () => ({
      showToast(message: string, type: ToastType = "info") {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3600);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="toast" role="status">
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
