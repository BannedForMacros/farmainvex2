import { describe, it, expect } from "vitest";
import { esSalida, calcularNuevoStock, valorLote } from "./inventario";

describe("esSalida", () => {
  it("SALIDA, TRASLADO y BAJA descuentan stock", () => {
    expect(esSalida("SALIDA")).toBe(true);
    expect(esSalida("TRASLADO")).toBe(true);
    expect(esSalida("BAJA")).toBe(true);
  });

  it("ENTRADA no es salida (incrementa stock)", () => {
    expect(esSalida("ENTRADA")).toBe(false);
  });
});

describe("calcularNuevoStock", () => {
  it("ENTRADA suma al stock actual", () => {
    expect(calcularNuevoStock("ENTRADA", 100, 30)).toEqual({ ok: true, nuevoStock: 130 });
  });

  it("SALIDA descuenta del stock actual", () => {
    expect(calcularNuevoStock("SALIDA", 100, 40)).toEqual({ ok: true, nuevoStock: 60 });
  });

  it("permite dejar el stock en 0 (salida igual al disponible)", () => {
    expect(calcularNuevoStock("BAJA", 25, 25)).toEqual({ ok: true, nuevoStock: 25 - 25 });
  });

  it("rechaza salidas que superan el stock (sin negativos)", () => {
    const r = calcularNuevoStock("SALIDA", 10, 11);
    expect(r.ok).toBe(false);
    expect(r.nuevoStock).toBe(10); // no muta el stock
    expect(r.error).toMatch(/insuficiente/i);
  });

  it("rechaza cantidades no positivas o no enteras", () => {
    expect(calcularNuevoStock("SALIDA", 10, 0).ok).toBe(false);
    expect(calcularNuevoStock("ENTRADA", 10, -5).ok).toBe(false);
    expect(calcularNuevoStock("ENTRADA", 10, 2.5).ok).toBe(false);
  });
});

describe("valorLote", () => {
  it("multiplica cantidad por costo unitario", () => {
    expect(valorLote(10, 4.5)).toBe(45);
    expect(valorLote(280, 4.5)).toBe(1260);
  });

  it("redondea a céntimos", () => {
    expect(valorLote(3, 8.2)).toBe(24.6);
    expect(valorLote(7, 1.005)).toBe(7.04);
  });

  it("devuelve 0 ante valores no finitos", () => {
    expect(valorLote(0, 30)).toBe(0);
    expect(valorLote(Number.NaN, 10)).toBe(0);
  });
});
