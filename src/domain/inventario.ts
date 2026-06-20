/**
 * FarmaInvex — Lógica pura de inventario: control de stock por movimientos y
 * valorización de lotes. Sin framework ni acceso a datos, para ser testeable
 * de forma aislada (la capa de servicios/acciones la orquesta con Prisma).
 *
 * Código original de FarmaInvex (obra independiente).
 */

export type TipoMovimientoStock = "ENTRADA" | "SALIDA" | "VENTA" | "TRASLADO" | "BAJA";

/** Movimientos que descuentan stock. ENTRADA es el único que lo incrementa. */
const MOVIMIENTOS_SALIDA: ReadonlySet<TipoMovimientoStock> = new Set([
  "SALIDA",
  "VENTA",
  "TRASLADO",
  "BAJA",
]);

/** ¿El movimiento reduce las existencias del lote? */
export function esSalida(tipo: TipoMovimientoStock): boolean {
  return MOVIMIENTOS_SALIDA.has(tipo);
}

export interface ResultadoStock {
  ok: boolean;
  nuevoStock: number;
  error?: string;
}

/**
 * Calcula el stock resultante tras aplicar un movimiento.
 * - ENTRADA suma; SALIDA/TRASLADO/BAJA restan.
 * - No permite stock negativo: si la salida supera lo disponible, devuelve error.
 * - Exige cantidad entera positiva.
 */
export function calcularNuevoStock(
  tipo: TipoMovimientoStock,
  stockActual: number,
  cantidad: number,
): ResultadoStock {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return {
      ok: false,
      nuevoStock: stockActual,
      error: "La cantidad debe ser un entero positivo.",
    };
  }

  if (esSalida(tipo)) {
    if (cantidad > stockActual) {
      return {
        ok: false,
        nuevoStock: stockActual,
        error: `Stock insuficiente: solo hay ${stockActual} unidad(es) disponibles.`,
      };
    }
    return { ok: true, nuevoStock: stockActual - cantidad };
  }

  return { ok: true, nuevoStock: stockActual + cantidad };
}

/** Valor monetario de un lote = cantidad × costo unitario (redondeado a céntimos). */
export function valorLote(cantidad: number, costoUnitario: number): number {
  const valor = cantidad * costoUnitario;
  return Number.isFinite(valor) ? Math.round(valor * 100) / 100 : 0;
}
