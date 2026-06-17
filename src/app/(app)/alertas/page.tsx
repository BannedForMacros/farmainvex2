import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BellRing, CircleCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Alertas sanitarias" };

const TONO: Record<string, "danger" | "warning" | "primary"> = {
  CRITICA: "danger",
  PREVENTIVA: "warning",
  INFO: "primary",
};

export default async function AlertasPage() {
  const alertas = await prisma.alerta.findMany({
    where: { resuelta: false },
    include: { lote: { include: { medicamento: true } } },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alertas sanitarias</h1>
        <p className="text-sm text-muted-foreground">
          Generadas automáticamente por el motor de reglas (sección VII).
        </p>
      </div>

      {alertas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <CircleCheck className="size-8 text-success" />
            <p className="font-semibold">Sin alertas pendientes</p>
            <p className="text-sm text-muted-foreground">
              Todo bajo control. Las nuevas alertas aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alertas.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <BellRing className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{a.mensaje}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.creadoEn.toLocaleString("es-PE")}
                    </p>
                  </div>
                </div>
                <Badge tono={TONO[a.severidad] ?? "primary"}>{a.severidad}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
