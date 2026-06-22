import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  lotesParaMovimiento,
  nombresEstablecimientos,
  nombresUsuarios,
} from "@/services/inventario.service";
import { proveedoresParaSelector } from "@/services/proveedor.service";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrarMovimientoGlobal } from "@/components/inventario/registrar-movimiento-global";

export const metadata: Metadata = { title: "Registrar movimiento" };

export default async function NuevoMovimientoPage() {
  const [lotes, establecimientos, usuarios, proveedores] = await Promise.all([
    lotesParaMovimiento(false),
    nombresEstablecimientos(),
    nombresUsuarios(),
    proveedoresParaSelector(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/inventario"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a inventario
        </Link>
        <h1 className="text-2xl font-bold">Registrar movimiento</h1>
        <p className="text-sm text-muted-foreground">
          Entrada o salida de stock. El lote más próximo a vencer viene preseleccionado (FEFO).
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <RegistrarMovimientoGlobal
            lotes={lotes}
            establecimientos={establecimientos}
            usuarios={usuarios}
            proveedores={proveedores}
          />
        </CardContent>
      </Card>
    </div>
  );
}
