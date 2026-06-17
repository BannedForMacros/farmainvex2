"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { cambiarEstadoIncidencia } from "./actions";
import { ETIQUETA_ESTADO_INCIDENCIA } from "@/lib/enums";
import type { EstadoIncidencia } from "@/generated/prisma/enums";

const ESTADOS: EstadoIncidencia[] = [
  "ABIERTA",
  "EN_SEGUIMIENTO",
  "EN_VALIDACION",
  "RESUELTA",
  "CERRADA",
];

export function EstadoIncidenciaControl({
  id,
  estado,
}: {
  id: string;
  estado: EstadoIncidencia;
}) {
  const router = useRouter();
  const [pendiente, start] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const nuevo = e.target.value as EstadoIncidencia;
    start(async () => {
      await cambiarEstadoIncidencia(id, nuevo);
      toast.success(`Estado actualizado a "${ETIQUETA_ESTADO_INCIDENCIA[nuevo]}".`);
      router.refresh();
    });
  }

  return (
    <Select
      value={estado}
      onChange={onChange}
      disabled={pendiente}
      className="h-9 w-44 text-xs"
    >
      {ESTADOS.map((e) => (
        <option key={e} value={e}>
          {ETIQUETA_ESTADO_INCIDENCIA[e]}
        </option>
      ))}
    </Select>
  );
}
