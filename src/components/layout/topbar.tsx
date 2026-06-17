"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BellRing, Moon, Sun, LogOut, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cerrarSesion } from "@/app/actions/auth";
import type { ItemNav } from "@/lib/nav";

interface TopbarProps {
  nav: ItemNav[];
  nombre: string;
  rol: string;
  alertasSinLeer: number;
}

export function Topbar({ nav, nombre, rol, alertasSinLeer }: TopbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [abierto, setAbierto] = useState(false);

  const activa = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        {/* Marca */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-lg fx-gradient-bg text-white font-bold">
            F
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            Farma<span className="text-fx-teal">Invex</span>
          </span>
        </Link>

        {/* Navegación horizontal (escritorio) */}
        <nav className="ml-2 hidden flex-1 items-center gap-1 lg:flex">
          {nav.map((item) => {
            const Icono = item.icono;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activa(item.href)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icono className="size-4" />
                {item.etiqueta}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Alertas */}
          <Link
            href="/alertas"
            className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Alertas"
          >
            <BellRing className="size-5" />
            {alertasSinLeer > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
                {alertasSinLeer > 99 ? "99+" : alertasSinLeer}
              </span>
            )}
          </Link>

          {/* Tema */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cambiar tema"
          >
            <Sun className="size-5 dark:hidden" />
            <Moon className="hidden size-5 dark:block" />
          </button>

          {/* Usuario */}
          <div className="ml-1 hidden items-center gap-2 sm:flex">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{nombre}</p>
              <Badge tono="primary" className="px-1.5 py-0 text-[10px]">{rol}</Badge>
            </div>
          </div>

          <form action={cerrarSesion}>
            <button
              type="submit"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-5" />
            </button>
          </form>

          {/* Menú móvil */}
          <button
            onClick={() => setAbierto((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Menú"
          >
            {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Navegación móvil */}
      {abierto && (
        <nav className="grid gap-1 border-t border-border px-4 py-3 lg:hidden">
          {nav.map((item) => {
            const Icono = item.icono;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAbierto(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  activa(item.href)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icono className="size-4" />
                {item.etiqueta}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
