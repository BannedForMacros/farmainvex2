"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  /** Render del disparador; recibe `open` para abrir el modal. */
  trigger: (open: () => void) => ReactNode;
  title: string;
  description?: string;
  /** Contenido; si es función recibe `close` para cerrar (útil tras enviar). */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Control del ancho del contenido (por defecto max-w-lg). */
  contentClassName?: string;
}

export function Modal({ trigger, title, description, children, contentClassName }: ModalProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {trigger(() => setOpen(true))}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={close}
              aria-hidden
            />
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:max-w-lg sm:rounded-2xl",
              contentClassName,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold">{title}</h2>
                {description && (
                  <p className="truncate text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              {typeof children === "function" ? children(close) : children}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
