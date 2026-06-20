import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Rol } from "@/generated/prisma/enums";

/**
 * Exige una sesión válida; redirige a /login si no la hay.
 *
 * Además verifica que el usuario del token (JWT) siga existiendo y activo en la
 * base de datos. Una sesión puede quedar "huérfana" si el usuario fue eliminado
 * o si la BD se resembró (los IDs cambian): en ese caso seguir adelante
 * provocaría violaciones de clave foránea al registrar autoría
 * (reportadoPorId / usuarioId). Invalidamos la sesión enviando a /login.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, activo: true },
  });
  if (!usuario || !usuario.activo) redirect("/login");

  return session;
}

/** Exige uno de los roles indicados; lanza si no tiene permiso. */
export async function requireRol(roles: Rol[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new Error("No tienes permiso para realizar esta acción.");
  }
  return session;
}
