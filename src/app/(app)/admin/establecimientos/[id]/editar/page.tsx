import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstablecimientoForm } from "../../establecimiento-form";

export const metadata: Metadata = { title: "Editar establecimiento" };

export default async function EditarEstablecimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const establecimiento = await prisma.establecimiento.findUnique({ where: { id } });
  if (!establecimiento) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/establecimientos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Editar establecimiento</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{establecimiento.nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <EstablecimientoForm establecimiento={establecimiento} />
        </CardContent>
      </Card>
    </div>
  );
}
