import { prisma } from "@/lib/prisma";
import { valorLote } from "@/domain/inventario";
import { SEMAFORO, type EstadoVencimiento } from "@/domain/vencimiento";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/enums";
import type { GraficoReporte, SerieGrafico } from "./reportes.service";

export interface KpisDashboard {
  totalMedicamentos: number;
  totalLotes: number;
  lotesVigentes: number;
  lotesPreventiva: number;
  lotesCriticos: number;
  alertasSinLeer: number;
  incidenciasAbiertas: number;
  valorInventario: number;
}

export async function obtenerKpis(): Promise<KpisDashboard> {
  const [
    totalMedicamentos,
    totalLotes,
    lotesVigentes,
    lotesPreventiva,
    lotesCriticos,
    alertasSinLeer,
    incidenciasAbiertas,
    lotesValor,
  ] = await Promise.all([
    prisma.medicamento.count(),
    prisma.lote.count(),
    prisma.lote.count({ where: { estadoVencimiento: "VIGENTE" } }),
    prisma.lote.count({ where: { estadoVencimiento: "PREVENTIVA" } }),
    prisma.lote.count({ where: { estadoVencimiento: "CRITICO" } }),
    prisma.alerta.count({ where: { leida: false, resuelta: false } }),
    prisma.incidencia.count({ where: { estado: { in: ["ABIERTA", "EN_SEGUIMIENTO"] } } }),
    prisma.lote.findMany({
      where: { estado: { not: "RETIRADO" } },
      select: { cantidad: true, costoUnitario: true },
    }),
  ]);

  const valorInventario = lotesValor.reduce(
    (suma, l) => suma + l.cantidad * Number(l.costoUnitario),
    0,
  );

  return {
    totalMedicamentos,
    totalLotes,
    lotesVigentes,
    lotesPreventiva,
    lotesCriticos,
    alertasSinLeer,
    incidenciasAbiertas,
    valorInventario,
  };
}

/** Datos para los gráficos del panel (recharts). */
export async function obtenerGraficosDashboard(): Promise<{
  semaforo: GraficoReporte;
  valorMedicamento: GraficoReporte;
  movimientos: GraficoReporte;
  vencimientosMes: GraficoReporte;
}> {
  const [porEstado, lotes, movs, proximos] = await Promise.all([
    prisma.lote.groupBy({
      by: ["estadoVencimiento"],
      where: { estado: { not: "RETIRADO" } },
      _count: { _all: true },
    }),
    prisma.lote.findMany({
      where: { estado: { not: "RETIRADO" } },
      include: { medicamento: true },
    }),
    prisma.movimientoFarmaceutico.groupBy({ by: ["tipo"], _count: { _all: true } }),
    prisma.lote.findMany({
      where: { estadoVencimiento: { in: ["PREVENTIVA", "CRITICO"] }, estado: { not: "RETIRADO" } },
      orderBy: { fechaVencimiento: "asc" },
      select: { fechaVencimiento: true },
    }),
  ]);

  // Semáforo (orden fijo VIGENTE → PREVENTIVA → CRITICO, con sus colores).
  const orden: EstadoVencimiento[] = ["VIGENTE", "PREVENTIVA", "CRITICO"];
  const conteoEstado = new Map(
    porEstado.map((x) => [x.estadoVencimiento as EstadoVencimiento, x._count._all]),
  );
  const semaforo: SerieGrafico[] = orden
    .map((e) => ({ nombre: SEMAFORO[e].etiqueta, valor: conteoEstado.get(e) ?? 0 }))
    .filter((s) => s.valor > 0);

  // Valor de inventario por medicamento (top 6).
  const porMed = new Map<string, number>();
  for (const l of lotes) {
    const v = valorLote(l.cantidad, Number(l.costoUnitario));
    porMed.set(l.medicamento.nombreComercial, (porMed.get(l.medicamento.nombreComercial) ?? 0) + v);
  }
  const valorMedicamento: SerieGrafico[] = [...porMed.entries()]
    .map(([nombre, valor]) => ({ nombre, valor: Math.round(valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  // Movimientos por tipo.
  const movimientos: SerieGrafico[] = movs
    .map((x) => ({ nombre: ETIQUETA_TIPO_MOVIMIENTO[x.tipo], valor: x._count._all }))
    .sort((a, b) => b.valor - a.valor);

  // Próximos a vencer agrupados por mes (orden cronológico preservado).
  const porMes = new Map<string, number>();
  for (const l of proximos) {
    const etiqueta = l.fechaVencimiento.toLocaleDateString("es-PE", {
      month: "short",
      year: "numeric",
    });
    porMes.set(etiqueta, (porMes.get(etiqueta) ?? 0) + 1);
  }
  const vencimientosMes: SerieGrafico[] = [...porMes.entries()].map(([nombre, valor]) => ({
    nombre,
    valor,
  }));

  return {
    semaforo: { tipo: "pie", titulo: "Lotes por estado de vencimiento", series: semaforo },
    valorMedicamento: { tipo: "bar", titulo: "Valor por medicamento (S/)", series: valorMedicamento },
    movimientos: { tipo: "bar", titulo: "Movimientos por tipo", series: movimientos },
    vencimientosMes: { tipo: "bar", titulo: "Próximos a vencer por mes", series: vencimientosMes },
  };
}

/** Próximos lotes a vencer, ordenados por urgencia. */
export async function lotesProximosAVencer(limite = 8) {
  return prisma.lote.findMany({
    where: { estadoVencimiento: { in: ["PREVENTIVA", "CRITICO"] }, estado: { not: "RETIRADO" } },
    include: { medicamento: true },
    orderBy: { diasRestantes: "asc" },
    take: limite,
  });
}
