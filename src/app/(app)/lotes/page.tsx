import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";

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
                    <th className="p-3 text-right font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {lotes.map((lote) => (
                    <tr key={lote.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 font-mono text-xs">{lote.codigo}</td>
                      <td className="p-3">{lote.numeroLote}</td>
                      <td className="p-3 font-medium">{lote.medicamento.nombreComercial}</td>
                      <td className="p-3">{lote.cantidad}</td>
                      <td className="p-3">{lote.fechaVencimiento.toLocaleDateString("es-PE")}</td>
                      <td className="p-3">
                        <EstadoBadge estado={lote.estadoVencimiento} />
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/lotes/${lote.id}`}
                          className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                          aria-label={`Ver detalle del lote ${lote.codigo}`}
                          title="Ver detalle"
                        >
                          <Eye className="size-4" />
                        </Link>
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
