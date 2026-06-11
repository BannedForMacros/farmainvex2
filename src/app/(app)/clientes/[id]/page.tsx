import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, ShieldCheck } from "lucide-react";
import { obtenerCliente } from "@/services/cliente.service";
import { ETIQUETA_TIPO_DOCUMENTO } from "@/lib/enums";
import { fechaCorta } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Dato } from "@/components/dato";

export const metadata: Metadata = { title: "Cliente" };

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/clientes"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Volver a clientes
          </Link>
          <h1 className="text-2xl font-bold">{cliente.nombre}</h1>
        </div>
        <Link
          href={`/clientes/${cliente.id}/editar`}
          className={buttonVariants({ variant: "outline" })}
        >
          <Pencil className="size-4" /> Editar
        </Link>
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
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <Dato etiqueta="Dirección">{cliente.direccion ?? "—"}</Dato>
            <Dato etiqueta="Estado / Condición">
              {[cliente.estado, cliente.condicion].filter(Boolean).join(" · ") || "—"}
            </Dato>
            <Dato etiqueta="Ubicación">
              {[cliente.distrito, cliente.provincia, cliente.departamento].filter(Boolean).join(", ") || "—"}
            </Dato>
            <Dato etiqueta="Origen de datos">
              {cliente.origenDatos === "API" ? "API (verificado)" : "Manual"}
            </Dato>
            <Dato etiqueta="Estado del registro">
              {cliente.activo ? (
                <Badge tono="success">Activo</Badge>
              ) : (
                <Badge tono="warning">Inactivo</Badge>
              )}
            </Dato>
            <Dato etiqueta="Ventas registradas">{cliente._count.movimientos}</Dato>
            <Dato etiqueta="Registrado el">{fechaCorta(cliente.creadoEn)}</Dato>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
