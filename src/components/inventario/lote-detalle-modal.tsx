"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Dato } from "@/components/dato";
import { EstadoBadge } from "@/components/estado-badge";
import { buttonVariants } from "@/components/ui/button";
import { moneda, fechaCorta } from "@/lib/format";
import type { FilaInventario } from "@/services/inventario.service";

export function LoteDetalleModal({ fila }: { fila: FilaInventario }) {
  return (
    <Modal
      title={`Lote ${fila.codigo}`}
      description={fila.medicamento}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label={`Ver detalle del lote ${fila.codigo}`}
          title="Ver detalle"
          className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
        >
          <Eye className="size-4" />
        </button>
      )}
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-4">
          <Dato etiqueta="Stock disponible">{fila.stock} unidad(es)</Dato>
          <Dato etiqueta="Estado sanitario">
            <EstadoBadge estado={fila.estado} />
          </Dato>
          <Dato etiqueta="Costo unitario">{moneda(fila.costo)}</Dato>
          <Dato etiqueta="Valor del lote">
            <span className="font-semibold text-fx-blue">{moneda(fila.valor)}</span>
          </Dato>
          <Dato etiqueta="Fecha de vencimiento">{fechaCorta(fila.vence)}</Dato>
        </dl>
        <Link
          href={`/lotes/${fila.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Abrir lote completo
        </Link>
      </div>
    </Modal>
  );
}
