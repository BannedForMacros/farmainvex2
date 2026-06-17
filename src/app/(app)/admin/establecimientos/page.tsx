import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BotonEliminar } from "@/components/boton-eliminar";
import { ETIQUETA_TIPO_ESTABLECIMIENTO } from "@/lib/enums";
import { eliminarEstablecimiento } from "./actions";

export const metadata: Metadata = { title: "Establecimientos" };

export default async function EstablecimientosPage() {
  const establecimientos = await prisma.establecimiento.findMany({
    include: { _count: { select: { lotes: true, usuarios: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Administración
          </Link>
          <h1 className="text-2xl font-bold">Establecimientos</h1>
        </div>
        <Link
          href="/admin/establecimientos/nuevo"
          className={buttonVariants({ variant: "primary" })}
        >
          <Plus className="size-4" /> Nuevo establecimiento
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {establecimientos.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no hay establecimientos.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Nombre</th>
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Dirección</th>
                    <th className="p-3 font-medium">Lotes</th>
                    <th className="p-3 font-medium">Usuarios</th>
                    <th className="p-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {establecimientos.map((e) => (
                    <tr key={e.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 font-medium">{e.nombre}</td>
                      <td className="p-3">{ETIQUETA_TIPO_ESTABLECIMIENTO[e.tipo]}</td>
                      <td className="p-3 text-muted-foreground">{e.direccion ?? "—"}</td>
                      <td className="p-3">{e._count.lotes}</td>
                      <td className="p-3">{e._count.usuarios}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/establecimientos/${e.id}/editar`}
                            className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                            title="Editar"
                            aria-label={`Editar ${e.nombre}`}
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <BotonEliminar
                            accion={eliminarEstablecimiento}
                            id={e.id}
                            descripcion={`el establecimiento "${e.nombre}"`}
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
