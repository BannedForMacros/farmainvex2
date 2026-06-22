import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EntidadDocumentoForm } from "@/components/documento/entidad-documento-form";
import { buscarDocumentoProveedor, crearProveedor } from "../actions";

export const metadata: Metadata = { title: "Nuevo proveedor" };

export default function NuevoProveedorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/proveedores"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a proveedores
        </Link>
        <h1 className="text-2xl font-bold">Nuevo proveedor</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa el documento y el sistema trae los datos oficiales (RUC/DNI). Si no se encuentra,
          podrás registrar el nombre manualmente.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <EntidadDocumentoForm
            acciones={{ buscar: buscarDocumentoProveedor, crear: crearProveedor }}
            redirigirA="/proveedores"
            verHref={(id) => `/proveedores/${id}/editar`}
            noun="proveedor"
          />
        </CardContent>
      </Card>
    </div>
  );
}
