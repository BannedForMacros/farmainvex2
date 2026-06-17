import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicamentoForm } from "../../medicamento-form";

export const metadata: Metadata = { title: "Editar medicamento" };

export default async function EditarMedicamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const medicamento = await prisma.medicamento.findUnique({ where: { id } });
  if (!medicamento) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/medicamentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Editar medicamento</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{medicamento.nombreComercial}</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicamentoForm medicamento={medicamento} />
        </CardContent>
      </Card>
    </div>
  );
}
