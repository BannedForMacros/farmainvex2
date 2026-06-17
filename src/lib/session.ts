import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Rol } from "@/generated/prisma/enums";

/** Exige una sesión válida; redirige a /login si no la hay. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
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
