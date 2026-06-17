"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";

const schema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  tipo: z.enum(["FARMACIA", "BOTICA", "CENTRO_DISTRIBUCION", "CLINICA", "ALMACEN_MEDICO"]),
  direccion: z.string().trim().optional(),
});

export interface EstadoForm {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function guardarEstablecimiento(
  _prev: EstadoForm,
  formData: FormData,
): Promise<EstadoForm> {
  await requireRol(["ADMIN"]);
  const id = (formData.get("id") as string) || null;

  const parsed = schema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    direccion: (formData.get("direccion") as string) || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }

  if (id) {
    await prisma.establecimiento.update({ where: { id }, data: parsed.data });
  } else {
    await prisma.establecimiento.create({ data: parsed.data });
  }

  revalidatePath("/admin/establecimientos");
  redirect("/admin/establecimientos");
}

export async function eliminarEstablecimiento(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRol(["ADMIN"]);

  const [lotes, usuarios] = await Promise.all([
    prisma.lote.count({ where: { establecimientoId: id } }),
    prisma.usuario.count({ where: { establecimientoId: id } }),
  ]);
  if (lotes > 0 || usuarios > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: tiene ${lotes} lote(s) y ${usuarios} usuario(s) asociado(s).`,
    };
  }

  await prisma.establecimiento.delete({ where: { id } });
  revalidatePath("/admin/establecimientos");
  return { ok: true };
}
