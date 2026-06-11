"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  BellRing,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  Pill,
  Boxes,
  Warehouse,
  ShoppingCart,
  PackageMinus,
  Users,
  Truck,
  CalendarClock,
  ShieldCheck,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { cerrarSesion } from "@/app/actions/auth";
import type { ItemNav, IconoNav } from "@/lib/nav";

// Resuelve la clave de icono (serializable) al componente de Lucide.
const ICONOS: Record<IconoNav, LucideIcon> = {
  panel: LayoutDashboard,
  medicamentos: Pill,
  lotes: Boxes,
  inventario: Warehouse,
  compras: ShoppingCart,
  salidas: PackageMinus,
  clientes: Users,
  proveedores: Truck,
  vencimientos: CalendarClock,
  alertas: BellRing,
  supervision: ShieldCheck,
  reportes: FileBarChart,
  admin: Settings,
};

interface AppShellProps {
  nav: ItemNav[];
  nombre: string;
  rol: string;
  alertasSinLeer: number;
  children: React.ReactNode;
}

export function AppShell({ nav, nombre, rol, alertasSinLeer, children }: AppShellProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  // Abierto por defecto en escritorio, cerrado en móvil. Se lee en el
  // inicializador (perezoso) para no disparar setState dentro de un efecto.
  const [abierto, setAbierto] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  const activa = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const cerrarEnMovil = () => {
    if (!window.matchMedia("(min-width: 1024px)").matches) setAbierto(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Backdrop (solo móvil) */}
      {abierto && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:transition-[width,opacity]",
          abierto
            ? "translate-x-0"
            : "-translate-x-full lg:w-0 lg:-translate-x-0 lg:overflow-hidden lg:border-r-0 lg:opacity-0",
        )}
      >
        {/* Marca */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg fx-gradient-bg font-bold text-white">
            F
          </span>
          <span className="whitespace-nowrap text-lg font-bold tracking-tight">
            Farma<span className="text-fx-teal">Invex</span>
          </span>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const Icono = ICONOS[item.icono];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={cerrarEnMovil}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activa(item.href)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icono className="size-5 shrink-0" />
                {item.etiqueta}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
              {nombre.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{nombre}</p>
              <Badge tono="primary" className="px-1.5 py-0 text-[10px]">
                {rol}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Columna de contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setAbierto((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mostrar u ocultar menú"
          >
            <Menu className="size-5" />
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/alertas"
              className="relative grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Alertas"
            >
              <BellRing className="size-5" />
              {alertasSinLeer > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground">
                  {alertasSinLeer > 99 ? "99+" : alertasSinLeer}
                </span>
              )}
            </Link>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Cambiar tema"
            >
              <Sun className="size-5 dark:hidden" />
              <Moon className="hidden size-5 dark:block" />
            </button>

            <form action={cerrarSesion}>
              <button
                type="submit"
                className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-danger/10 hover:text-danger"
                aria-label="Cerrar sesión"
              >
                <LogOut className="size-5" />
              </button>
            </form>
          </div>
        </header>

        {/* Contenido */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
