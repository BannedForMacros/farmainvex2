import type { Metadata } from "next";
import Link from "next/link";
import { Users, Building2, SlidersHorizontal, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { obtenerUmbrales } from "@/services/config.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UmbralesForm } from "./umbrales-form";

export const metadata: Metadata = { title: "Administración" };

export default async function AdminPage() {
  const [umbrales, totalUsuarios, totalEstablecimientos] = await Promise.all([
    obtenerUmbrales(),
    prisma.usuario.count(),
    prisma.establecimiento.count(),
  ]);

  const accesos = [
    {
      href: "/admin/usuarios",
      icono: Users,
      titulo: "Usuarios",
      detalle: `${totalUsuarios} registrado(s)`,
    },
    {
      href: "/admin/establecimientos",
      icono: Building2,
      titulo: "Establecimientos",
      detalle: `${totalEstablecimientos} registrado(s)`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Gestión de catálogos y configuración del sistema.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {accesos.map((a) => {
          const Icono = a.icono;
          return (
            <Link key={a.href} href={a.href}>
              <Card className="transition-colors hover:border-fx-blue">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary text-fx-blue">
                    <Icono className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{a.titulo}</p>
                    <p className="text-sm text-muted-foreground">{a.detalle}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-fx-teal" /> Umbrales de alerta de vencimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UmbralesForm
            preventiva={umbrales.diasPreventiva}
            critica={umbrales.diasCritico}
          />
        </CardContent>
      </Card>
    </div>
  );
}
