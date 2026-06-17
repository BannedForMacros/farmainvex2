import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoteForm } from "../../lote-form";

export const metadata: Metadata = { title: "Editar lote" };

/** Convierte una fecha a yyyy-mm-dd para inputs date. */
function aInputDate(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export default async function EditarLotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [lote, medicamentos, establecimientos] = await Promise.all([
    prisma.lote.findUnique({ where: { id } }),
    prisma.medicamento.findMany({
      select: { id: true, nombreComercial: true, codigo: true },
      orderBy: { nombreComercial: "asc" },
    }),
    prisma.establecimiento.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!lote) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/lotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Editar lote</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-mono">{lote.codigo}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoteForm
            medicamentos={medicamentos}
            establecimientos={establecimientos}
            lote={{
              id: lote.id,
              medicamentoId: lote.medicamentoId,
              numeroLote: lote.numeroLote,
              fechaFabricacion: aInputDate(lote.fechaFabricacion),
              fechaVencimiento: aInputDate(lote.fechaVencimiento),
              cantidad: lote.cantidad,
              establecimientoId: lote.establecimientoId,
              observado: lote.observado,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
