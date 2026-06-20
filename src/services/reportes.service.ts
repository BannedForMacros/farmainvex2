import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { fechaCorta, fechaHora } from "@/lib/format";
import { SEMAFORO } from "@/domain/vencimiento";
import {
  ETIQUETA_ESTADO_LOTE,
  ETIQUETA_SEVERIDAD,
  ETIQUETA_ESTADO_INCIDENCIA,
  ETIQUETA_TIPO_MOVIMIENTO,
} from "@/lib/enums";

export type TipoReporte =
  | "medicamentos"
  | "lotes"
  | "proximos"
  | "alertas"
  | "historial"
  | "incidencias";

export const REPORTES: { tipo: TipoReporte; titulo: string; descripcion: string }[] = [
  { tipo: "medicamentos", titulo: "Medicamentos registrados", descripcion: "Catálogo completo de productos farmacéuticos." },
  { tipo: "lotes", titulo: "Control de lotes", descripcion: "Todos los lotes con su estado y vencimiento." },
  { tipo: "proximos", titulo: "Próximos a vencer", descripcion: "Lotes en alerta preventiva o crítica." },
  { tipo: "alertas", titulo: "Alertas sanitarias", descripcion: "Alertas generadas por el sistema." },
  { tipo: "historial", titulo: "Historial farmacéutico", descripcion: "Movimientos de entrada, salida y trazabilidad de lotes." },
  { tipo: "incidencias", titulo: "Incidencias", descripcion: "Incidencias sanitarias y su estado." },
];

export interface DatosReporte {
  tipo: TipoReporte;
  titulo: string;
  columnas: { header: string; key: string; width?: number }[];
  filas: Record<string, string | number>[];
}

export function esTipoReporteValido(tipo: string | null): tipo is TipoReporte {
  return REPORTES.some((r) => r.tipo === tipo);
}

export async function obtenerDatosReporte(tipo: TipoReporte): Promise<DatosReporte> {
  switch (tipo) {
    case "medicamentos": {
      const datos = await prisma.medicamento.findMany({
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
            ? { estadoVencimiento: { in: ["PREVENTIVA", "CRITICO"] }, estado: { not: "RETIRADO" } }
            : undefined,
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
          tipo: a.tipo,
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
        include: { lote: { include: { medicamento: true } }, usuario: true },
        orderBy: { fecha: "desc" },
      });
      return {
        tipo,
        titulo: "Historial farmacéutico",
        columnas: [
          { header: "Fecha", key: "fecha", width: 20 },
          { header: "Lote", key: "lote", width: 16 },
          { header: "Medicamento", key: "medicamento", width: 28 },
          { header: "Movimiento", key: "movimiento", width: 16 },
          { header: "Cantidad", key: "cantidad", width: 12 },
          { header: "Motivo", key: "motivo", width: 30 },
          { header: "Responsable", key: "responsable", width: 24 },
        ],
        filas: datos.map((m) => ({
          fecha: fechaHora(m.fecha),
          lote: m.lote.codigo,
          medicamento: m.lote.medicamento.nombreComercial,
          movimiento: ETIQUETA_TIPO_MOVIMIENTO[m.tipo],
          cantidad: m.cantidad,
          motivo: m.motivo ?? "—",
          responsable: m.usuario?.nombre ?? "—",
        })),
      };
    }

    case "incidencias": {
      const datos = await prisma.incidencia.findMany({
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

/** Genera el PDF del reporte (jsPDF + autotable). */
export function generarPDF(datos: DatosReporte): ArrayBuffer {
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.setTextColor(0, 40, 120); // azul marino FarmaInvex
  doc.text("FarmaInvex", 14, 18);
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 40);
  doc.text(datos.titulo, 14, 26);
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 130);
  doc.text(`Generado: ${fechaHora(new Date())}  ·  ${datos.filas.length} registro(s)`, 14, 32);

  autoTable(doc, {
    startY: 37,
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

  ws.columns = datos.columnas.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 20,
  }));
  ws.addRows(datos.filas);

  const cabecera = ws.getRow(1);
  cabecera.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cabecera.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002878" } };

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
