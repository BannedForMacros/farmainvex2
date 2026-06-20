import { prisma } from "@/lib/prisma";
import { valorLote } from "@/domain/inventario";
import { fechaCorta } from "@/lib/format";
import type { EstadoVencimiento } from "@/domain/vencimiento";

/** Tipos de movimiento que representan una salida de stock. */
export const TIPOS_SALIDA = ["SALIDA", "TRASLADO", "BAJA"] as const;

export interface FilaInventario {
  id: string;
  codigo: string;
  medicamento: string;
  stock: number;
  costo: number;
  valor: number;
  estado: EstadoVencimiento;
  vence: Date;
}

/** Inventario valorizado: valor total + filas por lote (mayor valor primero). */
export async function obtenerInventario(): Promise<{
  valorTotal: number;
  filas: FilaInventario[];
}> {
  const lotes = await prisma.lote.findMany({
    where: { estado: { not: "RETIRADO" } },
    include: { medicamento: true },
  });

  const filas: FilaInventario[] = lotes
    .map((l) => {
      const costo = Number(l.costoUnitario);
      return {
        id: l.id,
        codigo: l.codigo,
        medicamento: l.medicamento.nombreComercial,
        stock: l.cantidad,
        costo,
        valor: valorLote(l.cantidad, costo),
        estado: l.estadoVencimiento as EstadoVencimiento,
        vence: l.fechaVencimiento,
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const valorTotal = filas.reduce((suma, f) => suma + f.valor, 0);
  return { valorTotal, filas };
}

export interface LoteOpcion {
  id: string;
  codigo: string;
  medicamento: string;
  stock: number;
  vence: string;
  estado: EstadoVencimiento;
}

/**
 * Lotes para el selector de movimientos, ordenados por vencimiento más próximo
 * (FEFO: First Expired, First Out) — el sistema sugiere dispensar primero lo que
 * vence antes. `soloConStock` filtra los lotes ya agotados (útil para salidas).
 */
export async function lotesParaMovimiento(soloConStock = false): Promise<LoteOpcion[]> {
  const lotes = await prisma.lote.findMany({
    where: {
      estado: { not: "RETIRADO" },
      ...(soloConStock ? { cantidad: { gt: 0 } } : {}),
    },
    include: { medicamento: true },
    orderBy: { fechaVencimiento: "asc" },
  });

  return lotes.map((l) => ({
    id: l.id,
    codigo: l.codigo,
    medicamento: l.medicamento.nombreComercial,
    stock: l.cantidad,
    vence: fechaCorta(l.fechaVencimiento),
    estado: l.estadoVencimiento as EstadoVencimiento,
  }));
}

/** Nombres de establecimientos para el select de destino de los movimientos. */
export async function nombresEstablecimientos(): Promise<string[]> {
  const ests = await prisma.establecimiento.findMany({
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });
  return ests.map((e) => e.nombre);
}

/** Nombres de usuarios activos para el select de "recibido por". */
export async function nombresUsuarios(): Promise<string[]> {
  const us = await prisma.usuario.findMany({
    where: { activo: true },
    select: { nombre: true },
    orderBy: { nombre: "asc" },
  });
  return us.map((u) => u.nombre);
}

/** Últimos movimientos de TODOS los lotes (feed de trazabilidad). */
export async function movimientosRecientes(limite = 12) {
  return prisma.movimientoFarmaceutico.findMany({
    include: { lote: { include: { medicamento: true } }, usuario: true },
    orderBy: { fecha: "desc" },
    take: limite,
  });
}

/** Últimas salidas (SALIDA/TRASLADO/BAJA) de todos los lotes. */
export async function salidasRecientes(limite = 40) {
  return prisma.movimientoFarmaceutico.findMany({
    where: { tipo: { in: [...TIPOS_SALIDA] } },
    include: { lote: { include: { medicamento: true } }, usuario: true },
    orderBy: { fecha: "desc" },
    take: limite,
  });
}

/** Indicadores para la cabecera de la página de salidas. */
export async function resumenSalidas(): Promise<{
  totalSalidas: number;
  unidadesDispensadas: number;
  lotesDisponibles: number;
}> {
  const [agg, lotesDisponibles] = await Promise.all([
    prisma.movimientoFarmaceutico.aggregate({
      where: { tipo: { in: [...TIPOS_SALIDA] } },
      _count: { _all: true },
      _sum: { cantidad: true },
    }),
    prisma.lote.count({ where: { estado: { not: "RETIRADO" }, cantidad: { gt: 0 } } }),
  ]);
  return {
    totalSalidas: agg._count._all,
    unidadesDispensadas: agg._sum.cantidad ?? 0,
    lotesDisponibles,
  };
}
