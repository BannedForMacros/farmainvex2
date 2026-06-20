import { describe, it, expect } from "vitest";
import {
  diasRestantes,
  clasificarVencimiento,
  evaluarLote,
  SEMAFORO,
  UMBRALES_POR_DEFECTO,
} from "./vencimiento";

describe("diasRestantes", () => {
  it("cuenta los días calendario hasta el vencimiento", () => {
    expect(diasRestantes(new Date(2026, 0, 31), new Date(2026, 0, 1))).toBe(30);
  });

  it("es 0 el mismo día de vencimiento", () => {
    expect(diasRestantes(new Date(2026, 5, 19), new Date(2026, 5, 19))).toBe(0);
  });

  it("es negativo cuando el lote ya venció", () => {
    expect(diasRestantes(new Date(2026, 0, 1), new Date(2026, 0, 6))).toBe(-5);
  });

  it("ignora la hora del día (normaliza a medianoche)", () => {
    const venc = new Date(2026, 0, 2, 23, 59);
    const hoy = new Date(2026, 0, 1, 0, 1);
    expect(diasRestantes(venc, hoy)).toBe(1);
  });
});

describe("clasificarVencimiento (umbrales por defecto 90/30)", () => {
  it("CRITICO si está vencido (días < 0)", () => {
    expect(clasificarVencimiento(-1)).toBe("CRITICO");
  });

  it("CRITICO en el límite del umbral crítico (≤ 30)", () => {
    expect(clasificarVencimiento(0)).toBe("CRITICO");
    expect(clasificarVencimiento(30)).toBe("CRITICO");
  });

  it("PREVENTIVA entre el umbral crítico y el preventivo (31–90)", () => {
    expect(clasificarVencimiento(31)).toBe("PREVENTIVA");
    expect(clasificarVencimiento(90)).toBe("PREVENTIVA");
  });

  it("VIGENTE fuera de toda ventana (> 90)", () => {
    expect(clasificarVencimiento(91)).toBe("VIGENTE");
    expect(clasificarVencimiento(400)).toBe("VIGENTE");
  });

  it("respeta umbrales personalizados", () => {
    const umbrales = { diasPreventiva: 60, diasCritico: 15 };
    expect(clasificarVencimiento(15, umbrales)).toBe("CRITICO");
    expect(clasificarVencimiento(16, umbrales)).toBe("PREVENTIVA");
    expect(clasificarVencimiento(60, umbrales)).toBe("PREVENTIVA");
    expect(clasificarVencimiento(61, umbrales)).toBe("VIGENTE");
  });
});

describe("evaluarLote", () => {
  const hoy = new Date(2026, 5, 19);

  it("lote vigente: estado VIGENTE, no vencido", () => {
    const r = evaluarLote(new Date(2026, 11, 31), UMBRALES_POR_DEFECTO, hoy);
    expect(r.estado).toBe("VIGENTE");
    expect(r.vencido).toBe(false);
    expect(r.dias).toBeGreaterThan(90);
  });

  it("lote vencido: estado CRITICO y vencido = true", () => {
    const r = evaluarLote(new Date(2026, 5, 16), UMBRALES_POR_DEFECTO, hoy);
    expect(r.estado).toBe("CRITICO");
    expect(r.vencido).toBe(true);
    expect(r.dias).toBe(-3);
  });

  it("lote en ventana preventiva", () => {
    const r = evaluarLote(new Date(2026, 7, 3), UMBRALES_POR_DEFECTO, hoy); // ~45 días
    expect(r.estado).toBe("PREVENTIVA");
    expect(r.vencido).toBe(false);
  });
});

describe("SEMAFORO (etiquetas del Word V.3)", () => {
  it("usa las etiquetas oficiales del documento", () => {
    expect(SEMAFORO.CRITICO.etiqueta).toBe("Riesgo crítico");
    expect(SEMAFORO.PREVENTIVA.etiqueta).toBe("Alerta preventiva");
    expect(SEMAFORO.VIGENTE.etiqueta).toBe("Producto vigente");
  });
});
