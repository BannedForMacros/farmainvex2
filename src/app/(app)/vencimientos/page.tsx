import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";
import { RecalcularBoton } from "@/components/dashboard/recalcular-boton";

export const metadata: Metadata = { title: "Monitoreo de vencimientos" };

export default async function VencimientosPage() {
  const lotes = await prisma.lote.findMany({
    where: { estado: { not: "RETIRADO" } },
    include: { medicamento: true },
    orderBy: { diasRestantes: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Monitoreo de vencimientos</h1>
          <p className="text-sm text-muted-foreground">
            Días restantes = fecha de vencimiento − fecha actual.
          </p>
        </div>
        <RecalcularBoton />
      </div>

      <Card>
        <CardContent className="p-0">
          {lotes.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No hay lotes registrados todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Lote</th>
                    <th className="p-3 font-medium">Medicamento</th>
                    <th className="p-3 font-medium">Laboratorio</th>
                    <th className="p-3 font-medium">Vence</th>
                    <th className="p-3 font-medium">Días</th>
                    <th className="p-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map((lote) => {
                    const sem = SEMAFORO[lote.estadoVencimiento];
                    return (
                      <tr key={lote.id} className="border-b border-border/60 hover:bg-muted/40">
                        <td className="p-3 font-mono text-xs">{lote.codigo}</td>
                        <td className="p-3">{lote.medicamento.nombreComercial}</td>
                        <td className="p-3 text-muted-foreground">{lote.medicamento.laboratorio}</td>
                        <td className="p-3">{lote.fechaVencimiento.toLocaleDateString("es-PE")}</td>
                        <td className="p-3 font-medium">{lote.diasRestantes ?? "—"}</td>
                        <td className="p-3">
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
