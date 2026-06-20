"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";
import { evaluarLotePorId } from "@/services/vencimientos.service";
import { calcularNuevoStock } from "@/domain/inventario";

/** Tipos que el usuario puede registrar desde la UI. ENTRADA suma stock; el resto lo descuentan. */
const TIPOS_MOVIMIENTO = ["ENTRADA", "SALIDA", "TRASLADO", "BAJA"] as const;

const schema = z.object({
  loteId: z.string().min(1),
  tipo: z.enum(TIPOS_MOVIMIENTO),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  motivo: z.string().trim().max(120).optional(),
  destino: z.string().trim().max(120).optional(),
  documentoRef: z.string().trim().max(60).optional(),
  recibidoPor: z.string().trim().max(120).optional(),
  fecha: z.string().optional(), // yyyy-mm-dd; vacío = ahora
});

/** Convierte "yyyy-mm-dd" en Date (mediodía local para evitar desfase de zona). */
function parseFechaMovimiento(valor: string | undefined): Date | undefined {
  if (!valor) return undefined;
  const d = new Date(`${valor}T12:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export interface EstadoMovimiento {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function registrarMovimiento(
  _prev: EstadoMovimiento,
  formData: FormData,
): Promise<EstadoMovimiento> {
  const session = await requireRol(["ADMIN", "FARMACEUTICO", "SUPERVISOR"]);

  const parsed = schema.safeParse({
    loteId: formData.get("loteId"),
    tipo: formData.get("tipo"),
    cantidad: formData.get("cantidad"),
    motivo: (formData.get("motivo") as string) || undefined,
    destino: (formData.get("destino") as string) || undefined,
    documentoRef: (formData.get("documentoRef") as string) || undefined,
    recibidoPor: (formData.get("recibidoPor") as string) || undefined,
    fecha: (formData.get("fecha") as string) || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }

  const { loteId, tipo, cantidad, motivo, destino, documentoRef, recibidoPor, fecha } = parsed.data;

  const lote = await prisma.lote.findUnique({ where: { id: loteId } });
  if (!lote) return { error: "El lote no existe." };

  const resultado = calcularNuevoStock(tipo, lote.cantidad, cantidad);
  if (!resultado.ok) {
    return { fieldErrors: { cantidad: resultado.error! } };
  }
  const nuevaCantidad = resultado.nuevoStock;
  const fechaMovimiento = parseFechaMovimiento(fecha);

  await prisma.$transaction([
    prisma.movimientoFarmaceutico.create({
      data: {
        loteId,
        tipo,
        cantidad,
        motivo: motivo || null,
        destino: destino || null,
        documentoRef: documentoRef || null,
        recibidoPor: recibidoPor || null,
        usuarioId: session.user.id,
        ...(fechaMovimiento ? { fecha: fechaMovimiento } : {}),
      },
    }),
    prisma.lote.update({ where: { id: loteId }, data: { cantidad: nuevaCantidad } }),
  ]);

  // Recalcula estado/alertas del lote con el stock actualizado.
  await evaluarLotePorId(loteId);

  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/lotes");
  revalidatePath("/inventario");
  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
  return { ok: true };
}

function revalidarMovimientos() {
  revalidatePath("/lotes");
  revalidatePath("/inventario");
  revalidatePath("/salidas");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
}

// ----- Salida con varios lotes (una guía/dispatch con múltiples ítems) -----

const TIPOS_SALIDA = ["SALIDA", "TRASLADO", "BAJA"] as const;

const lineaSalidaSchema = z.object({
  loteId: z.string().min(1),
  cantidad: z.coerce.number().int().positive(),
  motivo: z.string().trim().max(120).optional(),
  documentoRef: z.string().trim().max(60).optional(), // documento por detalle
});

const salidaSchema = z.object({
  tipo: z.enum(TIPOS_SALIDA),
  destino: z.string().trim().max(120).optional(),
  recibidoPor: z.string().trim().max(120).optional(),
  fecha: z.string().optional(),
  lineas: z.array(lineaSalidaSchema).min(1, "Agrega al menos un lote."),
});

export async function registrarSalida(
  _prev: EstadoMovimiento,
  formData: FormData,
): Promise<EstadoMovimiento> {
  const session = await requireRol(["ADMIN", "FARMACEUTICO", "SUPERVISOR"]);

  let lineasRaw: unknown;
  try {
    lineasRaw = JSON.parse(String(formData.get("lineas") ?? "[]"));
  } catch {
    return { error: "No se pudieron leer los lotes de la salida." };
  }

  const parsed = salidaSchema.safeParse({
    tipo: formData.get("tipo"),
    destino: (formData.get("destino") as string) || undefined,
    recibidoPor: (formData.get("recibidoPor") as string) || undefined,
    fecha: (formData.get("fecha") as string) || undefined,
    lineas: lineasRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos de la salida inválidos." };
  }

  const { tipo, destino, recibidoPor, fecha, lineas } = parsed.data;

  const ids = [...new Set(lineas.map((l) => l.loteId))];
  const lotes = await prisma.lote.findMany({ where: { id: { in: ids } } });
  const mapa = new Map(lotes.map((l) => [l.id, l]));

  // Valida el stock de forma acumulada (un mismo lote puede repetirse en líneas).
  const restante = new Map(lotes.map((l) => [l.id, l.cantidad]));
  for (const linea of lineas) {
    const lote = mapa.get(linea.loteId);
    if (!lote) return { error: "Un lote seleccionado no existe." };
    const r = calcularNuevoStock(tipo, restante.get(linea.loteId)!, linea.cantidad);
    if (!r.ok) return { error: `${lote.codigo}: ${r.error}` };
    restante.set(linea.loteId, r.nuevoStock);
  }

  const fechaMovimiento = parseFechaMovimiento(fecha);

  const ops = [
    ...lineas.map((linea) =>
      prisma.movimientoFarmaceutico.create({
        data: {
          loteId: linea.loteId,
          tipo,
          cantidad: linea.cantidad,
          motivo: linea.motivo || null,
          destino: destino || null,
          documentoRef: linea.documentoRef || null,
          recibidoPor: recibidoPor || null,
          usuarioId: session.user.id,
          ...(fechaMovimiento ? { fecha: fechaMovimiento } : {}),
        },
      }),
    ),
    ...[...restante.entries()].map(([id, nuevo]) =>
      prisma.lote.update({ where: { id }, data: { cantidad: nuevo } }),
    ),
  ];
  await prisma.$transaction(ops);

  for (const id of ids) await evaluarLotePorId(id);

  revalidarMovimientos();
  redirect("/salidas");
}
