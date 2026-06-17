import type { Metadata } from "next";
import { Pill, Boxes, BellRing, ShieldAlert } from "lucide-react";
import { obtenerKpis, lotesProximosAVencer } from "@/services/dashboard.service";
import { SEMAFORO } from "@/domain/vencimiento";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecalcularBoton } from "@/components/dashboard/recalcular-boton";

export const metadata: Metadata = { title: "Panel" };

export default async function DashboardPage() {
  const kpis = await obtenerKpis();
  const proximos = await lotesProximosAVencer();

  const tarjetas = [
    { etiqueta: "Medicamentos", valor: kpis.totalMedicamentos, icono: Pill, tono: "text-fx-blue" },
    { etiqueta: "Lotes registrados", valor: kpis.totalLotes, icono: Boxes, tono: "text-fx-teal" },
    { etiqueta: "Alertas sin leer", valor: kpis.alertasSinLeer, icono: BellRing, tono: "text-[color:var(--warning)]" },
    { etiqueta: "Incidencias abiertas", valor: kpis.incidenciasAbiertas, icono: ShieldAlert, tono: "text-danger" },
  ];

  const semaforo = [
    { ...SEMAFORO.VIGENTE, valor: kpis.lotesVigentes },
    { ...SEMAFORO.PREVENTIVA, valor: kpis.lotesPreventiva },
    { ...SEMAFORO.CRITICO, valor: kpis.lotesCriticos },
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

      {/* Semáforo de vencimientos */}
      <div className="grid gap-4 sm:grid-cols-3">
        {semaforo.map((s) => (
          <Card key={s.etiqueta}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="text-3xl">{s.emoji}</span>
              <div>
                <p className="text-2xl font-bold" style={{ color: s.color }}>
                  {s.valor}
                </p>
                <p className="text-sm text-muted-foreground">{s.etiqueta}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próximos a vencer */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos a vencer</CardTitle>
        </CardHeader>
        <CardContent>
          {proximos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay lotes en ventana de alerta. 🟢
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
                  {proximos.map((lote) => {
                    const sem = SEMAFORO[lote.estadoVencimiento];
                    return (
                      <tr key={lote.id} className="border-b border-border/60">
                        <td className="py-2 font-mono text-xs">{lote.codigo}</td>
                        <td className="py-2">{lote.medicamento.nombreComercial}</td>
                        <td className="py-2">
                          {lote.fechaVencimiento.toLocaleDateString("es-PE")}
                        </td>
                        <td className="py-2">{lote.diasRestantes ?? "—"}</td>
                        <td className="py-2">
                          <Badge tono={sem.tono}>
                            {sem.emoji} {sem.etiqueta}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
