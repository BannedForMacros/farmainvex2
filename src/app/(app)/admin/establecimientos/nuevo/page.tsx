import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstablecimientoForm } from "../establecimiento-form";

export const metadata: Metadata = { title: "Nuevo establecimiento" };

export default function NuevoEstablecimientoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/establecimientos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo establecimiento</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del establecimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <EstablecimientoForm />
        </CardContent>
      </Card>
    </div>
  );
}
