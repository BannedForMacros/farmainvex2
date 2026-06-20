import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Boxes, Layers, CalendarClock, Plus } from "lucide-react";
import { obtenerInventario } from "@/services/inventario.service";
import { moneda, fechaCorta } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { EstadoBadge } from "@/components/estado-badge";
import { LoteDetalleModal } from "@/components/inventario/lote-detalle-modal";

export const metadata: Metadata = { title: "Inventario" };

export default async function InventarioPage() {
  const { valorTotal, filas } = await obtenerInventario();

  const unidades = filas.reduce((s, f) => s + f.stock, 0);
  const proximos = filas.filter((f) => f.estado !== "VIGENTE").length;

  const kpis = [
    { etiqueta: "Valor total", valor: moneda(valorTotal), icono: Coins, tono: "text-fx-blue" },
    { etiqueta: "Lotes en stock", valor: filas.length, icono: Boxes, tono: "text-fx-teal" },
    { etiqueta: "Unidades totales", valor: unidades, icono: Layers, tono: "text-fx-cyan" },
    { etiqueta: "Próximos a vencer", valor: proximos, icono: CalendarClock, tono: "text-[color:var(--warning)]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Stock valorizado por lote. Registra entradas y salidas desde el botón.
          </p>
        </div>
        <Link href="/inventario/movimiento" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Registrar movimiento
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Tabla de lotes valorizados */}
      <Card>
        <CardContent className="p-0">
          {filas.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No hay lotes en stock.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Lote</th>
                    <th className="p-3 font-medium">Medicamento</th>
                    <th className="p-3 font-medium">Stock</th>
                    <th className="p-3 font-medium">Costo unit.</th>
                    <th className="p-3 font-medium">Valor</th>
                    <th className="p-3 font-medium">Vence</th>
                    <th className="p-3 font-medium">Estado</th>
                    <th className="p-3 text-right font-medium">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 font-mono text-xs">{f.codigo}</td>
                      <td className="p-3 font-medium">{f.medicamento}</td>
                      <td className="p-3">{f.stock}</td>
                      <td className="p-3 whitespace-nowrap">{moneda(f.costo)}</td>
                      <td className="p-3 whitespace-nowrap font-semibold text-fx-blue">
                        {moneda(f.valor)}
                      </td>
                      <td className="p-3 whitespace-nowrap">{fechaCorta(f.vence)}</td>
                      <td className="p-3">
                        <EstadoBadge estado={f.estado} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end">
                          <LoteDetalleModal fila={f} />
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
