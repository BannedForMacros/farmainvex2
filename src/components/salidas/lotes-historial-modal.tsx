"use client";

import { Eye, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EstadoBadge } from "@/components/estado-badge";
import type { MedicamentoConLotes } from "@/services/inventario.service";

export function LotesHistorialModal({
  medicamento,
  loteSeleccionado,
  onElegir,
}: {
  medicamento: MedicamentoConLotes;
  loteSeleccionado: string;
  onElegir: (loteId: string) => void;
}) {
  return (
    <Modal
      title={`Lotes de ${medicamento.nombre}`}
      description="Ordenados por vencimiento más próximo (FEFO). Toca un lote para seleccionarlo."
      contentClassName="sm:max-w-2xl"
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          aria-label="Ver historial de lotes"
          title="Ver lotes de entrada"
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
        >
          <Eye className="size-4" />
        </button>
      )}
    >
      {(close) => (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-2 font-medium">Lote</th>
                <th className="p-2 font-medium">Ingreso</th>
                <th className="p-2 font-medium">Stock</th>
                <th className="p-2 font-medium">Vence</th>
                <th className="p-2 font-medium">Estado</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {medicamento.lotes.map((l) => {
                const activo = l.id === loteSeleccionado;
                return (
                  <tr
                    key={l.id}
                    className={`border-b border-border/60 ${activo ? "bg-fx-blue/5" : "hover:bg-muted/40"}`}
                  >
                    <td className="p-2 font-mono text-xs">{l.codigo}</td>
                    <td className="p-2 whitespace-nowrap">{l.ingreso}</td>
                    <td className="p-2 font-medium">{l.stock}</td>
                    <td className="p-2 whitespace-nowrap">{l.vence}</td>
                    <td className="p-2">
                      <EstadoBadge estado={l.estado} />
                    </td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onElegir(l.id);
                          close();
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-fx-blue hover:bg-fx-blue/10"
                      >
                        {activo ? <Check className="size-3.5" /> : null}
                        {activo ? "Seleccionado" : "Elegir"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
