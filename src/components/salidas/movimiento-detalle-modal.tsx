"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Dato } from "@/components/dato";
import { buttonVariants } from "@/components/ui/button";
import { fechaHora } from "@/lib/format";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/enums";
import type { TipoMovimiento } from "@/generated/prisma/enums";

export interface MovimientoDetalle {
  loteId: string;
  codigo: string;
  medicamento: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  destino: string | null;
  documentoRef: string | null;
  recibidoPor: string | null;
  fecha: Date;
  responsable: string;
}

export function MovimientoDetalleModal({ m }: { m: MovimientoDetalle }) {
  return (
    <Modal
      title={`${ETIQUETA_TIPO_MOVIMIENTO[m.tipo]} · ${m.codigo}`}
      description={m.medicamento}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label="Ver detalle del movimiento"
          title="Ver detalle"
          className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
        >
          <Eye className="size-4" />
        </button>
      )}
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-4">
          <Dato etiqueta="Tipo">{ETIQUETA_TIPO_MOVIMIENTO[m.tipo]}</Dato>
          <Dato etiqueta="Cantidad">
            <span className="font-semibold text-danger">−{m.cantidad}</span>
          </Dato>
          <Dato etiqueta="Motivo">{m.motivo ?? "—"}</Dato>
          <Dato etiqueta="Destino">{m.destino ?? "—"}</Dato>
          <Dato etiqueta="Documento de referencia">{m.documentoRef ?? "—"}</Dato>
          <Dato etiqueta="Recibido por">{m.recibidoPor ?? "—"}</Dato>
          <Dato etiqueta="Fecha y hora">{fechaHora(m.fecha)}</Dato>
          <Dato etiqueta="Registrado por">{m.responsable}</Dato>
        </dl>
        <Link
          href={`/lotes/${m.loteId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Abrir lote completo
        </Link>
      </div>
    </Modal>
  );
}
