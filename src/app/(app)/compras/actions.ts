"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";
import { evaluarLotePorId } from "@/services/vencimientos.service";

const lineaCompraSchema = z.object({
  medicamentoId: z.string().min(1),
  numeroLote: z.string().trim().min(1),
  fechaFabricacion: z.string().min(1),
  fechaVencimiento: z.string().min(1),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  costoUnitario: z.coerce.number().min(0).default(0),
  proveedorId: z.string().optional(),
  documentoRef: z.string().trim().max(60).optional(),
});

const compraSchema = z.object({
  fecha: z.string().optional(),
  establecimientoId: z.string().optional(),
  lineas: z.array(lineaCompraSchema).min(1, "Agrega al menos un producto."),
});

export interface EstadoCompra {
  error?: string;
  ok?: boolean;
}

/** Convierte "yyyy-mm-dd" en Date (mediodía local para evitar desfase de zona). */
function parseFechaLocal(valor: string): Date {
  return new Date(`${valor}T12:00:00`);
}

export async function registrarCompra(
  _prev: EstadoCompra,
  formData: FormData,
): Promise<EstadoCompra> {
  const session = await requireRol(["ADMIN", "FARMACEUTICO", "SUPERVISOR"]);

  let lineasRaw: unknown;
  try {
    lineasRaw = JSON.parse(String(formData.get("lineas") ?? "[]"));
  } catch {
    return { error: "No se pudieron leer los productos de la compra." };
  }

  const parsed = compraSchema.safeParse({
    fecha: (formData.get("fecha") as string) || undefined,
    establecimientoId: (formData.get("establecimientoId") as string) || undefined,
    lineas: lineasRaw,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos de la compra inválidos." };
  }

  const { fecha, establecimientoId, lineas } = parsed.data;

  // Validación de fechas por línea.
  for (const l of lineas) {
    if (parseFechaLocal(l.fechaVencimiento) <= parseFechaLocal(l.fechaFabricacion)) {
      return { error: `Lote ${l.numeroLote}: el vencimiento debe ser posterior a la fabricación.` };
    }
  }

  const fechaMov = fecha ? parseFechaLocal(fecha) : undefined;
  const base = await prisma.lote.count();
  const creados: string[] = [];

  try {
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const codigo = `FI-LOT-${String(base + i + 1).padStart(4, "0")}`;
      const lote = await prisma.lote.create({
        data: {
          codigo,
          numeroLote: l.numeroLote,
          medicamentoId: l.medicamentoId,
          establecimientoId: establecimientoId || null,
          fechaFabricacion: parseFechaLocal(l.fechaFabricacion),
          fechaVencimiento: parseFechaLocal(l.fechaVencimiento),
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
        },
      });
      await prisma.movimientoFarmaceutico.create({
        data: {
          loteId: lote.id,
          tipo: "ENTRADA",
          cantidad: l.cantidad,
          motivo: "Compra / reposición",
          proveedorId: l.proveedorId || null, // proveedor POR LÍNEA (por lote)
          documentoRef: l.documentoRef || null, // documento POR LÍNEA
          usuarioId: session.user.id,
          ...(fechaMov ? { fecha: fechaMov } : {}),
        },
      });
      creados.push(lote.id);
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "Conflicto al generar el código de lote. Reintenta el registro." };
    }
    throw e;
  }

  // Motor de reglas por cada lote creado (semáforo + alertas/incidencias).
  for (const id of creados) await evaluarLotePorId(id);

  revalidatePath("/compras");
  revalidatePath("/lotes");
  revalidatePath("/inventario");
  revalidatePath("/dashboard");
  revalidatePath("/vencimientos");
  redirect("/compras");
}
