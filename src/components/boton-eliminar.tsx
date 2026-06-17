"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BotonEliminarProps {
  /** Server action que recibe el id y devuelve el resultado. */
  accion: (id: string) => Promise<{ ok: boolean; error?: string }>;
  id: string;
  descripcion: string; // p.ej. 'el medicamento "Paracetamol"'
}

export function BotonEliminar({ accion, id, descripcion }: BotonEliminarProps) {
  const router = useRouter();
  const [pendiente, start] = useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar ${descripcion}? Esta acción no se puede deshacer.`)) return;
    start(async () => {
      const r = await accion(id);
      if (r.ok) {
        toast.success("Eliminado correctamente.");
        router.refresh();
      } else {
        toast.error(r.error ?? "No se pudo eliminar.");
      }
    });
  }

  return (
    <button
      onClick={onClick}
      disabled={pendiente}
      className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
      aria-label="Eliminar"
      title="Eliminar"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
