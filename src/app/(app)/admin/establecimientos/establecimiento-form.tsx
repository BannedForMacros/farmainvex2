"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { guardarEstablecimiento, type EstadoForm } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ETIQUETA_TIPO_ESTABLECIMIENTO } from "@/lib/enums";
import type { TipoEstablecimiento } from "@/generated/prisma/enums";

const TIPOS = Object.keys(ETIQUETA_TIPO_ESTABLECIMIENTO) as TipoEstablecimiento[];
const inicial: EstadoForm = {};

export function EstablecimientoForm({
  establecimiento,
}: {
  establecimiento?: {
    id: string;
    nombre: string;
    tipo: TipoEstablecimiento;
    direccion: string | null;
  };
}) {
  const [estado, action, pendiente] = useActionState(guardarEstablecimiento, inicial);
  const err = estado.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      {establecimiento && <input type="hidden" name="id" value={establecimiento.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre *</Label>
          <Input name="nombre" defaultValue={establecimiento?.nombre} required />
          {err.nombre && <p className="text-xs text-danger">{err.nombre}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Tipo *</Label>
          <Select name="tipo" defaultValue={establecimiento?.tipo ?? "FARMACIA"} required>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_ESTABLECIMIENTO[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Dirección</Label>
        <Input name="direccion" defaultValue={establecimiento?.direccion ?? ""} />
      </div>

      {estado.error && <p className="text-sm text-danger">{estado.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente}>
          <Save className="size-4" />
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
        <Link href="/admin/establecimientos" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
