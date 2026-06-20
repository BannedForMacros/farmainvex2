/** Utilidades de formato (es-PE) para FarmaInvex. */

const LOCALE = "es-PE";

/** 17/06/2026 */
export function fechaCorta(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** 17 de junio de 2026 */
export function fechaLarga(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** 17/06/2026, 14:35 */
export function fechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** S/ 1,234.50 — importe en soles (es-PE). Acepta number, string o null. */
export function moneda(valor: number | string | null | undefined): string {
  const n = typeof valor === "string" ? Number(valor) : (valor ?? 0);
  return (Number.isFinite(n) ? n : 0).toLocaleString(LOCALE, {
    style: "currency",
    currency: "PEN",
  });
}

/** Texto legible para los días restantes hasta el vencimiento. */
export function textoDiasRestantes(dias: number | null | undefined): string {
  if (dias === null || dias === undefined) return "—";
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return "Vence hoy";
  return `${dias} día(s) restantes`;
}
