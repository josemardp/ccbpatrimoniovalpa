"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "sucesso" | "erro" | "aviso";
type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const ToastContext = createContext<{
  showToast: (message: string, variant?: ToastVariant) => void;
} | null>(null);

const variantClass = {
  sucesso: "border-green-200 bg-green-50 text-green-800",
  erro: "border-red-200 bg-red-50 text-red-800",
  aviso: "border-amber-200 bg-amber-50 text-amber-800",
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "sucesso") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${variantClass[toast.variant]}`} key={toast.id}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }

  return context;
}
