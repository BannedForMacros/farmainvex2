import { prisma } from "@/lib/prisma";

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

/** Próximos lotes a vencer, ordenados por urgencia. */
export async function lotesProximosAVencer(limite = 8) {
  return prisma.lote.findMany({
    where: { estadoVencimiento: { in: ["PREVENTIVA", "CRITICO"] }, estado: { not: "RETIRADO" } },
    include: { medicamento: true },
    orderBy: { diasRestantes: "asc" },
    take: limite,
  });
}
