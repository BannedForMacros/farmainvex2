import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsuarioForm } from "../usuario-form";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default async function NuevoUsuarioPage() {
  const establecimientos = await prisma.establecimiento.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>
        <h1 className="text-2xl font-bold">Nuevo usuario</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <UsuarioForm establecimientos={establecimientos} />
        </CardContent>
      </Card>
    </div>
  );
}
