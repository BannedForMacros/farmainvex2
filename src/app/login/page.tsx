import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleAlert, TriangleAlert, CircleCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const session = await auth();
  // Solo redirige si la sesión es válida EN BD (no solo el JWT). Así una sesión
  // huérfana (usuario borrado / re-seed) no provoca un bucle login↔dashboard:
  // se muestra el formulario para volver a iniciar sesión.
  if (session?.user?.id) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: session.user.id },
      select: { id: true, activo: true },
    });
    if (usuario?.activo) redirect("/dashboard");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden fx-gradient-bg p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-xl font-bold backdrop-blur">
            F
          </span>
          <span className="text-2xl font-bold tracking-tight">FarmaInvex</span>
        </div>
        <div className="space-y-4">
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Trazabilidad, control de lotes y monitoreo de vencimientos en un solo lugar.
          </h1>
          <p className="max-w-md text-white/80">
            Supervisión sanitaria automatizada con alertas inteligentes en tiempo real para
            establecimientos farmacéuticos.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-white/80">
          <span className="flex items-center gap-1.5">
            <CircleAlert className="size-4" /> Riesgo crítico
          </span>
          <span className="flex items-center gap-1.5">
            <TriangleAlert className="size-4" /> Alerta preventiva
          </span>
          <span className="flex items-center gap-1.5">
            <CircleCheck className="size-4" /> Producto vigente
          </span>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center gap-2 lg:hidden">
              <span className="grid h-9 w-9 place-items-center rounded-lg fx-gradient-bg text-white font-bold">
                F
              </span>
              <span className="text-xl font-bold">
                Farma<span className="text-fx-teal">Invex</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold">Bienvenido</h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
