"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Dato } from "@/components/dato";
import { buttonVariants } from "@/components/ui/button";
import { moneda, fechaCorta, fechaHora } from "@/lib/format";

export interface CompraDetalle {
  loteId: string;
  codigo: string;
  numeroLote: string;
  medicamento: string;
  cantidad: number;
  costoUnitario: number;
  fechaFabricacion: Date;
  fechaVencimiento: Date;
  proveedorNombre: string | null;
  proveedorDoc: string | null;
  documento: string | null;
  fecha: Date;
  registradoPor: string;
}

export function CompraDetalleModal({ c }: { c: CompraDetalle }) {
  const valor = c.cantidad * c.costoUnitario;
  return (
    <Modal
      title={`Entrada · ${c.codigo}`}
      description={c.medicamento}
      contentClassName="sm:max-w-xl"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label="Ver detalle de la entrada"
          title="Ver detalle"
          className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
        >
          <Eye className="size-4" />
        </button>
      )}
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-2 gap-4">
          <Dato etiqueta="Proveedor">{c.proveedorNombre ?? "—"}</Dato>
          <Dato etiqueta="Documento proveedor">{c.proveedorDoc ?? "—"}</Dato>
          <Dato etiqueta="Medicamento">{c.medicamento}</Dato>
          <Dato etiqueta="N.º de lote (fabricante)">{c.numeroLote}</Dato>
          <Dato etiqueta="Cantidad ingresada">
            <span className="font-semibold text-success">+{c.cantidad}</span>
          </Dato>
          <Dato etiqueta="Costo unitario">{moneda(c.costoUnitario)}</Dato>
          <Dato etiqueta="Valor de la entrada">
            <span className="font-semibold text-fx-blue">{moneda(valor)}</span>
          </Dato>
          <Dato etiqueta="Documento (guía/factura)">{c.documento ?? "—"}</Dato>
          <Dato etiqueta="Fabricación">{fechaCorta(c.fechaFabricacion)}</Dato>
          <Dato etiqueta="Vencimiento">{fechaCorta(c.fechaVencimiento)}</Dato>
          <Dato etiqueta="Fecha de ingreso">{fechaHora(c.fecha)}</Dato>
          <Dato etiqueta="Registrado por">{c.registradoPor}</Dato>
        </dl>
        <Link
          href={`/lotes/${c.loteId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Abrir lote completo
        </Link>
      </div>
    </Modal>
  );
}
