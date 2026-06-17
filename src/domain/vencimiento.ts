/**
 * FarmaInvex — Núcleo de monitoreo de vencimientos farmacéuticos.
 *
 * Implementa la sección V.3 ("Monitoreo de vencimientos") y el semáforo
 * sanitario del documento del proyecto:
 *
 *     Días Restantes = Fecha de Vencimiento − Fecha Actual
 *
 *     🔴 CRITICO     → vencido o dentro del umbral crítico
 *     🟡 PREVENTIVA  → dentro del umbral preventivo
 *     🟢 VIGENTE     → fuera de toda ventana de alerta
 *
 * Código original de FarmaInvex (obra independiente).
 */

export type EstadoVencimiento = "VIGENTE" | "PREVENTIVA" | "CRITICO";

/** Umbrales en días, configurables vía la tabla ConfigRegla. */
export interface UmbralesVencimiento {
  diasPreventiva: number; // p.ej. 90
  diasCritico: number; // p.ej. 30
}

export const UMBRALES_POR_DEFECTO: UmbralesVencimiento = {
  diasPreventiva: 90,
  diasCritico: 30,
};

const MS_POR_DIA = 1000 * 60 * 60 * 24;

/**
 * Días calendario restantes hasta el vencimiento.
 * Negativo si el lote ya venció. Normaliza ambas fechas a medianoche
 * para que el conteo sea por día calendario y no por horas.
 */
export function diasRestantes(fechaVencimiento: Date, hoy: Date = new Date()): number {
  const venc = Date.UTC(
    fechaVencimiento.getFullYear(),
    fechaVencimiento.getMonth(),
    fechaVencimiento.getDate(),
  );
  const ref = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((venc - ref) / MS_POR_DIA);
}

/**
 * Clasifica el estado sanitario de un lote según sus días restantes.
 * Un lote vencido (días < 0) siempre es CRITICO.
 */
export function clasificarVencimiento(
  dias: number,
  umbrales: UmbralesVencimiento = UMBRALES_POR_DEFECTO,
): EstadoVencimiento {
  if (dias < 0 || dias <= umbrales.diasCritico) return "CRITICO";
  if (dias <= umbrales.diasPreventiva) return "PREVENTIVA";
  return "VIGENTE";
}

/** Metadatos de presentación del semáforo (etiqueta + color del logo + tono). */
export const SEMAFORO: Record<
  EstadoVencimiento,
  { etiqueta: string; color: string; tono: "danger" | "warning" | "success" }
> = {
  CRITICO: { etiqueta: "Riesgo crítico", color: "#E5304B", tono: "danger" },
  PREVENTIVA: { etiqueta: "Alerta preventiva", color: "#F5A623", tono: "warning" },
  VIGENTE: { etiqueta: "Producto vigente", color: "#18B981", tono: "success" },
};

/** Resultado consolidado del cálculo de un lote. */
export interface EvaluacionVencimiento {
  dias: number;
  estado: EstadoVencimiento;
  vencido: boolean;
}

export function evaluarLote(
  fechaVencimiento: Date,
  umbrales: UmbralesVencimiento = UMBRALES_POR_DEFECTO,
  hoy: Date = new Date(),
): EvaluacionVencimiento {
  const dias = diasRestantes(fechaVencimiento, hoy);
  return {
    dias,
    estado: clasificarVencimiento(dias, umbrales),
    vencido: dias < 0,
  };
}
