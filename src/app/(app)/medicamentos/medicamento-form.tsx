"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { guardarMedicamento, type EstadoForm } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MedicamentoFormProps {
  medicamento?: {
    id: string;
    codigo: string;
    nombreComercial: string;
    laboratorio: string;
    principioActivo: string | null;
    presentacion: string | null;
  };
}

const inicial: EstadoForm = {};

export function MedicamentoForm({ medicamento }: MedicamentoFormProps) {
  const [estado, action, pendiente] = useActionState(guardarMedicamento, inicial);
  const err = estado.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      {medicamento && <input type="hidden" name="id" value={medicamento.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Código *" error={err.codigo}>
          <Input name="codigo" defaultValue={medicamento?.codigo} required />
        </Campo>
        <Campo etiqueta="Nombre comercial *" error={err.nombreComercial}>
          <Input name="nombreComercial" defaultValue={medicamento?.nombreComercial} required />
        </Campo>
        <Campo etiqueta="Laboratorio *" error={err.laboratorio}>
          <Input name="laboratorio" defaultValue={medicamento?.laboratorio} required />
        </Campo>
        <Campo etiqueta="Principio activo" error={err.principioActivo}>
          <Input name="principioActivo" defaultValue={medicamento?.principioActivo ?? ""} />
        </Campo>
        <Campo etiqueta="Presentación" error={err.presentacion}>
          <Input name="presentacion" defaultValue={medicamento?.presentacion ?? ""} />
        </Campo>
      </div>

      {estado.error && <p className="text-sm text-danger">{estado.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente}>
          <Save className="size-4" />
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
        <Link href="/medicamentos" className={buttonVariants({ variant: "outline" })}>
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
