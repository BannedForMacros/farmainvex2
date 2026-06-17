"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { guardarUsuario, type EstadoForm } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Rol } from "@/generated/prisma/enums";

const ROLES: { valor: Rol; etiqueta: string }[] = [
  { valor: "ADMIN", etiqueta: "Administrador" },
  { valor: "SUPERVISOR", etiqueta: "Supervisor" },
  { valor: "FARMACEUTICO", etiqueta: "Farmacéutico" },
  { valor: "OPERADOR", etiqueta: "Operador" },
];

interface UsuarioFormProps {
  establecimientos: { id: string; nombre: string }[];
  usuario?: {
    id: string;
    nombre: string;
    email: string;
    rol: Rol;
    establecimientoId: string | null;
    activo: boolean;
  };
}

const inicial: EstadoForm = {};

export function UsuarioForm({ establecimientos, usuario }: UsuarioFormProps) {
  const [estado, action, pendiente] = useActionState(guardarUsuario, inicial);
  const err = estado.fieldErrors ?? {};
  const editando = Boolean(usuario);

  return (
    <form action={action} className="space-y-4">
      {usuario && <input type="hidden" name="id" value={usuario.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre *</Label>
          <Input name="nombre" defaultValue={usuario?.nombre} required />
          {err.nombre && <p className="text-xs text-danger">{err.nombre}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Correo *</Label>
          <Input type="email" name="email" defaultValue={usuario?.email} required />
          {err.email && <p className="text-xs text-danger">{err.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>{editando ? "Nueva contraseña (opcional)" : "Contraseña *"}</Label>
          <Input
            type="password"
            name="password"
            placeholder={editando ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
          />
          {err.password && <p className="text-xs text-danger">{err.password}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Rol *</Label>
          <Select name="rol" defaultValue={usuario?.rol ?? "OPERADOR"} required>
            {ROLES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.etiqueta}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Establecimiento</Label>
          <Select name="establecimientoId" defaultValue={usuario?.establecimientoId ?? ""}>
            <option value="">— Sin asignar —</option>
            {establecimientos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={usuario ? usuario.activo : true}
          className="size-4 rounded border-input"
        />
        Usuario activo (puede iniciar sesión)
      </label>

      {estado.error && <p className="text-sm text-danger">{estado.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pendiente}>
          <Save className="size-4" />
          {pendiente ? "Guardando…" : "Guardar"}
        </Button>
        <Link href="/admin/usuarios" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
