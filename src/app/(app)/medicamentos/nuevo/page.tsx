import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MedicamentoForm } from "../medicamento-form";

export const metadata: Metadata = { title: "Nuevo medicamento" };

export default function NuevoMedicamentoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/medicamentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo medicamento</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del medicamento</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicamentoForm />
        </CardContent>
      </Card>
    </div>
  );
}
