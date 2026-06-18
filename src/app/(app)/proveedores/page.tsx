import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Eye, Pencil, Search, ShieldCheck } from "lucide-react";
import { listarProveedores } from "@/services/proveedor.service";
import { ETIQUETA_TIPO_DOCUMENTO } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { BotonEliminar } from "@/components/boton-eliminar";
import { eliminarProveedor } from "./actions";

export const metadata: Metadata = { title: "Proveedores" };

export default async function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const proveedores = await listarProveedores(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Registro de proveedores para entradas/compras. Datos verificados vía RUC/DNI.
          </p>
        </div>
        <Link href="/proveedores/nuevo" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Nuevo proveedor
        </Link>
      </div>

      <form method="GET" className="flex max-w-md gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre o documento…" />
        <button type="submit" className={buttonVariants({ variant: "outline" })}>
          <Search className="size-4" /> Buscar
        </button>
      </form>

      <Card>
        <CardContent className="p-0">
          {proveedores.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {q ? "Sin resultados para tu búsqueda." : "Aún no hay proveedores registrados."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Documento</th>
                    <th className="p-3 font-medium">Nombre / Razón social</th>
                    <th className="p-3 font-medium">Dirección</th>
                    <th className="p-3 font-medium">Origen</th>
                    <th className="p-3 font-medium">Estado</th>
                    <th className="p-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ETIQUETA_TIPO_DOCUMENTO[p.tipoDocumento]}
                        </span>{" "}
                        <span className="font-medium">{p.numeroDocumento}</span>
                      </td>
                      <td className="p-3 font-medium">{p.nombre}</td>
                      <td className="p-3 text-muted-foreground">{p.direccion ?? "—"}</td>
                      <td className="p-3">
                        {p.origenDatos === "API" ? (
                          <Badge tono="success" className="gap-1">
                            <ShieldCheck className="size-3" /> Verificado
                          </Badge>
                        ) : (
                          <Badge tono="primary">Manual</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {p.activo ? (
                          <Badge tono="success">Activo</Badge>
                        ) : (
                          <Badge tono="warning">Inactivo</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/proveedores/${p.id}`}
                            className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                            aria-label={`Ver ${p.nombre}`}
                            title="Ver detalle"
                          >
                            <Eye className="size-4" />
                          </Link>
                          <Link
                            href={`/proveedores/${p.id}/editar`}
                            className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                            aria-label={`Editar ${p.nombre}`}
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <BotonEliminar
                            accion={eliminarProveedor}
                            id={p.id}
                            descripcion={`el proveedor ${p.nombre}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
