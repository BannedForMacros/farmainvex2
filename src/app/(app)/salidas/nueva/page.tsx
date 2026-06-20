import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  medicamentosConLotesDisponibles,
  nombresEstablecimientos,
  nombresUsuarios,
} from "@/services/inventario.service";
import { clientesParaSelector } from "@/services/cliente.service";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrarSalidaForm } from "@/components/salidas/registrar-salida-form";

export const metadata: Metadata = { title: "Registrar salida" };

export default async function NuevaSalidaPage() {
  const [medicamentos, establecimientos, usuarios, clientes] = await Promise.all([
    medicamentosConLotesDisponibles(),
    nombresEstablecimientos(),
    nombresUsuarios(),
    clientesParaSelector(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/salidas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a salidas
        </Link>
        <h1 className="text-2xl font-bold">Registrar salida</h1>
        <p className="text-sm text-muted-foreground">
          Elige el medicamento y su lote (FEFO). Una salida puede incluir varios ítems, cada uno
          con su propio documento. Usa 👁 para ver los lotes disponibles.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <RegistrarSalidaForm
            medicamentos={medicamentos}
            establecimientos={establecimientos}
            usuarios={usuarios}
            clientes={clientes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
