import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Medicamentos" };

export default async function MedicamentosPage() {
  const medicamentos = await prisma.medicamento.findMany({
    include: { _count: { select: { lotes: true } } },
    orderBy: { nombreComercial: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Medicamentos</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de productos farmacéuticos registrados.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {medicamentos.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no hay medicamentos. Ejecuta el seed o regístralos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Código</th>
                    <th className="p-3 font-medium">Nombre comercial</th>
                    <th className="p-3 font-medium">Laboratorio</th>
                    <th className="p-3 font-medium">Presentación</th>
                    <th className="p-3 font-medium">Lotes</th>
                  </tr>
                </thead>
                <tbody>
                  {medicamentos.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 font-mono text-xs">{m.codigo}</td>
                      <td className="p-3 font-medium">{m.nombreComercial}</td>
                      <td className="p-3 text-muted-foreground">{m.laboratorio}</td>
                      <td className="p-3 text-muted-foreground">{m.presentacion ?? "—"}</td>
                      <td className="p-3">{m._count.lotes}</td>
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
