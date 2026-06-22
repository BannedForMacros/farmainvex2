"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Edición genérica: el nombre solo es editable en entidades MANUAL (los datos de
 * API son oficiales). Siempre permite activar/desactivar.
 */
export function EntidadEditarForm({
  entidad,
  editar,
  redirigirA,
  noun = "registro",
}: {
  entidad: { id: string; nombre: string; origenDatos: "API" | "MANUAL"; activo: boolean };
  editar: (id: string, input: { nombre?: string; activo: boolean }) => Promise<{ ok: boolean; error?: string }>;
  redirigirA: string;
  noun?: string;
}) {
  const router = useRouter();
  const esApi = entidad.origenDatos === "API";
  const [nombre, setNombre] = useState(entidad.nombre);
  const [activo, setActivo] = useState(entidad.activo);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    setGuardando(true);
    try {
      const r = await editar(entidad.id, { nombre, activo });
      if (!r.ok) {
        toast.error(r.error ?? "No se pudo guardar.");
        return;
      }
      toast.success("Actualizado");
      router.push(redirigirA);
      router.refresh();
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Nombre / Razón social</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={esApi} />
        {esApi && (
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" /> Dato oficial (verificado): no editable.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="size-4 rounded border-input"
        />
        {noun.charAt(0).toUpperCase() + noun.slice(1)} activo
      </label>

      <Button type="button" onClick={guardar} disabled={guardando}>
        <Save className="size-4" />
        {guardando ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}
