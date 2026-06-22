import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { obtenerProveedor } from "@/services/proveedor.service";
import { ETIQUETA_TIPO_DOCUMENTO } from "@/lib/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dato } from "@/components/dato";
import { EntidadEditarForm } from "@/components/documento/entidad-editar-form";
import { editarProveedor } from "../../actions";

export const metadata: Metadata = { title: "Editar proveedor" };

export default async function EditarProveedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proveedor = await obtenerProveedor(id);
  if (!proveedor) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a proveedores
        </Link>
        <h1 className="text-2xl font-bold">Editar proveedor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {ETIQUETA_TIPO_DOCUMENTO[proveedor.tipoDocumento]} {proveedor.numeroDocumento}
            {proveedor.origenDatos === "API" && (
              <Badge tono="success" className="gap-1">
                <ShieldCheck className="size-3" /> Verificado
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {proveedor.origenDatos === "API" && (
            <dl className="grid grid-cols-2 gap-4">
              <Dato etiqueta="Dirección">{proveedor.direccion ?? "—"}</Dato>
              <Dato etiqueta="Estado / Condición">
                {[proveedor.estado, proveedor.condicion].filter(Boolean).join(" · ") || "—"}
              </Dato>
              <Dato etiqueta="Ubicación">
                {[proveedor.distrito, proveedor.provincia, proveedor.departamento].filter(Boolean).join(", ") || "—"}
              </Dato>
              <Dato etiqueta="Entradas registradas">{proveedor._count.movimientos}</Dato>
            </dl>
          )}
          <EntidadEditarForm
            entidad={{
              id: proveedor.id,
              nombre: proveedor.nombre,
              origenDatos: proveedor.origenDatos as "API" | "MANUAL",
              activo: proveedor.activo,
            }}
            editar={editarProveedor}
            redirigirA="/proveedores"
            noun="proveedor"
          />
        </CardContent>
      </Card>
    </div>
  );
}
