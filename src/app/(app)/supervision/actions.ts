"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";
import type { EstadoIncidencia } from "@/generated/prisma/enums";

function revalidar() {
  revalidatePath("/supervision");
  revalidatePath("/dashboard");
}

export async function cambiarEstadoIncidencia(
  id: string,
  estado: EstadoIncidencia,
): Promise<{ ok: boolean }> {
  await requireRol(["ADMIN", "SUPERVISOR"]);
  await prisma.incidencia.update({ where: { id }, data: { estado } });
  revalidar();
  return { ok: true };
}

const schema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio"),
  descripcion: z.string().trim().optional(),
  severidad: z.enum(["INFO", "PREVENTIVA", "CRITICA"]),
  loteId: z.string().optional(),
});

export interface EstadoForm {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function crearIncidencia(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const session = await requireRol(["ADMIN", "SUPERVISOR"]);

  const parsed = schema.safeParse({
    titulo: formData.get("titulo"),
    descripcion: (formData.get("descripcion") as string) || undefined,
    severidad: formData.get("severidad"),
    loteId: (formData.get("loteId") as string) || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }

  const n = await prisma.incidencia.count();
  await prisma.incidencia.create({
    data: {
      codigo: `FI-INC-${String(n + 1).padStart(4, "0")}`,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion,
      severidad: parsed.data.severidad,
      loteId: parsed.data.loteId || null,
      reportadoPorId: session.user.id,
      evidencias: [],
    },
  });

  revalidar();
  redirect("/supervision");
}
