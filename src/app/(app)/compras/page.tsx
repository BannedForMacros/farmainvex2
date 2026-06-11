import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Layers, Truck, Plus } from "lucide-react";
import { entradasRecientes, resumenCompras } from "@/services/inventario.service";
import { fechaHora } from "@/lib/format";
import { ETIQUETA_TIPO_DOCUMENTO } from "@/lib/enums";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { CompraDetalleModal } from "@/components/compras/compra-detalle-modal";

export const metadata: Metadata = { title: "Compras" };

export default async function ComprasPage() {
  const [entradas, resumen] = await Promise.all([entradasRecientes(40), resumenCompras()]);

  const kpis = [
    { etiqueta: "Entradas registradas", valor: resumen.totalEntradas, icono: ShoppingCart, tono: "text-fx-blue" },
    { etiqueta: "Unidades ingresadas", valor: resumen.unidadesIngresadas, icono: Layers, tono: "text-fx-teal" },
    { etiqueta: "Proveedores activos", valor: resumen.proveedoresActivos, icono: Truck, tono: "text-fx-cyan" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compras / Entradas</h1>
          <p className="text-sm text-muted-foreground">
            Ingreso de stock con su proveedor. Registra una compra con varios productos a la vez.
          </p>
        </div>
        <Link href="/compras/nueva" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Registrar compra
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icono = k.icono;
          return (
            <Card key={k.etiqueta}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{k.etiqueta}</p>
                  <p className="mt-1 text-2xl font-bold">{k.valor}</p>
                </div>
                <Icono className={`size-8 ${k.tono}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {entradas.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no se han registrado entradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium">Proveedor</th>
                    <th className="p-3 font-medium">Medicamento</th>
                    <th className="p-3 font-medium">Lote</th>
                    <th className="p-3 font-medium">Cantidad</th>
                    <th className="p-3 font-medium">Documento</th>
                    <th className="p-3 text-right font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {entradas.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 whitespace-nowrap">{fechaHora(m.fecha)}</td>
                      <td className="p-3">
                        {m.proveedor ? (
                          <>
                            <span className="font-medium">{m.proveedor.nombre}</span>
                            <span className="block text-xs text-muted-foreground">
                              {ETIQUETA_TIPO_DOCUMENTO[m.proveedor.tipoDocumento]}{" "}
                              {m.proveedor.numeroDocumento}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">{m.lote.medicamento.nombreComercial}</td>
                      <td className="p-3 font-mono text-xs">{m.lote.codigo}</td>
                      <td className="p-3 font-semibold text-success">+{m.cantidad}</td>
                      <td className="p-3 text-muted-foreground">{m.documentoRef ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex justify-end">
                          <CompraDetalleModal
                            c={{
                              loteId: m.loteId,
                              codigo: m.lote.codigo,
                              numeroLote: m.lote.numeroLote,
                              medicamento: m.lote.medicamento.nombreComercial,
                              cantidad: m.cantidad,
                              costoUnitario: Number(m.lote.costoUnitario),
                              fechaFabricacion: m.lote.fechaFabricacion,
                              fechaVencimiento: m.lote.fechaVencimiento,
                              proveedorNombre: m.proveedor?.nombre ?? null,
                              proveedorDoc: m.proveedor
                                ? `${m.proveedor.tipoDocumento} ${m.proveedor.numeroDocumento}`
                                : null,
                              documento: m.documentoRef,
                              fecha: m.fecha,
                              registradoPor: m.usuario?.nombre ?? "—",
                            }}
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
