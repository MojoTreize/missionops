"use client";

import * as React from "react";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastProps["variant"];
  /** Durée d'affichage en millisecondes. */
  duration?: number;
}

interface ToastEntry extends ToastOptions {
  id: number;
  open: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let counter = 0;

/** Fournit le contexte des toasts et rend la file d'attente. */
export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    counter += 1;
    const id = counter;
    setToasts((current) => [...current, { id, open: true, ...options }]);
  }, []);

  const handleOpenChange = React.useCallback((id: number, open: boolean) => {
    if (open) return;
    setToasts((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, open: false } : entry)),
    );
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== id));
    }, 200);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastProvider swipeDirection="right">
        {children}
        {toasts.map(({ id, title, description, variant, duration, open }) => (
          <Toast
            key={id}
            variant={variant}
            duration={duration ?? 5000}
            open={open}
            onOpenChange={(next) => handleOpenChange(id, next)}
          >
            <div className="grid gap-1 pr-6">
              <ToastTitle>{title}</ToastTitle>
              {description ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

/** Accède à la fonction `toast` depuis n'importe quel composant client. */
export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast doit être utilisé dans <Toaster>.");
  }
  return context;
}
