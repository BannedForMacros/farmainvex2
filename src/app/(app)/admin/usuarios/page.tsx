import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { BotonEliminar } from "@/components/boton-eliminar";
import { eliminarUsuario } from "./actions";

export const metadata: Metadata = { title: "Usuarios" };

const ETIQUETA_ROL: Record<string, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  FARMACEUTICO: "Farmacéutico",
  OPERADOR: "Operador",
};

export default async function UsuariosPage() {
  const usuarios = await prisma.usuario.findMany({
    include: { establecimiento: true },
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
          <h1 className="text-2xl font-bold">Usuarios</h1>
        </div>
        <Link href="/admin/usuarios/nuevo" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Nuevo usuario
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {usuarios.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no hay usuarios.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Nombre</th>
                    <th className="p-3 font-medium">Correo</th>
                    <th className="p-3 font-medium">Rol</th>
                    <th className="p-3 font-medium">Establecimiento</th>
                    <th className="p-3 font-medium">Estado</th>
                    <th className="p-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 font-medium">{u.nombre}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3">{ETIQUETA_ROL[u.rol] ?? u.rol}</td>
                      <td className="p-3 text-muted-foreground">
                        {u.establecimiento?.nombre ?? "—"}
                      </td>
                      <td className="p-3">
                        {u.activo ? (
                          <Badge tono="success">Activo</Badge>
                        ) : (
                          <Badge tono="danger">Inactivo</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/usuarios/${u.id}/editar`}
                            className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                            title="Editar"
                            aria-label={`Editar ${u.nombre}`}
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <BotonEliminar
                            accion={eliminarUsuario}
                            id={u.id}
                            descripcion={`el usuario "${u.nombre}"`}
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
