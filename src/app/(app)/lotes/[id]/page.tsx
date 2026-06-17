import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  CalendarClock,
  Pill,
  Building2,
  History,
  BellRing,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { fechaLarga, fechaHora, textoDiasRestantes } from "@/lib/format";
import {
  ETIQUETA_ESTADO_LOTE,
  ETIQUETA_TIPO_MOVIMIENTO,
  ETIQUETA_TIPO_ESTABLECIMIENTO,
  ETIQUETA_SEVERIDAD,
  TONO_SEVERIDAD,
} from "@/lib/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dato } from "@/components/dato";
import { EstadoBadge } from "@/components/estado-badge";

export const metadata: Metadata = { title: "Detalle de lote" };

export default async function LoteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lote = await prisma.lote.findUnique({
    where: { id },
    include: {
      medicamento: true,
      establecimiento: true,
      movimientos: { include: { usuario: true }, orderBy: { fecha: "desc" } },
      alertas: { orderBy: { creadoEn: "desc" } },
    },
  });

  if (!lote) notFound();

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/lotes"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Volver a lotes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-bold">{lote.codigo}</h1>
            <EstadoBadge estado={lote.estadoVencimiento} />
          </div>
          <p className="text-sm text-muted-foreground">{lote.medicamento.nombreComercial}</p>
        </div>
        <span className="rounded-lg bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
          {textoDiasRestantes(lote.diasRestantes)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información general */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-4 text-fx-blue" /> Información general
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Dato etiqueta="Código FarmaInvex">{lote.codigo}</Dato>
              <Dato etiqueta="N.º de lote (fabricante)">{lote.numeroLote}</Dato>
              <Dato etiqueta="Cantidad">{lote.cantidad} unidad(es)</Dato>
              <Dato etiqueta="Estado del lote">
                {ETIQUETA_ESTADO_LOTE[lote.estado]}
              </Dato>
              <Dato etiqueta="Estado sanitario">
                <EstadoBadge estado={lote.estadoVencimiento} />
              </Dato>
              <Dato etiqueta="Bajo observación">
                {lote.observado ? (
                  <Badge tono="warning">Sí</Badge>
                ) : (
                  <Badge tono="success">No</Badge>
                )}
              </Dato>
            </dl>
          </CardContent>
        </Card>

        {/* Fechas y vencimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-fx-teal" /> Fechas y vencimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Dato etiqueta="Fecha de fabricación">
                {fechaLarga(lote.fechaFabricacion)}
              </Dato>
              <Dato etiqueta="Fecha límite de caducación">
                <span className="font-semibold">{fechaLarga(lote.fechaVencimiento)}</span>
              </Dato>
              <Dato etiqueta="Días restantes">
                {textoDiasRestantes(lote.diasRestantes)}
              </Dato>
              <Dato etiqueta="Fecha de ingreso (registro)">
                {fechaHora(lote.creadoEn)}
              </Dato>
              <Dato etiqueta="Última actualización">
                {fechaHora(lote.actualizadoEn)}
              </Dato>
            </dl>
          </CardContent>
        </Card>

        {/* Medicamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="size-4 text-fx-blue" /> Medicamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <Dato etiqueta="Nombre comercial">{lote.medicamento.nombreComercial}</Dato>
              <Dato etiqueta="Código">{lote.medicamento.codigo}</Dato>
              <Dato etiqueta="Laboratorio">{lote.medicamento.laboratorio}</Dato>
              <Dato etiqueta="Principio activo">
                {lote.medicamento.principioActivo ?? "—"}
              </Dato>
              <Dato etiqueta="Presentación">{lote.medicamento.presentacion ?? "—"}</Dato>
            </dl>
          </CardContent>
        </Card>

        {/* Establecimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-fx-teal" /> Establecimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lote.establecimiento ? (
              <dl className="grid grid-cols-2 gap-4">
                <Dato etiqueta="Nombre">{lote.establecimiento.nombre}</Dato>
                <Dato etiqueta="Tipo">
                  {ETIQUETA_TIPO_ESTABLECIMIENTO[lote.establecimiento.tipo]}
                </Dato>
                <Dato etiqueta="Dirección">{lote.establecimiento.direccion ?? "—"}</Dato>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Sin establecimiento asignado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trazabilidad: movimientos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-fx-blue" /> Historial de movimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lote.movimientos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no hay movimientos registrados para este lote.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-2 font-medium">Fecha</th>
                    <th className="p-2 font-medium">Tipo</th>
                    <th className="p-2 font-medium">Cantidad</th>
                    <th className="p-2 font-medium">Motivo</th>
                    <th className="p-2 font-medium">Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {lote.movimientos.map((m) => (
                    <tr key={m.id} className="border-b border-border/60">
                      <td className="p-2">{fechaHora(m.fecha)}</td>
                      <td className="p-2">{ETIQUETA_TIPO_MOVIMIENTO[m.tipo]}</td>
                      <td className="p-2">{m.cantidad}</td>
                      <td className="p-2 text-muted-foreground">{m.motivo ?? "—"}</td>
                      <td className="p-2">{m.usuario?.nombre ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas del lote */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="size-4 text-[color:var(--warning)]" /> Alertas del lote
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lote.alertas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin alertas registradas para este lote.
            </p>
          ) : (
            <div className="space-y-2">
              {lote.alertas.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{a.mensaje}</p>
                    <p className="text-xs text-muted-foreground">{fechaHora(a.creadoEn)}</p>
                  </div>
                  <Badge tono={TONO_SEVERIDAD[a.severidad]}>
                    {ETIQUETA_SEVERIDAD[a.severidad]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
