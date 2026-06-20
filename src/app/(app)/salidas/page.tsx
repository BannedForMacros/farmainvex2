import type { Metadata } from "next";
import { PackageMinus, History } from "lucide-react";
import { lotesParaMovimiento, salidasRecientes } from "@/services/inventario.service";
import { fechaHora } from "@/lib/format";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegistrarMovimientoGlobal } from "@/components/inventario/registrar-movimiento-global";

export const metadata: Metadata = { title: "Salidas" };

export default async function SalidasPage() {
  const [lotes, salidas] = await Promise.all([
    lotesParaMovimiento(true), // solo lotes con stock
    salidasRecientes(40),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Salidas / Dispensación</h1>
        <p className="text-sm text-muted-foreground">
          Registra la salida de medicamentos. El sistema sugiere primero los lotes próximos a vencer (FEFO).
        </p>
      </div>

      {/* Registrar salida (rápido) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageMinus className="size-4 text-fx-teal" /> Registrar salida
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RegistrarMovimientoGlobal lotes={lotes} soloSalidas />
        </CardContent>
      </Card>

      {/* Historial de salidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-fx-blue" /> Historial de salidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {salidas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
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
                    <th className="p-3 font-medium">Motivo</th>
                    <th className="p-3 font-medium">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {salidas.map((m) => (
                    <tr key={m.id} className="border-b border-border/60">
                      <td className="p-3 whitespace-nowrap">{fechaHora(m.fecha)}</td>
                      <td className="p-3">{ETIQUETA_TIPO_MOVIMIENTO[m.tipo]}</td>
                      <td className="p-3 font-mono text-xs">{m.lote.codigo}</td>
                      <td className="p-3">{m.lote.medicamento.nombreComercial}</td>
                      <td className="p-3 font-semibold text-danger">−{m.cantidad}</td>
                      <td className="p-3 text-muted-foreground">{m.motivo ?? "—"}</td>
                      <td className="p-3">{m.usuario?.nombre ?? "—"}</td>
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
