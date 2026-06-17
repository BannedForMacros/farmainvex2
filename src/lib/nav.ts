import {
  LayoutDashboard,
  Pill,
  Boxes,
  CalendarClock,
  BellRing,
  ShieldCheck,
  FileBarChart,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Rol } from "@/generated/prisma/enums";

export interface ItemNav {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  roles?: Rol[]; // si se omite, visible para todos
}

/** Navegación principal de FarmaInvex (topbar). Filtrada por rol. */
export const NAV: ItemNav[] = [
  { href: "/dashboard", etiqueta: "Panel", icono: LayoutDashboard },
  { href: "/medicamentos", etiqueta: "Medicamentos", icono: Pill },
  { href: "/lotes", etiqueta: "Lotes", icono: Boxes },
  { href: "/vencimientos", etiqueta: "Vencimientos", icono: CalendarClock },
  { href: "/alertas", etiqueta: "Alertas", icono: BellRing },
  {
    href: "/supervision",
    etiqueta: "Supervisión",
    icono: ShieldCheck,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    href: "/reportes",
    etiqueta: "Reportes",
    icono: FileBarChart,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  { href: "/admin", etiqueta: "Administración", icono: Settings, roles: ["ADMIN"] },
];

export function navParaRol(rol: Rol): ItemNav[] {
  return NAV.filter((item) => !item.roles || item.roles.includes(rol));
}
