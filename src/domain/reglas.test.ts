import { describe, it, expect } from "vitest";
import { evaluarReglas, type AccionRegla } from "./reglas";
import type { EvaluacionVencimiento } from "./vencimiento";

function evaluacion(
  dias: number,
  estado: "VIGENTE" | "PREVENTIVA" | "CRITICO",
  vencido: boolean,
): EvaluacionVencimiento {
  return { dias, estado, vencido };
}

function correr(ev: EvaluacionVencimiento, observado = false): AccionRegla[] {
  return evaluarReglas({
    codigo: "FI-LOT-0001",
    nombreMedicamento: "Paracetamol 500mg",
    evaluacion: ev,
    observado,
  });
}

const marcas = (a: AccionRegla[]) =>
  a.filter((x): x is Extract<AccionRegla, { tipo: "MARCAR_ESTADO_LOTE" }> => x.tipo === "MARCAR_ESTADO_LOTE");
const alertas = (a: AccionRegla[]) =>
  a.filter((x): x is Extract<AccionRegla, { tipo: "CREAR_ALERTA" }> => x.tipo === "CREAR_ALERTA");
const incidencias = (a: AccionRegla[]) =>
  a.filter((x): x is Extract<AccionRegla, { tipo: "ABRIR_INCIDENCIA" }> => x.tipo === "ABRIR_INCIDENCIA");

describe("evaluarReglas — sección VII del documento", () => {
  it("Regla 4: lote vigente normaliza el estado a VIGENTE, sin alertas", () => {
    const acc = correr(evaluacion(120, "VIGENTE", false));
    expect(marcas(acc)).toEqual([{ tipo: "MARCAR_ESTADO_LOTE", estado: "VIGENTE" }]);
    expect(alertas(acc)).toHaveLength(0);
    expect(incidencias(acc)).toHaveLength(0);
  });

  it("Regla 1: lote observado activa seguimiento sanitario (estado OBSERVADO + alerta)", () => {
    const acc = correr(evaluacion(120, "VIGENTE", false), true);
    expect(marcas(acc).some((m) => m.estado === "OBSERVADO")).toBe(true);
    const al = alertas(acc);
    expect(al).toHaveLength(1);
    expect(al[0].alerta).toBe("LOTE_OBSERVADO");
    expect(al[0].severidad).toBe("PREVENTIVA");
  });

  it("Regla 3: próximo a vencer (PREVENTIVA) genera alerta preventiva", () => {
    const acc = correr(evaluacion(45, "PREVENTIVA", false));
    expect(marcas(acc)).toContainEqual({ tipo: "MARCAR_ESTADO_LOTE", estado: "PROXIMO_VENCER" });
    const al = alertas(acc);
    expect(al[0].alerta).toBe("PROXIMO_VENCER");
    expect(al[0].severidad).toBe("PREVENTIVA");
  });

  it("crítico pero NO vencido queda PROXIMO_VENCER (nunca VENCIDO) con alerta crítica", () => {
    const acc = correr(evaluacion(10, "CRITICO", false));
    const m = marcas(acc);
    expect(m).toContainEqual({ tipo: "MARCAR_ESTADO_LOTE", estado: "PROXIMO_VENCER" });
    expect(m.some((x) => x.estado === "VENCIDO")).toBe(false);
    expect(alertas(acc)[0].severidad).toBe("CRITICA");
    expect(incidencias(acc)).toHaveLength(0);
  });

  it("Regla 2: producto vencido marca VENCIDO, alerta crítica y abre incidencia crítica", () => {
    const acc = correr(evaluacion(-3, "CRITICO", true));
    expect(marcas(acc)).toContainEqual({ tipo: "MARCAR_ESTADO_LOTE", estado: "VENCIDO" });

    const al = alertas(acc);
    expect(al.some((x) => x.alerta === "PRODUCTO_VENCIDO" && x.severidad === "CRITICA")).toBe(true);

    const inc = incidencias(acc);
    expect(inc).toHaveLength(1);
    expect(inc[0].severidad).toBe("CRITICA");
  });

  it("un lote vencido NO genera además alerta preventiva (estado terminal)", () => {
    const acc = correr(evaluacion(-1, "CRITICO", true));
    expect(alertas(acc).some((x) => x.alerta === "PROXIMO_VENCER")).toBe(false);
    expect(marcas(acc).some((x) => x.estado === "VIGENTE")).toBe(false);
  });
});
