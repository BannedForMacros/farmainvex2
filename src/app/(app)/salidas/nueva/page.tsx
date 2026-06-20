import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  lotesParaMovimiento,
  nombresEstablecimientos,
  nombresUsuarios,
} from "@/services/inventario.service";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrarSalidaForm } from "@/components/salidas/registrar-salida-form";

export const metadata: Metadata = { title: "Registrar salida" };

export default async function NuevaSalidaPage() {
  const [lotes, establecimientos, usuarios] = await Promise.all([
    lotesParaMovimiento(true), // solo lotes con stock
    nombresEstablecimientos(),
    nombresUsuarios(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/salidas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a salidas
        </Link>
        <h1 className="text-2xl font-bold">Registrar salida</h1>
        <p className="text-sm text-muted-foreground">
          Una salida puede incluir varios lotes. El sistema prioriza los próximos a vencer (FEFO)
          y valida el stock de cada uno.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <RegistrarSalidaForm
            lotes={lotes}
            establecimientos={establecimientos}
            usuarios={usuarios}
          />
        </CardContent>
      </Card>
    </div>
  );
}
