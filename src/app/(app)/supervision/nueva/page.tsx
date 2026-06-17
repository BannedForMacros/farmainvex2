import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncidenciaForm } from "../incidencia-form";

export const metadata: Metadata = { title: "Nueva incidencia" };

export default async function NuevaIncidenciaPage() {
  const lotesRaw = await prisma.lote.findMany({
    include: { medicamento: true },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });
  const lotes = lotesRaw.map((l) => ({
    id: l.id,
    codigo: l.codigo,
    nombre: l.medicamento.nombreComercial,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/supervision"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Nueva incidencia</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la incidencia</CardTitle>
        </CardHeader>
        <CardContent>
          <IncidenciaForm lotes={lotes} />
        </CardContent>
      </Card>
    </div>
  );
}
