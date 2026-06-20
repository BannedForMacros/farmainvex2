"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { guardarLote, type EstadoForm } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface LoteFormProps {
  medicamentos: { id: string; nombreComercial: string; codigo: string }[];
  establecimientos: { id: string; nombre: string }[];
  lote?: {
    id: string;
    medicamentoId: string;
    numeroLote: string;
    fechaFabricacion: string; // yyyy-mm-dd
    fechaVencimiento: string; // yyyy-mm-dd
    cantidad: number;
    costoUnitario: number;
    establecimientoId: string | null;
    observado: boolean;
  };
}

const inicial: EstadoForm = {};

export function LoteForm({ medicamentos, establecimientos, lote }: LoteFormProps) {
  const [estado, action, pendiente] = useActionState(guardarLote, inicial);
  const err = estado.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      {lote && <input type="hidden" name="id" value={lote.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Medicamento *" error={err.medicamentoId}>
          <Select name="medicamentoId" defaultValue={lote?.medicamentoId ?? ""} required>
            <option value="" disabled>
              Selecciona…
            </option>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombreComercial} ({m.codigo})
              </option>
            ))}
          </Select>
        </Campo>

        <Campo etiqueta="N.º de lote (fabricante) *" error={err.numeroLote}>
          <Input name="numeroLote" defaultValue={lote?.numeroLote} required />
        </Campo>

        <Campo etiqueta="Fecha de fabricación *" error={err.fechaFabricacion}>
          <Input type="date" name="fechaFabricacion" defaultValue={lote?.fechaFabricacion} required />
        </Campo>

        <Campo etiqueta="Fecha de vencimiento *" error={err.fechaVencimiento}>
          <Input type="date" name="fechaVencimiento" defaultValue={lote?.fechaVencimiento} required />
        </Campo>

        <Campo etiqueta="Cantidad *" error={err.cantidad}>
          <Input type="number" name="cantidad" min={0} defaultValue={lote?.cantidad ?? 0} required />
        </Campo>

        <Campo etiqueta="Costo unitario (S/)" error={err.costoUnitario}>
          <Input
            type="number"
            name="costoUnitario"
            min={0}
            step="0.01"
            defaultValue={lote?.costoUnitario ?? 0}
          />
        </Campo>

        <Campo etiqueta="Establecimiento" error={err.establecimientoId}>
          <Select name="establecimientoId" defaultValue={lote?.establecimientoId ?? ""}>
            <option value="">— Sin asignar —</option>
            {establecimientos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="observado"
          defaultChecked={lote?.observado}
          className="size-4 rounded border-input"
        />
        Marcar lote bajo observación (activa seguimiento sanitario)
      </label>

      {estado.error && <p className="text-sm text-danger">{estado.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente}>
          <Save className="size-4" />
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
        <Link href="/lotes" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Campo({
  etiqueta,
  error,
  children,
}: {
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{etiqueta}</Label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
