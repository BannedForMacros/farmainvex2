import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { obtenerCliente } from "@/services/cliente.service";
import { ETIQUETA_TIPO_DOCUMENTO } from "@/lib/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dato } from "@/components/dato";
import { EditarClienteForm } from "@/components/clientes/editar-cliente-form";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a clientes
        </Link>
        <h1 className="text-2xl font-bold">Editar cliente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {ETIQUETA_TIPO_DOCUMENTO[cliente.tipoDocumento]} {cliente.numeroDocumento}
            {cliente.origenDatos === "API" && (
              <Badge tono="success" className="gap-1">
                <ShieldCheck className="size-3" /> Verificado
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {cliente.origenDatos === "API" && (
            <dl className="grid grid-cols-2 gap-4">
              <Dato etiqueta="Dirección">{cliente.direccion ?? "—"}</Dato>
              <Dato etiqueta="Estado / Condición">
                {[cliente.estado, cliente.condicion].filter(Boolean).join(" · ") || "—"}
              </Dato>
              <Dato etiqueta="Ubicación">
                {[cliente.distrito, cliente.provincia, cliente.departamento].filter(Boolean).join(", ") || "—"}
              </Dato>
              <Dato etiqueta="Ventas registradas">{cliente._count.movimientos}</Dato>
            </dl>
          )}
          <EditarClienteForm
            cliente={{
              id: cliente.id,
              nombre: cliente.nombre,
              origenDatos: cliente.origenDatos as "API" | "MANUAL",
              activo: cliente.activo,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
