"use client";

import { ArrowRightLeft } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { RegistrarMovimiento } from "./registrar-movimiento";

export function RegistrarMovimientoModal({
  loteId,
  stockDisponible,
}: {
  loteId: string;
  stockDisponible: number;
}) {
  return (
    <Modal
      title="Registrar movimiento"
      description="Entrada o salida de unidades de este lote."
      trigger={(open) => (
        <Button type="button" onClick={open}>
          <ArrowRightLeft className="size-4" /> Registrar movimiento
        </Button>
      )}
    >
      {(close) => (
        <RegistrarMovimiento loteId={loteId} stockDisponible={stockDisponible} onSuccess={close} />
      )}
    </Modal>
  );
}
