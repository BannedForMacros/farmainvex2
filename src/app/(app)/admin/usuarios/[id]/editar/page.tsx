import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsuarioForm } from "../../usuario-form";

export const metadata: Metadata = { title: "Editar usuario" };

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [usuario, establecimientos] = await Promise.all([
    prisma.usuario.findUnique({ where: { id } }),
    prisma.establecimiento.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);
  if (!usuario) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Editar usuario</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{usuario.nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <UsuarioForm
            establecimientos={establecimientos}
            usuario={{
              id: usuario.id,
              nombre: usuario.nombre,
              email: usuario.email,
              rol: usuario.rol,
              establecimientoId: usuario.establecimientoId,
              activo: usuario.activo,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
