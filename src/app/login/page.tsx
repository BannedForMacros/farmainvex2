import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

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
        <div className="flex gap-6 text-sm text-white/70">
          <span>🔴 Riesgo crítico</span>
          <span>🟡 Alerta preventiva</span>
          <span>🟢 Producto vigente</span>
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
