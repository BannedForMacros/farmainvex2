import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LoteForm } from "../lote-form";

export const metadata: Metadata = { title: "Nuevo lote" };

export default async function NuevoLotePage() {
  const [medicamentos, establecimientos] = await Promise.all([
    prisma.medicamento.findMany({
      select: { id: true, nombreComercial: true, codigo: true },
      orderBy: { nombreComercial: "asc" },
    }),
    prisma.establecimiento.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/lotes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo lote</h1>
        <p className="text-sm text-muted-foreground">
          Al registrar el lote se evalúa su vencimiento y se generan alertas si corresponde.
        </p>
      </div>

      {medicamentos.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Primero debes registrar al menos un medicamento.
            </p>
            <Link href="/medicamentos/nuevo" className={buttonVariants({ variant: "primary" })}>
              Crear medicamento
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Datos del lote</CardTitle>
          </CardHeader>
          <CardContent>
            <LoteForm medicamentos={medicamentos} establecimientos={establecimientos} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
