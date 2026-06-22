"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";
import { evaluarLotePorId } from "@/services/vencimientos.service";

const schema = z.object({
  medicamentoId: z.string().min(1, "Selecciona un medicamento"),
  numeroLote: z.string().trim().min(1, "El número de lote es obligatorio"),
  fechaFabricacion: z.string().min(1, "La fecha de fabricación es obligatoria"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  cantidad: z.coerce.number().int().min(0, "Cantidad inválida"),
  costoUnitario: z.coerce.number().min(0, "Costo inválido").default(0),
  establecimientoId: z.string().optional(),
  observado: z.boolean().optional(),
  proveedorId: z.string().optional(),
});

export interface EstadoForm {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function revalidar() {
  revalidatePath("/lotes");
  revalidatePath("/vencimientos");
  revalidatePath("/dashboard");
  revalidatePath("/alertas");
}

export async function guardarLote(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const session = await requireRol(["ADMIN", "FARMACEUTICO", "SUPERVISOR"]);
  const id = (formData.get("id") as string) || null;

  const parsed = schema.safeParse({
    medicamentoId: formData.get("medicamentoId"),
    numeroLote: formData.get("numeroLote"),
    fechaFabricacion: formData.get("fechaFabricacion"),
    fechaVencimiento: formData.get("fechaVencimiento"),
    cantidad: formData.get("cantidad"),
    costoUnitario: formData.get("costoUnitario"),
    establecimientoId: (formData.get("establecimientoId") as string) || undefined,
    observado: formData.get("observado") === "on",
    proveedorId: (formData.get("proveedorId") as string) || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }

  const data = parsed.data;
  const fechaFabricacion = new Date(data.fechaFabricacion);
  const fechaVencimiento = new Date(data.fechaVencimiento);
  if (fechaVencimiento <= fechaFabricacion) {
    return { fieldErrors: { fechaVencimiento: "Debe ser posterior a la fecha de fabricación." } };
  }

  const camposComunes = {
    medicamentoId: data.medicamentoId,
    numeroLote: data.numeroLote,
    fechaFabricacion,
    fechaVencimiento,
    cantidad: data.cantidad,
    costoUnitario: data.costoUnitario,
    establecimientoId: data.establecimientoId || null,
    observado: Boolean(data.observado),
  };

  let loteId: string;
  try {
    if (id) {
      await prisma.lote.update({ where: { id }, data: camposComunes });
      loteId = id;
    } else {
      const n = await prisma.lote.count();
      const codigo = `FI-LOT-${String(n + 1).padStart(4, "0")}`;
      const lote = await prisma.lote.create({ data: { codigo, ...camposComunes } });
      loteId = lote.id;

      // Movimiento de ENTRADA (ingreso al inventario — trazabilidad).
      await prisma.movimientoFarmaceutico.create({
        data: {
          loteId,
          tipo: "ENTRADA",
          cantidad: data.cantidad,
          motivo: "Registro de lote en almacén",
          proveedorId: data.proveedorId || null,
          usuarioId: session.user.id,
        },
      });
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "Conflicto al generar el código del lote. Intenta de nuevo." };
    }
    throw e;
  }

  // Aplica el motor de reglas: recalcula estado y genera alertas/incidencias.
  await evaluarLotePorId(loteId);

  revalidar();
  redirect("/lotes");
}

export async function eliminarLote(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRol(["ADMIN", "FARMACEUTICO", "SUPERVISOR"]);
  await prisma.lote.delete({ where: { id } });
  revalidar();
  return { ok: true };
}
