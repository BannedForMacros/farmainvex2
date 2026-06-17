import { prisma } from "@/lib/prisma";
import { evaluarLote } from "@/domain/vencimiento";
import { evaluarReglas, type AccionRegla } from "@/domain/reglas";
import { obtenerUmbrales } from "./config.service";

export interface ResultadoRecalculo {
  lotesEvaluados: number;
  alertasCreadas: number;
  incidenciasCreadas: number;
  ejecutadoEn: string;
}

/**
 * Recorre todos los lotes, recalcula su estado de vencimiento, aplica el motor
 * de reglas (sección VII) y persiste alertas/incidencias derivadas.
 *
 * Modo local: se invoca al cargar el panel y desde el botón "Recalcular".
 * En producción, el mismo procedimiento puede dispararse por cron sin cambios.
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
          alertasCreadas++;
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
          incidenciasCreadas++;
        }
      }
    }
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
