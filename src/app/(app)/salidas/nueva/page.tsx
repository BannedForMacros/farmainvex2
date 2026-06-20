import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { lotesParaMovimiento } from "@/services/inventario.service";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrarMovimientoGlobal } from "@/components/inventario/registrar-movimiento-global";

export const metadata: Metadata = { title: "Registrar salida" };

export default async function NuevaSalidaPage() {
  const lotes = await lotesParaMovimiento(true); // solo lotes con stock

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/salidas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a salidas
        </Link>
        <h1 className="text-2xl font-bold">Registrar salida</h1>
        <p className="text-sm text-muted-foreground">
          Dispensación de medicamentos. El sistema prioriza los lotes próximos a vencer (FEFO).
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <RegistrarMovimientoGlobal lotes={lotes} soloSalidas />
        </CardContent>
      </Card>
    </div>
  );
}
