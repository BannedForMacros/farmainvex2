"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";

const schema = z.object({
  codigo: z.string().trim().min(1, "El código es obligatorio"),
  nombreComercial: z.string().trim().min(1, "El nombre comercial es obligatorio"),
  laboratorio: z.string().trim().min(1, "El laboratorio es obligatorio"),
  principioActivo: z.string().trim().optional(),
  presentacion: z.string().trim().optional(),
});

export interface EstadoForm {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function guardarMedicamento(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  await requireRol(["ADMIN", "FARMACEUTICO"]);

  const id = (formData.get("id") as string) || null;
  const parsed = schema.safeParse({
    codigo: formData.get("codigo"),
    nombreComercial: formData.get("nombreComercial"),
    laboratorio: formData.get("laboratorio"),
    principioActivo: (formData.get("principioActivo") as string) || undefined,
    presentacion: (formData.get("presentacion") as string) || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as string] = issue.message;
    }
    return { fieldErrors };
  }

  try {
    if (id) {
      await prisma.medicamento.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.medicamento.create({ data: parsed.data });
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { fieldErrors: { codigo: "Ya existe un medicamento con ese código." } };
    }
    throw e;
  }

  revalidatePath("/medicamentos");
  redirect("/medicamentos");
}

export async function eliminarMedicamento(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRol(["ADMIN", "FARMACEUTICO"]);

  const lotes = await prisma.lote.count({ where: { medicamentoId: id } });
  if (lotes > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: tiene ${lotes} lote(s) asociado(s).`,
    };
  }

  await prisma.medicamento.delete({ where: { id } });
  revalidatePath("/medicamentos");
  return { ok: true };
}
