import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { navParaRol } from "@/lib/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const alertasSinLeer = await prisma.alerta.count({
    where: { leida: false, resuelta: false },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        nav={navParaRol(session.user.role)}
        nombre={session.user.name ?? "Usuario"}
        rol={session.user.role}
        alertasSinLeer={alertasSinLeer}
      />
      <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
