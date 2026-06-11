import type { Metadata } from "next";
import { Pill, Boxes, BellRing, ShieldAlert, CircleCheck, Coins } from "lucide-react";
import {
  obtenerKpis,
  lotesProximosAVencer,
  obtenerGraficosDashboard,
} from "@/services/dashboard.service";
import { moneda } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";
import { GraficoReporteVista } from "@/components/reportes/grafico-reporte";
import { RecalcularBoton } from "@/components/dashboard/recalcular-boton";

export const metadata: Metadata = { title: "Panel" };

export default async function DashboardPage() {
  const [kpis, graficos, proximos] = await Promise.all([
    obtenerKpis(),
    obtenerGraficosDashboard(),
    lotesProximosAVencer(),
  ]);

  const tarjetas = [
    { etiqueta: "Medicamentos", valor: kpis.totalMedicamentos, icono: Pill, tono: "text-fx-blue" },
    { etiqueta: "Lotes registrados", valor: kpis.totalLotes, icono: Boxes, tono: "text-fx-teal" },
    { etiqueta: "Alertas sin leer", valor: kpis.alertasSinLeer, icono: BellRing, tono: "text-[color:var(--warning)]" },
    { etiqueta: "Incidencias abiertas", valor: kpis.incidenciasAbiertas, icono: ShieldAlert, tono: "text-danger" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Panel de control</h1>
          <p className="text-sm text-muted-foreground">
            Estado sanitario y trazabilidad farmacéutica en tiempo real.
          </p>
        </div>
        <RecalcularBoton />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((t) => {
          const Icono = t.icono;
          return (
            <Card key={t.etiqueta}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{t.etiqueta}</p>
                  <p className="mt-1 text-3xl font-bold">{t.valor}</p>
                </div>
                <Icono className={`size-8 ${t.tono}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Valor de inventario */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-fx-blue/10 text-fx-blue">
              <Coins className="size-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Valor total del inventario</p>
              <p className="mt-0.5 text-3xl font-bold text-fx-blue">{moneda(kpis.valorInventario)}</p>
            </div>
          </div>
          <p className="hidden text-right text-sm text-muted-foreground sm:block">
            {kpis.totalLotes} lote(s) valorizado(s)
          </p>
        </CardContent>
      </Card>

      {/* Gráficos — fila 1: semáforo (pie) + valor por medicamento (barras) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <GraficoReporteVista grafico={graficos.semaforo} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <GraficoReporteVista grafico={graficos.valorMedicamento} />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos — fila 2: movimientos por tipo + próximos a vencer por mes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <GraficoReporteVista grafico={graficos.movimientos} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <GraficoReporteVista grafico={graficos.vencimientosMes} />
          </CardContent>
        </Card>
      </div>

      {/* Próximos a vencer */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos a vencer</CardTitle>
        </CardHeader>
        <CardContent>
          {proximos.length === 0 ? (
            <p className="flex items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
              <CircleCheck className="size-4 text-success" />
              No hay lotes en ventana de alerta.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="py-2 font-medium">Lote</th>
                    <th className="py-2 font-medium">Medicamento</th>
                    <th className="py-2 font-medium">Vence</th>
                    <th className="py-2 font-medium">Días</th>
                    <th className="py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {proximos.map((lote) => (
                    <tr key={lote.id} className="border-b border-border/60">
                      <td className="py-2 font-mono text-xs">{lote.codigo}</td>
                      <td className="py-2">{lote.medicamento.nombreComercial}</td>
                      <td className="py-2">{lote.fechaVencimiento.toLocaleDateString("es-PE")}</td>
                      <td className="py-2">{lote.diasRestantes ?? "—"}</td>
                      <td className="py-2">
                        <EstadoBadge estado={lote.estadoVencimiento} />
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
