"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
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
  motivo: z.string().trim().max(200).optional(),
});

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
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }

  const { loteId, tipo, cantidad, motivo } = parsed.data;

  const lote = await prisma.lote.findUnique({ where: { id: loteId } });
  if (!lote) return { error: "El lote no existe." };

  const resultado = calcularNuevoStock(tipo, lote.cantidad, cantidad);
  if (!resultado.ok) {
    return { fieldErrors: { cantidad: resultado.error! } };
  }
  const nuevaCantidad = resultado.nuevoStock;

  await prisma.$transaction([
    prisma.movimientoFarmaceutico.create({
      data: { loteId, tipo, cantidad, motivo: motivo || null, usuarioId: session.user.id },
    }),
    prisma.lote.update({ where: { id: loteId }, data: { cantidad: nuevaCantidad } }),
  ]);

  // Recalcula estado/alertas del lote con el stock actualizado.
  await evaluarLotePorId(loteId);

  revalidatePath(`/lotes/${loteId}`);
  revalidatePath("/lotes");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
  return { ok: true };
}
