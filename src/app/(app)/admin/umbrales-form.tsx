"use client";

import { useActionState, useEffect } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { guardarUmbrales, type EstadoUmbrales } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inicial: EstadoUmbrales = {};

export function UmbralesForm({
  preventiva,
  critica,
}: {
  preventiva: number;
  critica: number;
}) {
  const [estado, action, pendiente] = useActionState(guardarUmbrales, inicial);

  useEffect(() => {
    if (estado.ok) toast.success("Umbrales actualizados y lotes recalculados.");
  }, [estado.ok]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Días para alerta preventiva 🟡</Label>
          <Input type="number" name="preventiva" min={1} defaultValue={preventiva} required />
        </div>
        <div className="space-y-1.5">
          <Label>Días para riesgo crítico 🔴</Label>
          <Input type="number" name="critica" min={1} defaultValue={critica} required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Un lote pasa a 🟡 cuando faltan ≤ {preventiva} días y a 🔴 cuando faltan ≤ {critica} días.
        El crítico debe ser menor que el preventivo.
      </p>
      {estado.error && <p className="text-sm text-danger">{estado.error}</p>}
      <Button type="submit" disabled={pendiente}>
        <Save className="size-4" />
        {pendiente ? "Guardando…" : "Guardar umbrales"}
      </Button>
    </form>
  );
}
