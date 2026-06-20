import { describe, it, expect } from "vitest";
import { moneda, textoDiasRestantes, fechaCorta } from "./format";

describe("moneda", () => {
  it("formatea importes en soles", () => {
    const s = moneda(45);
    expect(s).toContain("S/");
    expect(s).toContain("45");
  });

  it("trata null/undefined como 0", () => {
    expect(moneda(null)).toContain("0");
    expect(moneda(undefined)).toContain("0");
  });

  it("acepta cadenas numéricas", () => {
    expect(moneda("1260.5")).toMatch(/1[.,]?260/);
  });

  it("no produce NaN ante entradas inválidas", () => {
    expect(moneda("abc")).not.toContain("NaN");
  });
});

describe("textoDiasRestantes", () => {
  it("muestra guion cuando no hay dato", () => {
    expect(textoDiasRestantes(null)).toBe("—");
    expect(textoDiasRestantes(undefined)).toBe("—");
  });

  it("indica cuántos días lleva vencido", () => {
    expect(textoDiasRestantes(-2)).toBe("Vencido hace 2 día(s)");
  });

  it("dice 'Vence hoy' cuando quedan 0 días", () => {
    expect(textoDiasRestantes(0)).toBe("Vence hoy");
  });

  it("indica los días restantes cuando es positivo", () => {
    expect(textoDiasRestantes(5)).toBe("5 día(s) restantes");
  });
});

describe("fechaCorta", () => {
  it("devuelve guion ante fechas vacías", () => {
    expect(fechaCorta(null)).toBe("—");
    expect(fechaCorta(undefined)).toBe("—");
  });
});
