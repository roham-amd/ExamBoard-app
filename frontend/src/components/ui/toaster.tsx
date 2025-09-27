"use client";

import { Button } from "./button";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { useToast } from "./use-toast";

interface ToasterProps {
  rtl?: boolean;
  className?: string;
}

export function Toaster({ rtl, className }: ToasterProps) {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider swipeDirection={rtl ? "right" : "left"}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          onOpenChange={(open) => (open ? undefined : dismiss(toast.id))}
        >
          <div className="relative flex flex-col space-y-2 text-right">
            {toast.title ? <ToastTitle>{toast.title}</ToastTitle> : null}
            {toast.description ? (
              <ToastDescription>{toast.description}</ToastDescription>
            ) : null}

            {toast.action ? toast.action : null}
            <ToastClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground rtl:left-auto rtl:right-2"
                aria-label="بستن اعلان"
              >
                ×
              </Button>
            </ToastClose>
          </div>
        </Toast>
      ))}
      <ToastViewport className={className} />
    </ToastProvider>
  );
}
