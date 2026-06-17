import { prisma } from "@/lib/prisma";
import { evaluarLote, type UmbralesVencimiento } from "@/domain/vencimiento";
import { evaluarReglas, type AccionRegla } from "@/domain/reglas";
import { obtenerUmbrales } from "./config.service";

export interface ResultadoRecalculo {
  lotesEvaluados: number;
  alertasCreadas: number;
  incidenciasCreadas: number;
  ejecutadoEn: string;
}

type LoteConMedicamento = Awaited<ReturnType<typeof cargarLote>>;

function cargarLote(id: string) {
  return prisma.lote.findUnique({ where: { id }, include: { medicamento: true } });
}

/**
 * Evalúa un único lote: recalcula su estado de vencimiento, aplica el motor de
 * reglas y persiste las alertas/incidencias derivadas. Devuelve los contadores.
 */
async function procesarLote(
  lote: NonNullable<LoteConMedicamento>,
  umbrales: UmbralesVencimiento,
  ahora: Date,
): Promise<{ alertas: number; incidencias: number }> {
  const evaluacion = evaluarLote(lote.fechaVencimiento, umbrales, ahora);
  const acciones = evaluarReglas({
    codigo: lote.codigo,
    nombreMedicamento: lote.medicamento.nombreComercial,
    evaluacion,
    observado: lote.observado,
  });

  await prisma.lote.update({
    where: { id: lote.id },
    data: {
      diasRestantes: evaluacion.dias,
      estadoVencimiento: evaluacion.estado,
      estado: estadoLoteDeAcciones(acciones) ?? lote.estado,
    },
  });

  let alertas = 0;
  let incidencias = 0;

  for (const accion of acciones) {
    if (accion.tipo === "CREAR_ALERTA") {
      const yaExiste = await prisma.alerta.findFirst({
        where: { loteId: lote.id, tipo: accion.alerta, resuelta: false },
      });
      if (!yaExiste) {
        await prisma.alerta.create({
          data: {
            loteId: lote.id,
            tipo: accion.alerta,
            severidad: accion.severidad,
            mensaje: accion.mensaje,
          },
        });
        alertas++;
      }
    } else if (accion.tipo === "ABRIR_INCIDENCIA") {
      const yaExiste = await prisma.incidencia.findFirst({
        where: { loteId: lote.id, estado: { in: ["ABIERTA", "EN_SEGUIMIENTO"] } },
      });
      if (!yaExiste) {
        await prisma.incidencia.create({
          data: {
            codigo: `FI-INC-${Date.now().toString().slice(-6)}`,
            titulo: accion.titulo,
            severidad: accion.severidad,
            loteId: lote.id,
            evidencias: [],
          },
        });
        incidencias++;
      }
    }
  }

  return { alertas, incidencias };
}

/** Evalúa un lote por id (tras crearlo o editarlo). */
export async function evaluarLotePorId(id: string): Promise<void> {
  const lote = await cargarLote(id);
  if (!lote) return;
  const umbrales = await obtenerUmbrales();
  await procesarLote(lote, umbrales, new Date());
}

/**
 * Recorre todos los lotes activos y los reevalúa (monitoreo de vencimientos).
 * Modo local: se invoca desde el botón "Recalcular" y al cargar el panel.
 */
export async function recalcularVencimientos(): Promise<ResultadoRecalculo> {
  const umbrales = await obtenerUmbrales();
  const ahora = new Date();

  const lotes = await prisma.lote.findMany({
    where: { estado: { not: "RETIRADO" } },
    include: { medicamento: true },
  });

  let alertasCreadas = 0;
  let incidenciasCreadas = 0;

  for (const lote of lotes) {
    const r = await procesarLote(lote, umbrales, ahora);
    alertasCreadas += r.alertas;
    incidenciasCreadas += r.incidencias;
  }

  return {
    lotesEvaluados: lotes.length,
    alertasCreadas,
    incidenciasCreadas,
    ejecutadoEn: ahora.toISOString(),
  };
}

function estadoLoteDeAcciones(
  acciones: AccionRegla[],
): "VIGENTE" | "PROXIMO_VENCER" | "VENCIDO" | "OBSERVADO" | undefined {
  const marca = acciones.find((a) => a.tipo === "MARCAR_ESTADO_LOTE");
  return marca?.tipo === "MARCAR_ESTADO_LOTE" ? marca.estado : undefined;
}
