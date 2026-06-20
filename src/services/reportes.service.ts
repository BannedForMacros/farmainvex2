import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { fechaCorta, fechaHora, moneda } from "@/lib/format";
import { SEMAFORO } from "@/domain/vencimiento";
import {
  ETIQUETA_ESTADO_LOTE,
  ETIQUETA_SEVERIDAD,
  ETIQUETA_ESTADO_INCIDENCIA,
  ETIQUETA_TIPO_MOVIMIENTO,
  ETIQUETA_TIPO_ALERTA,
  ETIQUETA_TIPO_DOCUMENTO,
} from "@/lib/enums";

/** Rango de fechas para filtrar un reporte (ambos extremos opcionales). */
export interface FiltroReporte {
  desde?: Date;
  hasta?: Date;
}

/** Una barra/porción del gráfico de un reporte. */
export interface SerieGrafico {
  nombre: string;
  valor: number;
}

/** Datos para el gráfico interactivo (recharts) de un reporte. */
export interface GraficoReporte {
  tipo: "bar" | "pie";
  titulo: string;
  series: SerieGrafico[];
}

/** Convierte "YYYY-MM-DD" (del input date) en Date local, o undefined. */
export function parseFecha(valor: string | null | undefined): Date | undefined {
  if (!valor) return undefined;
  const d = new Date(`${valor}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Construye el filtro de fecha de Prisma a partir del rango. `hasta` se
 * extiende al final del día para que sea inclusivo. Devuelve undefined si no
 * hay rango (Prisma ignora la condición).
 */
function rangoFecha(filtro: FiltroReporte): { gte?: Date; lte?: Date } | undefined {
  if (!filtro.desde && !filtro.hasta) return undefined;
  const rango: { gte?: Date; lte?: Date } = {};
  if (filtro.desde) rango.gte = filtro.desde;
  if (filtro.hasta) {
    const fin = new Date(filtro.hasta);
    fin.setHours(23, 59, 59, 999);
    rango.lte = fin;
  }
  return rango;
}

export type TipoReporte =
  | "medicamentos"
  | "lotes"
  | "proximos"
  | "alertas"
  | "historial"
  | "inventario"
  | "ventas"
  | "clientes"
  | "incidencias";

export const REPORTES: { tipo: TipoReporte; titulo: string; descripcion: string }[] = [
  { tipo: "medicamentos", titulo: "Medicamentos registrados", descripcion: "Catálogo completo de productos farmacéuticos." },
  { tipo: "lotes", titulo: "Control de lotes", descripcion: "Todos los lotes con su estado y vencimiento." },
  { tipo: "proximos", titulo: "Próximos a vencer", descripcion: "Lotes en alerta preventiva o crítica." },
  { tipo: "alertas", titulo: "Alertas sanitarias", descripcion: "Alertas generadas por el sistema." },
  { tipo: "historial", titulo: "Historial farmacéutico", descripcion: "Movimientos de entrada, salida y trazabilidad de lotes." },
  { tipo: "inventario", titulo: "Inventario valorizado", descripcion: "Valor del stock por lote (cantidad × costo unitario)." },
  { tipo: "ventas", titulo: "Ventas", descripcion: "Movimientos de venta con su cliente y documento." },
  { tipo: "clientes", titulo: "Clientes", descripcion: "Clientes registrados y su verificación." },
  { tipo: "incidencias", titulo: "Incidencias", descripcion: "Incidencias sanitarias y su estado." },
];

export interface DatosReporte {
  tipo: TipoReporte;
  titulo: string;
  /** Rango de fechas aplicado, en texto legible para el usuario final. */
  periodo: string;
  columnas: { header: string; key: string; width?: number }[];
  filas: Record<string, string | number>[];
}

/**
 * Describe el rango de fechas de forma legible para el usuario final.
 * Nunca devuelve "null": si no hay filtro, indica que abarca todo.
 */
export function describirPeriodo(filtro: FiltroReporte): string {
  const { desde, hasta } = filtro;
  if (desde && hasta) return `Del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`;
  if (desde) return `Desde el ${fechaCorta(desde)}`;
  if (hasta) return `Hasta el ${fechaCorta(hasta)}`;
  return "Todos los registros";
}

export function esTipoReporteValido(tipo: string | null): tipo is TipoReporte {
  return REPORTES.some((r) => r.tipo === tipo);
}

export async function obtenerDatosReporte(
  tipo: TipoReporte,
  filtro: FiltroReporte = {},
): Promise<DatosReporte> {
  const base = await construirDatos(tipo, rangoFecha(filtro));
  return { ...base, periodo: describirPeriodo(filtro) };
}

async function construirDatos(
  tipo: TipoReporte,
  fecha: ReturnType<typeof rangoFecha>,
): Promise<Omit<DatosReporte, "periodo">> {
  switch (tipo) {
    case "medicamentos": {
      const datos = await prisma.medicamento.findMany({
        where: { creadoEn: fecha },
        include: { _count: { select: { lotes: true } } },
        orderBy: { nombreComercial: "asc" },
      });
      return {
        tipo,
        titulo: "Medicamentos registrados",
        columnas: [
          { header: "Código", key: "codigo", width: 16 },
          { header: "Nombre comercial", key: "nombre", width: 28 },
          { header: "Laboratorio", key: "laboratorio", width: 22 },
          { header: "Principio activo", key: "principio", width: 22 },
          { header: "Presentación", key: "presentacion", width: 22 },
          { header: "Lotes", key: "lotes", width: 10 },
        ],
        filas: datos.map((m) => ({
          codigo: m.codigo,
          nombre: m.nombreComercial,
          laboratorio: m.laboratorio,
          principio: m.principioActivo ?? "—",
          presentacion: m.presentacion ?? "—",
          lotes: m._count.lotes,
        })),
      };
    }

    case "lotes":
    case "proximos": {
      const datos = await prisma.lote.findMany({
        where:
          tipo === "proximos"
            ? {
                estadoVencimiento: { in: ["PREVENTIVA", "CRITICO"] },
                estado: { not: "RETIRADO" },
                fechaVencimiento: fecha,
              }
            : { creadoEn: fecha },
        include: { medicamento: true },
        orderBy: { diasRestantes: "asc" },
      });
      return {
        tipo,
        titulo: tipo === "proximos" ? "Lotes próximos a vencer" : "Control de lotes",
        columnas: [
          { header: "Lote", key: "codigo", width: 16 },
          { header: "N° fabricante", key: "numero", width: 16 },
          { header: "Medicamento", key: "medicamento", width: 28 },
          { header: "Cantidad", key: "cantidad", width: 12 },
          { header: "Fabricación", key: "fabricacion", width: 16 },
          { header: "Vencimiento", key: "vencimiento", width: 16 },
          { header: "Días", key: "dias", width: 10 },
          { header: "Estado", key: "estado", width: 20 },
        ],
        filas: datos.map((l) => ({
          codigo: l.codigo,
          numero: l.numeroLote,
          medicamento: l.medicamento.nombreComercial,
          cantidad: l.cantidad,
          fabricacion: fechaCorta(l.fechaFabricacion),
          vencimiento: fechaCorta(l.fechaVencimiento),
          dias: l.diasRestantes ?? "—",
          estado: SEMAFORO[l.estadoVencimiento].etiqueta,
        })),
      };
    }

    case "alertas": {
      const datos = await prisma.alerta.findMany({
        where: { creadoEn: fecha },
        include: { lote: true },
        orderBy: { creadoEn: "desc" },
      });
      return {
        tipo,
        titulo: "Alertas sanitarias",
        columnas: [
          { header: "Tipo", key: "tipo", width: 22 },
          { header: "Severidad", key: "severidad", width: 16 },
          { header: "Mensaje", key: "mensaje", width: 50 },
          { header: "Lote", key: "lote", width: 16 },
          { header: "Fecha", key: "fecha", width: 20 },
          { header: "Estado", key: "estado", width: 16 },
        ],
        filas: datos.map((a) => ({
          tipo: ETIQUETA_TIPO_ALERTA[a.tipo],
          severidad: ETIQUETA_SEVERIDAD[a.severidad],
          mensaje: a.mensaje,
          lote: a.lote?.codigo ?? "—",
          fecha: fechaHora(a.creadoEn),
          estado: a.resuelta ? "Resuelta" : a.leida ? "Leída" : "Pendiente",
        })),
      };
    }

    case "historial": {
      const datos = await prisma.movimientoFarmaceutico.findMany({
        where: { fecha },
        include: { lote: { include: { medicamento: true } }, usuario: true },
        orderBy: { fecha: "desc" },
      });
      return {
        tipo,
        titulo: "Historial farmacéutico",
        columnas: [
          { header: "Fecha", key: "fecha", width: 18 },
          { header: "Lote", key: "lote", width: 14 },
          { header: "Medicamento", key: "medicamento", width: 24 },
          { header: "Movimiento", key: "movimiento", width: 14 },
          { header: "Cantidad", key: "cantidad", width: 10 },
          { header: "Motivo", key: "motivo", width: 22 },
          { header: "Destino", key: "destino", width: 20 },
          { header: "Documento", key: "documento", width: 18 },
          { header: "Recibido por", key: "recibidoPor", width: 20 },
          { header: "Responsable", key: "responsable", width: 20 },
        ],
        filas: datos.map((m) => ({
          fecha: fechaHora(m.fecha),
          lote: m.lote.codigo,
          medicamento: m.lote.medicamento.nombreComercial,
          movimiento: ETIQUETA_TIPO_MOVIMIENTO[m.tipo],
          cantidad: m.cantidad,
          motivo: m.motivo ?? "—",
          destino: m.destino ?? "—",
          documento: m.documentoRef ?? "—",
          recibidoPor: m.recibidoPor ?? "—",
          responsable: m.usuario?.nombre ?? "—",
        })),
      };
    }

    case "inventario": {
      const lotes = await prisma.lote.findMany({
        where: { estado: { not: "RETIRADO" }, creadoEn: fecha },
        include: { medicamento: true },
        orderBy: { medicamento: { nombreComercial: "asc" } },
      });
      const filas: Record<string, string | number>[] = lotes.map((l) => ({
        codigo: l.codigo,
        medicamento: l.medicamento.nombreComercial,
        cantidad: l.cantidad,
        costo: moneda(Number(l.costoUnitario)),
        valor: moneda(l.cantidad * Number(l.costoUnitario)),
        vencimiento: fechaCorta(l.fechaVencimiento),
        estado: SEMAFORO[l.estadoVencimiento].etiqueta,
      }));
      const total = lotes.reduce((s, l) => s + l.cantidad * Number(l.costoUnitario), 0);
      if (lotes.length > 0) {
        filas.push({ codigo: "", medicamento: "", cantidad: "", costo: "TOTAL", valor: moneda(total), vencimiento: "", estado: "" });
      }
      return {
        tipo,
        titulo: "Inventario valorizado",
        columnas: [
          { header: "Lote", key: "codigo", width: 16 },
          { header: "Medicamento", key: "medicamento", width: 28 },
          { header: "Cantidad", key: "cantidad", width: 12 },
          { header: "Costo unit.", key: "costo", width: 16 },
          { header: "Valor", key: "valor", width: 18 },
          { header: "Vencimiento", key: "vencimiento", width: 16 },
          { header: "Estado", key: "estado", width: 20 },
        ],
        filas,
      };
    }

    case "ventas": {
      const datos = await prisma.movimientoFarmaceutico.findMany({
        where: { tipo: "VENTA", fecha },
        include: { lote: { include: { medicamento: true } }, cliente: true },
        orderBy: { fecha: "desc" },
      });
      return {
        tipo,
        titulo: "Ventas",
        columnas: [
          { header: "Fecha", key: "fecha", width: 18 },
          { header: "Cliente", key: "cliente", width: 28 },
          { header: "Documento cliente", key: "doc", width: 18 },
          { header: "Medicamento", key: "medicamento", width: 26 },
          { header: "Lote", key: "lote", width: 14 },
          { header: "Cantidad", key: "cantidad", width: 10 },
          { header: "Comprobante", key: "comprobante", width: 18 },
        ],
        filas: datos.map((m) => ({
          fecha: fechaHora(m.fecha),
          cliente: m.cliente?.nombre ?? "—",
          doc: m.cliente ? `${m.cliente.tipoDocumento} ${m.cliente.numeroDocumento}` : "—",
          medicamento: m.lote.medicamento.nombreComercial,
          lote: m.lote.codigo,
          cantidad: m.cantidad,
          comprobante: m.documentoRef ?? "—",
        })),
      };
    }

    case "clientes": {
      const datos = await prisma.cliente.findMany({ orderBy: { nombre: "asc" } });
      return {
        tipo,
        titulo: "Clientes",
        columnas: [
          { header: "Tipo", key: "tipoDoc", width: 10 },
          { header: "Documento", key: "documento", width: 16 },
          { header: "Nombre / Razón social", key: "nombre", width: 32 },
          { header: "Dirección", key: "direccion", width: 32 },
          { header: "Origen", key: "origen", width: 12 },
          { header: "Estado", key: "estadoCli", width: 12 },
        ],
        filas: datos.map((c) => ({
          tipoDoc: ETIQUETA_TIPO_DOCUMENTO[c.tipoDocumento],
          documento: c.numeroDocumento,
          nombre: c.nombre,
          direccion: c.direccion ?? "—",
          origen: c.origenDatos === "API" ? "Verificado" : "Manual",
          estadoCli: c.activo ? "Activo" : "Inactivo",
        })),
      };
    }

    case "incidencias": {
      const datos = await prisma.incidencia.findMany({
        where: { creadoEn: fecha },
        include: { lote: true },
        orderBy: { creadoEn: "desc" },
      });
      return {
        tipo,
        titulo: "Incidencias sanitarias",
        columnas: [
          { header: "Código", key: "codigo", width: 16 },
          { header: "Título", key: "titulo", width: 40 },
          { header: "Severidad", key: "severidad", width: 16 },
          { header: "Estado", key: "estado", width: 18 },
          { header: "Lote", key: "lote", width: 16 },
          { header: "Fecha", key: "fecha", width: 20 },
        ],
        filas: datos.map((i) => ({
          codigo: i.codigo,
          titulo: i.titulo,
          severidad: ETIQUETA_SEVERIDAD[i.severidad],
          estado: ETIQUETA_ESTADO_INCIDENCIA[i.estado],
          lote: i.lote?.codigo ?? "—",
          fecha: fechaHora(i.creadoEn),
        })),
      };
    }
  }
}

/**
 * Calcula los datos agregados para el gráfico interactivo de cada reporte.
 * Usa `groupBy` (no carga todas las filas) y respeta el mismo filtro de fechas.
 */
export async function obtenerGraficoReporte(
  tipo: TipoReporte,
  filtro: FiltroReporte = {},
): Promise<GraficoReporte> {
  const fecha = rangoFecha(filtro);
  const ordenar = (s: SerieGrafico[]) => s.sort((a, b) => b.valor - a.valor);

  switch (tipo) {
    case "medicamentos": {
      const g = await prisma.medicamento.groupBy({
        by: ["laboratorio"],
        where: { creadoEn: fecha },
        _count: { _all: true },
      });
      return {
        tipo: "bar",
        titulo: "Medicamentos por laboratorio",
        series: ordenar(g.map((x) => ({ nombre: x.laboratorio, valor: x._count._all }))).slice(0, 8),
      };
    }

    case "lotes":
    case "proximos": {
      const g = await prisma.lote.groupBy({
        by: ["estadoVencimiento"],
        where:
          tipo === "proximos"
            ? {
                estadoVencimiento: { in: ["PREVENTIVA", "CRITICO"] },
                estado: { not: "RETIRADO" },
                fechaVencimiento: fecha,
              }
            : { creadoEn: fecha },
        _count: { _all: true },
      });
      return {
        tipo: "pie",
        titulo: "Lotes por estado de vencimiento",
        series: g.map((x) => ({ nombre: SEMAFORO[x.estadoVencimiento].etiqueta, valor: x._count._all })),
      };
    }

    case "alertas": {
      const g = await prisma.alerta.groupBy({
        by: ["tipo"],
        where: { creadoEn: fecha },
        _count: { _all: true },
      });
      return {
        tipo: "bar",
        titulo: "Alertas por tipo",
        series: ordenar(g.map((x) => ({ nombre: ETIQUETA_TIPO_ALERTA[x.tipo], valor: x._count._all }))),
      };
    }

    case "historial": {
      const g = await prisma.movimientoFarmaceutico.groupBy({
        by: ["tipo"],
        where: { fecha },
        _count: { _all: true },
      });
      return {
        tipo: "bar",
        titulo: "Movimientos por tipo",
        series: ordenar(g.map((x) => ({ nombre: ETIQUETA_TIPO_MOVIMIENTO[x.tipo], valor: x._count._all }))),
      };
    }

    case "inventario": {
      const lotes = await prisma.lote.findMany({
        where: { estado: { not: "RETIRADO" }, creadoEn: fecha },
        include: { medicamento: true },
      });
      const porMedicamento = new Map<string, number>();
      for (const l of lotes) {
        const nombre = l.medicamento.nombreComercial;
        const valor = l.cantidad * Number(l.costoUnitario);
        porMedicamento.set(nombre, (porMedicamento.get(nombre) ?? 0) + valor);
      }
      const series = ordenar(
        [...porMedicamento.entries()].map(([nombre, valor]) => ({
          nombre,
          valor: Math.round(valor * 100) / 100,
        })),
      ).slice(0, 8);
      return { tipo: "bar", titulo: "Valor de inventario por medicamento (S/)", series };
    }

    case "ventas": {
      const ventas = await prisma.movimientoFarmaceutico.findMany({
        where: { tipo: "VENTA", fecha },
        include: { lote: { include: { medicamento: true } } },
      });
      const porMed = new Map<string, number>();
      for (const v of ventas) {
        const nombre = v.lote.medicamento.nombreComercial;
        porMed.set(nombre, (porMed.get(nombre) ?? 0) + v.cantidad);
      }
      return {
        tipo: "bar",
        titulo: "Unidades vendidas por medicamento",
        series: ordenar([...porMed.entries()].map(([nombre, valor]) => ({ nombre, valor }))).slice(0, 8),
      };
    }

    case "clientes": {
      const g = await prisma.cliente.groupBy({ by: ["tipoDocumento"], _count: { _all: true } });
      return {
        tipo: "pie",
        titulo: "Clientes por tipo de documento",
        series: g.map((x) => ({ nombre: ETIQUETA_TIPO_DOCUMENTO[x.tipoDocumento], valor: x._count._all })),
      };
    }

    case "incidencias": {
      const g = await prisma.incidencia.groupBy({
        by: ["estado"],
        where: { creadoEn: fecha },
        _count: { _all: true },
      });
      return {
        tipo: "bar",
        titulo: "Incidencias por estado",
        series: ordenar(g.map((x) => ({ nombre: ETIQUETA_ESTADO_INCIDENCIA[x.estado], valor: x._count._all }))),
      };
    }
  }
}

/** Genera el PDF del reporte (jsPDF + autotable). */
export function generarPDF(datos: DatosReporte): ArrayBuffer {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.setTextColor(0, 40, 120); // azul marino FarmaInvex
  doc.text("FarmaInvex", 14, 18);
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 40);
  doc.text(datos.titulo, 14, 26);
  doc.setFontSize(10);
  doc.setTextColor(0, 100, 180); // azul FarmaInvex para destacar el periodo
  doc.text(`Periodo: ${datos.periodo}`, 14, 33);

  doc.setFontSize(9);
  doc.setTextColor(110, 110, 130);
  doc.text(`Generado: ${fechaHora(new Date())}  ·  ${datos.filas.length} registro(s)`, 14, 39);

  autoTable(doc, {
    startY: 44,
    head: [datos.columnas.map((c) => c.header)],
    body: datos.filas.map((f) => datos.columnas.map((c) => String(f[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 40, 120], textColor: 255 },
    alternateRowStyles: { fillColor: [244, 247, 251] },
  });

  return doc.output("arraybuffer");
}

/** Genera el Excel del reporte (exceljs). */
export async function generarExcel(datos: DatosReporte): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FarmaInvex";
  const ws = wb.addWorksheet(datos.titulo.slice(0, 31));
  const nCols = datos.columnas.length;

  // Anchos y claves (sin cabecera automática: la colocamos manualmente más abajo).
  ws.columns = datos.columnas.map((c) => ({ key: c.key, width: c.width ?? 20 }));

  // Fila 1 — título del reporte.
  ws.mergeCells(1, 1, 1, nCols);
  const titulo = ws.getCell(1, 1);
  titulo.value = `FarmaInvex — ${datos.titulo}`;
  titulo.font = { bold: true, size: 14, color: { argb: "FF002878" } };
  ws.getRow(1).height = 22;

  // Fila 2 — periodo (legible, nunca null).
  ws.mergeCells(2, 1, 2, nCols);
  const periodo = ws.getCell(2, 1);
  periodo.value = `Periodo: ${datos.periodo}`;
  periodo.font = { bold: true, color: { argb: "FF0064B4" } };

  // Fila 3 — metadatos de generación.
  ws.mergeCells(3, 1, 3, nCols);
  const meta = ws.getCell(3, 1);
  meta.value = `Generado: ${fechaHora(new Date())}  ·  ${datos.filas.length} registro(s)`;
  meta.font = { color: { argb: "FF6E6E82" }, size: 10 };

  // Fila 5 — cabecera de la tabla.
  const cabecera = ws.getRow(5);
  cabecera.values = datos.columnas.map((c) => c.header);
  cabecera.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cabecera.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002878" } };

  // Datos a partir de la fila 6.
  datos.filas.forEach((fila) => ws.addRow(fila));
  ws.views = [{ state: "frozen", ySplit: 5 }];

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
