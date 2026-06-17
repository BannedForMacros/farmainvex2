"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { marcarLeida, resolverAlerta } from "./actions";

export function AlertaAcciones({ id, leida }: { id: string; leida: boolean }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();

  function run(fn: (id: string) => Promise<{ ok: boolean }>, mensaje: string) {
    start(async () => {
      await fn(id);
      toast.success(mensaje);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      {!leida && (
        <button
          onClick={() => run(marcarLeida, "Marcada como leída.")}
          disabled={pendiente}
          className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue disabled:opacity-50"
          title="Marcar como leída"
          aria-label="Marcar como leída"
        >
          <Eye className="size-4" />
        </button>
      )}
      <button
        onClick={() => run(resolverAlerta, "Alerta resuelta.")}
        disabled={pendiente}
        className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-success/15 hover:text-success disabled:opacity-50"
        title="Resolver alerta"
        aria-label="Resolver alerta"
      >
        <CheckCheck className="size-4" />
      </button>
    </div>
  );
}
