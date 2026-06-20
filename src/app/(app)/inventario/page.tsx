import type { Metadata } from "next";
import Link from "next/link";
import { Coins, ArrowRightLeft, History, Boxes } from "lucide-react";
import {
  obtenerInventario,
  lotesParaMovimiento,
  movimientosRecientes,
} from "@/services/inventario.service";
import { moneda, fechaCorta, fechaHora } from "@/lib/format";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/estado-badge";
import { RegistrarMovimientoGlobal } from "@/components/inventario/registrar-movimiento-global";

export const metadata: Metadata = { title: "Inventario" };

const ENTRADA = "ENTRADA";

export default async function InventarioPage() {
  const [{ valorTotal, filas }, lotes, movimientos] = await Promise.all([
    obtenerInventario(),
    lotesParaMovimiento(false),
    movimientosRecientes(12),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Stock valorizado por lote y registro de entradas y salidas.
        </p>
      </div>

      {/* Valor total */}
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl bg-fx-blue/10 text-fx-blue">
              <Coins className="size-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Valor total del inventario</p>
              <p className="mt-0.5 text-3xl font-bold text-fx-blue">{moneda(valorTotal)}</p>
            </div>
          </div>
          <p className="hidden text-right text-sm text-muted-foreground sm:block">
            {filas.length} lote(s) en stock
          </p>
        </CardContent>
      </Card>

      {/* Registrar movimiento (global) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4 text-fx-teal" /> Registrar movimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RegistrarMovimientoGlobal lotes={lotes} />
        </CardContent>
      </Card>

      {/* Lotes valorizados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="size-4 text-fx-blue" /> Lotes valorizados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sin lotes en stock.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3">
                        <Link href={`/lotes/${f.id}`} className="font-mono text-xs text-fx-blue hover:underline">
                          {f.codigo}
                        </Link>
                      </td>
                      <td className="p-3 font-medium">{f.medicamento}</td>
                      <td className="p-3">{f.stock}</td>
                      <td className="p-3 whitespace-nowrap">{moneda(f.costo)}</td>
                      <td className="p-3 whitespace-nowrap font-semibold text-fx-blue">{moneda(f.valor)}</td>
                      <td className="p-3 whitespace-nowrap">{fechaCorta(f.vence)}</td>
                      <td className="p-3">
                        <EstadoBadge estado={f.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movimientos recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-fx-blue" /> Movimientos recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movimientos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay movimientos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium">Tipo</th>
                    <th className="p-3 font-medium">Lote</th>
                    <th className="p-3 font-medium">Medicamento</th>
                    <th className="p-3 font-medium">Cantidad</th>
                    <th className="p-3 font-medium">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m) => {
                    const entra = m.tipo === ENTRADA;
                    return (
                      <tr key={m.id} className="border-b border-border/60">
                        <td className="p-3 whitespace-nowrap">{fechaHora(m.fecha)}</td>
                        <td className="p-3">{ETIQUETA_TIPO_MOVIMIENTO[m.tipo]}</td>
                        <td className="p-3 font-mono text-xs">{m.lote.codigo}</td>
                        <td className="p-3">{m.lote.medicamento.nombreComercial}</td>
                        <td className={`p-3 font-semibold ${entra ? "text-success" : "text-danger"}`}>
                          {entra ? "+" : "−"}
                          {m.cantidad}
                        </td>
                        <td className="p-3">{m.usuario?.nombre ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
