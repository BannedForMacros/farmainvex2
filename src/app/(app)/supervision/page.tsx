import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ETIQUETA_SEVERIDAD, TONO_SEVERIDAD } from "@/lib/enums";
import { fechaHora } from "@/lib/format";
import { EstadoIncidenciaControl } from "./estado-control";

export const metadata: Metadata = { title: "Supervisión farmacéutica" };

export default async function SupervisionPage() {
  const incidencias = await prisma.incidencia.findMany({
    include: { lote: { include: { medicamento: true } }, reportadoPor: true },
    orderBy: [{ estado: "asc" }, { creadoEn: "desc" }],
  });

  const abiertas = incidencias.filter(
    (i) => i.estado === "ABIERTA" || i.estado === "EN_SEGUIMIENTO",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Supervisión farmacéutica</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento y validación de incidencias sanitarias. {abiertas} pendiente(s).
          </p>
        </div>
        <Link href="/supervision/nueva" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Nueva incidencia
        </Link>
      </div>

      {incidencias.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldCheck className="size-8 text-success" />
            <p className="font-semibold">Sin incidencias registradas</p>
            <p className="text-sm text-muted-foreground">
              Las incidencias críticas (p.ej. productos vencidos) se generan automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Código</th>
                    <th className="p-3 font-medium">Título</th>
                    <th className="p-3 font-medium">Lote</th>
                    <th className="p-3 font-medium">Severidad</th>
                    <th className="p-3 font-medium">Registrada</th>
                    <th className="p-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.map((i) => (
                    <tr key={i.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 font-mono text-xs">{i.codigo}</td>
                      <td className="p-3">
                        <p className="font-medium">{i.titulo}</p>
                        {i.descripcion && (
                          <p className="text-xs text-muted-foreground">{i.descripcion}</p>
                        )}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {i.lote ? (
                          <Link href={`/lotes/${i.lote.id}`} className="hover:text-fx-blue">
                            {i.lote.codigo}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        <Badge tono={TONO_SEVERIDAD[i.severidad]}>
                          {ETIQUETA_SEVERIDAD[i.severidad]}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{fechaHora(i.creadoEn)}</td>
                      <td className="p-3">
                        <EstadoIncidenciaControl id={i.id} estado={i.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
