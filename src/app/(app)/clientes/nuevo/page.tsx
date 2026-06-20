import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CrearClienteForm } from "@/components/clientes/crear-cliente-form";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a clientes
        </Link>
        <h1 className="text-2xl font-bold">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa el documento y el sistema trae los datos oficiales (RUC/DNI). Si no se encuentra,
          podrás registrar el nombre manualmente.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <CrearClienteForm />
        </CardContent>
      </Card>
    </div>
  );
}
