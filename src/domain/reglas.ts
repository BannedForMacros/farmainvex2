/**
 * FarmaInvex — Motor de reglas sanitarias (sección VII del documento).
 *
 * Reglas declarativas que evalúan el estado de un lote y producen las
 * acciones automáticas del sistema (alertas, incidencias, seguimiento).
 * El motor es PURO: recibe el estado y devuelve las acciones a ejecutar;
 * la capa de servicios las persiste. Así se mantiene testeable y aislado.
 *
 * Código original de FarmaInvex (obra independiente).
 */

import {
  type EstadoVencimiento,
  type EvaluacionVencimiento,
} from "./vencimiento";

export type TipoAlerta =
  | "PROXIMO_VENCER"
  | "LOTE_OBSERVADO"
  | "RIESGO_ALMACENAMIENTO"
  | "INCIDENCIA_SANITARIA"
  | "PRODUCTO_VENCIDO";

export type Severidad = "INFO" | "PREVENTIVA" | "CRITICA";

/** Una acción que el motor solicita ejecutar a la capa de servicios. */
export type AccionRegla =
  | { tipo: "CREAR_ALERTA"; alerta: TipoAlerta; severidad: Severidad; mensaje: string }
  | { tipo: "ABRIR_INCIDENCIA"; severidad: Severidad; titulo: string }
  | { tipo: "MARCAR_ESTADO_LOTE"; estado: "VIGENTE" | "PROXIMO_VENCER" | "VENCIDO" | "OBSERVADO" };

/** Entrada que necesita el motor para evaluar un lote concreto. */
export interface ContextoLote {
  codigo: string;
  nombreMedicamento: string;
  evaluacion: EvaluacionVencimiento;
  observado: boolean; // el supervisor marcó observaciones sobre el lote
}

// Mapeo del estado del lote cuando aún NO ha vencido (el caso vencido se
// resuelve antes, en la Regla 2). Un lote crítico pero vigente sigue siendo
// "próximo a vencer", no "vencido".
const ESTADO_LOTE_POR_VENCIMIENTO: Record<EstadoVencimiento, "VIGENTE" | "PROXIMO_VENCER"> = {
  VIGENTE: "VIGENTE",
  PREVENTIVA: "PROXIMO_VENCER",
  CRITICO: "PROXIMO_VENCER",
};

/**
 * Evalúa las 5 reglas del documento (sección VII) sobre un lote y devuelve
 * la lista de acciones que deben ejecutarse.
 */
export function evaluarReglas(ctx: ContextoLote): AccionRegla[] {
  const acciones: AccionRegla[] = [];
  const { evaluacion, codigo, nombreMedicamento, observado } = ctx;

  // Regla 1 — Si un lote presenta observaciones → activa seguimiento sanitario.
  if (observado) {
    acciones.push({ tipo: "MARCAR_ESTADO_LOTE", estado: "OBSERVADO" });
    acciones.push({
      tipo: "CREAR_ALERTA",
      alerta: "LOTE_OBSERVADO",
      severidad: "PREVENTIVA",
      mensaje: `El lote ${codigo} (${nombreMedicamento}) está bajo seguimiento sanitario.`,
    });
  }

  // Regla 2 — Si existe producto vencido → genera incidencia crítica.
  if (evaluacion.vencido) {
    acciones.push({ tipo: "MARCAR_ESTADO_LOTE", estado: "VENCIDO" });
    acciones.push({
      tipo: "CREAR_ALERTA",
      alerta: "PRODUCTO_VENCIDO",
      severidad: "CRITICA",
      mensaje: `El lote ${codigo} (${nombreMedicamento}) está VENCIDO. Retirar de inmediato.`,
    });
    acciones.push({
      tipo: "ABRIR_INCIDENCIA",
      severidad: "CRITICA",
      titulo: `Producto vencido: ${nombreMedicamento} (lote ${codigo})`,
    });
    return acciones; // estado terminal: no tiene sentido evaluar alerta preventiva
  }

  // Regla 3 — Si un medicamento está próximo a vencer → genera alerta preventiva.
  if (evaluacion.estado === "PREVENTIVA" || evaluacion.estado === "CRITICO") {
    const severidad: Severidad = evaluacion.estado === "CRITICO" ? "CRITICA" : "PREVENTIVA";
    acciones.push({
      tipo: "MARCAR_ESTADO_LOTE",
      estado: ESTADO_LOTE_POR_VENCIMIENTO[evaluacion.estado],
    });
    acciones.push({
      tipo: "CREAR_ALERTA",
      alerta: "PROXIMO_VENCER",
      severidad,
      mensaje: `El lote ${codigo} (${nombreMedicamento}) vence en ${evaluacion.dias} día(s).`,
    });
  } else if (!observado) {
    // Regla 4 — Si se actualizan registros → recalcula y normaliza el estado vigente.
    acciones.push({ tipo: "MARCAR_ESTADO_LOTE", estado: "VIGENTE" });
  }

  return acciones;
}
