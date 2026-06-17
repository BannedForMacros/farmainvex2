"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { crearIncidencia, type EstadoForm } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface IncidenciaFormProps {
  lotes: { id: string; codigo: string; nombre: string }[];
}

const inicial: EstadoForm = {};

export function IncidenciaForm({ lotes }: IncidenciaFormProps) {
  const [estado, action, pendiente] = useActionState(crearIncidencia, inicial);
  const err = estado.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Título *</Label>
        <Input name="titulo" placeholder="Ej. Riesgo de almacenamiento en refrigeración" required />
        {err.titulo && <p className="text-xs text-danger">{err.titulo}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Textarea name="descripcion" placeholder="Detalle de la incidencia sanitaria…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Severidad *</Label>
          <Select name="severidad" defaultValue="PREVENTIVA" required>
            <option value="INFO">Informativa</option>
            <option value="PREVENTIVA">Preventiva</option>
            <option value="CRITICA">Crítica</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Lote relacionado</Label>
          <Select name="loteId" defaultValue="">
            <option value="">— Ninguno —</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo} · {l.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {estado.error && <p className="text-sm text-danger">{estado.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente}>
          <Save className="size-4" />
          {pendiente ? "Guardando…" : "Registrar incidencia"}
        </Button>
        <Link href="/supervision" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
