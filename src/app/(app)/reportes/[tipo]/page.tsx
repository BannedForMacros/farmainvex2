import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, FileSpreadsheet, Filter, X, CalendarRange } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { GraficoReporteVista } from "@/components/reportes/grafico-reporte";
import {
  REPORTES,
  obtenerDatosReporte,
  obtenerGraficoReporte,
  esTipoReporteValido,
  parseFecha,
} from "@/services/reportes.service";

interface Props {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ desde?: string; hasta?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tipo } = await params;
  const meta = REPORTES.find((r) => r.tipo === tipo);
  return { title: meta ? `Reporte · ${meta.titulo}` : "Reporte" };
}

export default async function ReporteDetallePage({ params, searchParams }: Props) {
  const { tipo } = await params;
  if (!esTipoReporteValido(tipo)) notFound();

  const { desde, hasta } = await searchParams;
  const info = REPORTES.find((r) => r.tipo === tipo)!;
  const filtro = { desde: parseFecha(desde), hasta: parseFecha(hasta) };

  const [datos, grafico] = await Promise.all([
    obtenerDatosReporte(tipo, filtro),
    obtenerGraficoReporte(tipo, filtro),
  ]);

  // Query string para las descargas (conserva el filtro de fechas).
  const qs = new URLSearchParams({ tipo });
  if (desde) qs.set("desde", desde);
  if (hasta) qs.set("hasta", hasta);
  const hayFiltro = Boolean(desde || hasta);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/reportes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver a reportes
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{info.titulo}</h1>
          <p className="text-sm text-muted-foreground">{info.descripcion}</p>
        </div>
      </div>

      {/* Filtro de fechas + descargas */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <form method="GET" className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" name="desde" type="date" defaultValue={desde} className="w-44" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" name="hasta" type="date" defaultValue={hasta} className="w-44" />
            </div>
            <button type="submit" className={buttonVariants({ variant: "primary", size: "md" })}>
              <Filter className="size-4" /> Filtrar
            </button>
            {hayFiltro && (
              <Link
                href={`/reportes/${tipo}`}
                className={buttonVariants({ variant: "ghost", size: "md" })}
              >
                <X className="size-4" /> Limpiar
              </Link>
            )}
          </form>

          <div className="flex gap-2">
            <a
              href={`/api/reportes?${qs.toString()}&formato=pdf`}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              <FileText className="size-4" /> Descargar PDF
            </a>
            <a
              href={`/api/reportes?${qs.toString()}&formato=excel`}
              className={buttonVariants({ variant: "teal", size: "md" })}
            >
              <FileSpreadsheet className="size-4" /> Descargar Excel
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico */}
      <Card>
        <CardContent className="p-5">
          <GraficoReporteVista grafico={grafico} />
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
            <p className="text-sm font-semibold">Detalle</p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-fx-blue">
                <CalendarRange className="size-3.5" /> {datos.periodo}
              </span>
              <span className="text-sm text-muted-foreground">{datos.filas.length} registro(s)</span>
            </div>
          </div>
          {datos.filas.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No hay registros para los criterios seleccionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50 text-left">
                    {datos.columnas.map((c) => (
                      <th key={c.key} className="px-4 py-2.5 font-semibold whitespace-nowrap">
                        {c.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.filas.map((fila, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-secondary/30">
                      {datos.columnas.map((c) => (
                        <td key={c.key} className="px-4 py-2.5 whitespace-nowrap">
                          {String(fila[c.key] ?? "—")}
                        </td>
                      ))}
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
