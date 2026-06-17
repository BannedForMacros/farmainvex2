import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/app-shell";
import { navParaRol } from "@/lib/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
