import type { Metadata } from "next";
import Link from "next/link";
import { PackageMinus, Boxes, Layers, Plus } from "lucide-react";
import { salidasRecientes, resumenSalidas } from "@/services/inventario.service";
import { fechaHora } from "@/lib/format";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { MovimientoDetalleModal } from "@/components/salidas/movimiento-detalle-modal";

export const metadata: Metadata = { title: "Salidas" };

export default async function SalidasPage() {
  const [salidas, resumen] = await Promise.all([salidasRecientes(40), resumenSalidas()]);

  const kpis = [
    { etiqueta: "Salidas registradas", valor: resumen.totalSalidas, icono: PackageMinus, tono: "text-fx-blue" },
    { etiqueta: "Unidades dispensadas", valor: resumen.unidadesDispensadas, icono: Layers, tono: "text-fx-teal" },
    { etiqueta: "Lotes disponibles", valor: resumen.lotesDisponibles, icono: Boxes, tono: "text-fx-cyan" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Salidas / Dispensación</h1>
          <p className="text-sm text-muted-foreground">
            Historial de salidas. Registra una nueva desde el botón (sugiere FEFO).
          </p>
        </div>
        <Link href="/salidas/nueva" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Registrar salida
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icono = k.icono;
          return (
            <Card key={k.etiqueta}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{k.etiqueta}</p>
                  <p className="mt-1 text-2xl font-bold">{k.valor}</p>
                </div>
                <Icono className={`size-8 ${k.tono}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Historial de salidas */}
      <Card>
        <CardContent className="p-0">
          {salidas.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no se han registrado salidas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Lote</th>
                    <th className="p-3 font-medium">Medicamento</th>
                    <th className="p-3 font-medium">Cantidad</th>
                    <th className="p-3 font-medium">Destino</th>
                    <th className="p-3 font-medium">Documento</th>
                    <th className="p-3 text-right font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {salidas.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 whitespace-nowrap">{fechaHora(m.fecha)}</td>
                      <td className="p-3">{ETIQUETA_TIPO_MOVIMIENTO[m.tipo]}</td>
                      <td className="p-3 font-mono text-xs">{m.lote.codigo}</td>
                      <td className="p-3">{m.lote.medicamento.nombreComercial}</td>
                      <td className="p-3 font-semibold text-danger">−{m.cantidad}</td>
                      <td className="p-3">{m.destino ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{m.documentoRef ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex justify-end">
                          <MovimientoDetalleModal
                            m={{
                              loteId: m.loteId,
                              codigo: m.lote.codigo,
                              medicamento: m.lote.medicamento.nombreComercial,
                              tipo: m.tipo,
                              cantidad: m.cantidad,
                              motivo: m.motivo,
                              destino: m.destino,
                              documentoRef: m.documentoRef,
                              recibidoPor: m.recibidoPor,
                              cliente: m.cliente?.nombre ?? null,
                              fecha: m.fecha,
                              responsable: m.usuario?.nombre ?? "—",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
