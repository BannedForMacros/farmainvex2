import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/layout/app-shell";
import { navParaRol } from "@/lib/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Valida la sesión contra la BD (no solo el JWT): si el usuario ya no existe
  // (p. ej. tras un re-seed), redirige a /login de forma consistente con las
  // server actions, evitando navegar con una sesión huérfana.
  const session = await requireSession();

  const alertasSinLeer = await prisma.alerta.count({
    where: { leida: false, resuelta: false },
  });

  return (
    <AppShell
      nav={navParaRol(session.user.role)}
      nombre={session.user.name ?? "Usuario"}
      rol={session.user.role}
      alertasSinLeer={alertasSinLeer}
    >
      {children}
    </AppShell>
  );
}
