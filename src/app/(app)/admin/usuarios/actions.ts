"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";

const schema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().email("Correo inválido"),
  rol: z.enum(["ADMIN", "SUPERVISOR", "FARMACEUTICO", "OPERADOR"]),
  establecimientoId: z.string().optional(),
  activo: z.boolean().optional(),
});

export interface EstadoForm {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function guardarUsuario(_prev: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await requireRol(["ADMIN"]);
  const id = (formData.get("id") as string) || null;
  const password = (formData.get("password") as string) || "";

  const parsed = schema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    rol: formData.get("rol"),
    establecimientoId: (formData.get("establecimientoId") as string) || undefined,
    activo: formData.get("activo") === "on",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
    return { fieldErrors };
  }

  // Contraseña: obligatoria al crear; opcional al editar.
  if (!id && password.length < 6) {
    return { fieldErrors: { password: "Mínimo 6 caracteres." } };
  }
  if (id && password && password.length < 6) {
    return { fieldErrors: { password: "Mínimo 6 caracteres." } };
  }

  const base = {
    nombre: parsed.data.nombre,
    email: parsed.data.email,
    rol: parsed.data.rol,
    establecimientoId: parsed.data.establecimientoId || null,
    activo: Boolean(parsed.data.activo),
  };

  try {
    if (id) {
      await prisma.usuario.update({
        where: { id },
        data: password ? { ...base, passwordHash: await bcrypt.hash(password, 10) } : base,
      });
    } else {
      await prisma.usuario.create({
        data: { ...base, passwordHash: await bcrypt.hash(password, 10) },
      });
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { fieldErrors: { email: "Ya existe un usuario con ese correo." } };
    }
    throw e;
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function eliminarUsuario(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireRol(["ADMIN"]);
  if (session.user.id === id) {
    return { ok: false, error: "No puedes eliminar tu propio usuario." };
  }
  await prisma.usuario.delete({ where: { id } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}
