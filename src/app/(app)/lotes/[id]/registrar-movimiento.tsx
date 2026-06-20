"use client";

import { useActionState, useEffect, useRef } from "react";
import { ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { registrarMovimiento, type EstadoMovimiento } from "../movimiento-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const inicial: EstadoMovimiento = {};

const OPCIONES = [
  { valor: "ENTRADA", etiqueta: "Entrada (suma stock)" },
  { valor: "SALIDA", etiqueta: "Salida / dispensación" },
  { valor: "TRASLADO", etiqueta: "Traslado" },
  { valor: "BAJA", etiqueta: "Baja" },
];

export function RegistrarMovimiento({
  loteId,
  stockDisponible,
}: {
  loteId: string;
  stockDisponible: number;
}) {
  const [estado, action, pendiente] = useActionState(registrarMovimiento, inicial);
  const formRef = useRef<HTMLFormElement>(null);
  const err = estado.fieldErrors ?? {};

  useEffect(() => {
    if (estado.ok) {
      toast.success("Movimiento registrado");
      formRef.current?.reset();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="loteId" value={loteId} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Tipo de movimiento *</Label>
          <Select name="tipo" defaultValue="SALIDA" required>
            {OPCIONES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Cantidad *</Label>
          <Input type="number" name="cantidad" min={1} defaultValue={1} required />
          {err.cantidad ? (
            <p className="text-xs text-danger">{err.cantidad}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Stock disponible: {stockDisponible}</p>
          )}
        </div>

        <div className="space-y-1.5 sm:col-span-1">
          <Label>Motivo</Label>
          <Input name="motivo" placeholder="Opcional" />
        </div>
      </div>

      <Button type="submit" disabled={pendiente}>
        <ArrowRightLeft className="size-4" />
        {pendiente ? "Registrando…" : "Registrar movimiento"}
      </Button>
    </form>
  );
}
