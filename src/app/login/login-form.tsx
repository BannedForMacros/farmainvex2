"use client";

import { useActionState } from "react";
import { AlertCircle, LogIn } from "lucide-react";
import { iniciarSesion, type EstadoLogin } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const estadoInicial: EstadoLogin = {};

export function LoginForm() {
  const [estado, formAction, pendiente] = useActionState(iniciarSesion, estadoInicial);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="usuario@farmainvex.pe"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      {estado.error && (
        <p className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="size-4 shrink-0" />
          {estado.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pendiente}>
        <LogIn className="size-4" />
        {pendiente ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
