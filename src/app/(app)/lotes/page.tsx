import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SEMAFORO } from "@/domain/vencimiento";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Lotes" };

export default async function LotesPage() {
  const lotes = await prisma.lote.findMany({
    include: { medicamento: true, establecimiento: true },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Control de lotes</h1>
        <p className="text-sm text-muted-foreground">
          Registro y seguimiento de lotes farmacéuticos.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {lotes.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no hay lotes registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Lote</th>
                    <th className="p-3 font-medium"># Fabricante</th>
                    <th className="p-3 font-medium">Medicamento</th>
                    <th className="p-3 font-medium">Cantidad</th>
                    <th className="p-3 font-medium">Vence</th>
                    <th className="p-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map((lote) => {
                    const sem = SEMAFORO[lote.estadoVencimiento];
                    return (
                      <tr key={lote.id} className="border-b border-border/60 hover:bg-muted/40">
                        <td className="p-3 font-mono text-xs">{lote.codigo}</td>
                        <td className="p-3">{lote.numeroLote}</td>
                        <td className="p-3 font-medium">{lote.medicamento.nombreComercial}</td>
                        <td className="p-3">{lote.cantidad}</td>
                        <td className="p-3">{lote.fechaVencimiento.toLocaleDateString("es-PE")}</td>
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
