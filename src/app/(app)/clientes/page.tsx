import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, Search, ShieldCheck } from "lucide-react";
import { listarClientes } from "@/services/cliente.service";
import { ETIQUETA_TIPO_DOCUMENTO } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { BotonEliminar } from "@/components/boton-eliminar";
import { eliminarCliente } from "./actions";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const clientes = await listarClientes(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Registro de clientes para ventas. Datos verificados vía RUC/DNI.
          </p>
        </div>
        <Link href="/clientes/nuevo" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Nuevo cliente
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
          {clientes.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {q ? "Sin resultados para tu búsqueda." : "Aún no hay clientes registrados."}
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
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-xs text-muted-foreground">
                          {ETIQUETA_TIPO_DOCUMENTO[c.tipoDocumento]}
                        </span>{" "}
                        <span className="font-medium">{c.numeroDocumento}</span>
                      </td>
                      <td className="p-3 font-medium">{c.nombre}</td>
                      <td className="p-3 text-muted-foreground">{c.direccion ?? "—"}</td>
                      <td className="p-3">
                        {c.origenDatos === "API" ? (
                          <Badge tono="success" className="gap-1">
                            <ShieldCheck className="size-3" /> Verificado
                          </Badge>
                        ) : (
                          <Badge tono="primary">Manual</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        {c.activo ? (
                          <Badge tono="success">Activo</Badge>
                        ) : (
                          <Badge tono="warning">Inactivo</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/clientes/${c.id}/editar`}
                            className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                            aria-label={`Editar ${c.nombre}`}
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <BotonEliminar
                            accion={eliminarCliente}
                            id={c.id}
                            descripcion={`el cliente ${c.nombre}`}
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
