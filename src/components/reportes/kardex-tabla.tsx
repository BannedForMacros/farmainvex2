"use client";

import { Eye, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { KardexProducto } from "@/services/reportes.service";

export function KardexTabla({ kardex }: { kardex: KardexProducto[] }) {
  if (kardex.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        No hay productos con movimientos en el rango seleccionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/50 text-left">
            <th className="px-4 py-2.5 font-semibold">Medicamento</th>
            <th className="px-4 py-2.5 font-semibold">Stock inicial</th>
            <th className="px-4 py-2.5 font-semibold text-success">Entradas</th>
            <th className="px-4 py-2.5 font-semibold text-danger">Salidas</th>
            <th className="px-4 py-2.5 font-semibold">Stock final</th>
            <th className="px-4 py-2.5 text-right font-semibold">Detalle</th>
          </tr>
        </thead>
        <tbody>
          {kardex.map((k) => (
            <tr key={k.medicamentoId} className="border-b last:border-0 hover:bg-secondary/30">
              <td className="px-4 py-2.5 font-medium">
                {k.medicamento}
                <span className="ml-2 text-xs text-muted-foreground">{k.lotes.length} lote(s)</span>
              </td>
              <td className="px-4 py-2.5">{k.stockInicial}</td>
              <td className="px-4 py-2.5 font-medium text-success">+{k.entradas}</td>
              <td className="px-4 py-2.5 font-medium text-danger">−{k.salidas}</td>
              <td className="px-4 py-2.5 font-semibold">{k.stockFinal}</td>
              <td className="px-4 py-2.5">
                <div className="flex justify-end">
                  <Modal
                    title={`Kardex · ${k.medicamento}`}
                    description={`Stock inicial ${k.stockInicial} · +${k.entradas} entradas · −${k.salidas} salidas · final ${k.stockFinal}`}
                    contentClassName="sm:max-w-3xl"
                    trigger={(open) => (
                      <button
                        type="button"
                        onClick={open}
                        aria-label={`Ver detalle de ${k.medicamento}`}
                        title="Ver detalle"
                        className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                      >
                        <Eye className="size-4" />
                      </button>
                    )}
                  >
                    <div className="space-y-5">
                      {/* Por lote */}
                      <div>
                        <p className="mb-2 text-sm font-semibold">Por lote</p>
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-secondary/40 text-left text-muted-foreground">
                                <th className="p-2 font-medium">Lote</th>
                                <th className="p-2 font-medium">Vence</th>
                                <th className="p-2 font-medium">Inicial</th>
                                <th className="p-2 font-medium text-success">Entradas</th>
                                <th className="p-2 font-medium text-danger">Salidas</th>
                                <th className="p-2 font-medium">Final</th>
                              </tr>
                            </thead>
                            <tbody>
                              {k.lotes.map((l) => (
                                <tr key={l.codigo} className="border-b border-border/60 last:border-0">
                                  <td className="p-2 font-mono">{l.codigo}</td>
                                  <td className="p-2 whitespace-nowrap">{l.vence}</td>
                                  <td className="p-2">{l.stockInicial}</td>
                                  <td className="p-2 text-success">+{l.entradas}</td>
                                  <td className="p-2 text-danger">−{l.salidas}</td>
                                  <td className="p-2 font-semibold">{l.stockFinal}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Movimientos del rango */}
                      <div>
                        <p className="mb-2 text-sm font-semibold">
                          Movimientos en el periodo ({k.movimientos.length})
                        </p>
                        {k.movimientos.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Sin movimientos en el rango.</p>
                        ) : (
                          <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                            <table className="w-full text-xs">
                              <thead className="sticky top-0">
                                <tr className="border-b border-border bg-secondary/40 text-left text-muted-foreground">
                                  <th className="p-2 font-medium">Fecha</th>
                                  <th className="p-2 font-medium">Tipo</th>
                                  <th className="p-2 font-medium">Lote</th>
                                  <th className="p-2 font-medium">Mov.</th>
                                  <th className="p-2 font-medium">Documento</th>
                                </tr>
                              </thead>
                              <tbody>
                                {k.movimientos.map((m, i) => (
                                  <tr key={i} className="border-b border-border/60 last:border-0">
                                    <td className="p-2 whitespace-nowrap">{m.fecha}</td>
                                    <td className="p-2">{m.tipo}</td>
                                    <td className="p-2 font-mono">{m.lote}</td>
                                    <td className="p-2">
                                      {m.entrada > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-success">
                                          <ArrowDownToLine className="size-3" /> +{m.entrada}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-danger">
                                          <ArrowUpFromLine className="size-3" /> −{m.salida}
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-2 text-muted-foreground">{m.documento}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </Modal>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
