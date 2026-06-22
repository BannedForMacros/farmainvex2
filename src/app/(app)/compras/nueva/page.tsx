import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { proveedoresParaSelector } from "@/services/proveedor.service";
import { Card, CardContent } from "@/components/ui/card";
import { RegistrarCompraForm } from "@/components/compras/registrar-compra-form";

export const metadata: Metadata = { title: "Registrar compra" };

export default async function NuevaCompraPage() {
  const [medicamentos, establecimientos, proveedores] = await Promise.all([
    prisma.medicamento.findMany({
      select: { id: true, nombreComercial: true, codigo: true },
      orderBy: { nombreComercial: "asc" },
    }),
    prisma.establecimiento.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    proveedoresParaSelector(),
  ]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/compras"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a compras
        </Link>
        <h1 className="text-2xl font-bold">Registrar compra / entrada</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa varios productos de una vez. Cada lote lleva su propio proveedor, documento,
          fechas y costo — flexibilidad total.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <RegistrarCompraForm
            medicamentos={medicamentos}
            establecimientos={establecimientos}
            proveedores={proveedores}
          />
        </CardContent>
      </Card>
    </div>
  );
}
