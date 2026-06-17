"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";
import { recalcularVencimientos } from "@/services/vencimientos.service";

const schema = z.object({
  preventiva: z.coerce.number().int().min(1, "Debe ser un entero positivo"),
  critica: z.coerce.number().int().min(1, "Debe ser un entero positivo"),
});

export interface EstadoUmbrales {
  error?: string;
  ok?: boolean;
}

export async function guardarUmbrales(
  _prev: EstadoUmbrales,
  formData: FormData,
): Promise<EstadoUmbrales> {
  await requireRol(["ADMIN"]);

  const parsed = schema.safeParse({
    preventiva: formData.get("preventiva"),
    critica: formData.get("critica"),
  });
  if (!parsed.success) return { error: "Valores inválidos. Usa números enteros." };
  if (parsed.data.critica >= parsed.data.preventiva) {
    return { error: "El umbral crítico debe ser menor que el preventivo." };
  }

  await prisma.configRegla.upsert({
    where: { clave: "DIAS_ALERTA_PREVENTIVA" },
    update: { valor: String(parsed.data.preventiva) },
    create: {
      clave: "DIAS_ALERTA_PREVENTIVA",
      valor: String(parsed.data.preventiva),
      descripcion: "Días para alerta preventiva 🟡",
    },
  });
  await prisma.configRegla.upsert({
    where: { clave: "DIAS_ALERTA_CRITICA" },
    update: { valor: String(parsed.data.critica) },
    create: {
      clave: "DIAS_ALERTA_CRITICA",
      valor: String(parsed.data.critica),
      descripcion: "Días para riesgo crítico 🔴",
    },
  });

  // Aplicar de inmediato a todos los lotes.
  await recalcularVencimientos();

  revalidatePath("/admin");
  revalidatePath("/vencimientos");
  revalidatePath("/dashboard");
  return { ok: true };
}
