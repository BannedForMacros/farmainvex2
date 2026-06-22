import type { Rol } from "@/generated/prisma/enums";

/**
 * Clave de icono (string serializable). El componente de icono se resuelve en
 * el cliente — NO se puede pasar un componente de Lucide a través de la
 * frontera Server → Client Component.
 */
export type IconoNav =
  | "panel"
  | "medicamentos"
  | "lotes"
  | "inventario"
  | "salidas"
  | "clientes"
  | "proveedores"
  | "vencimientos"
  | "alertas"
  | "supervision"
  | "reportes"
  | "admin";

export interface ItemNav {
  href: string;
  etiqueta: string;
  icono: IconoNav;
  roles?: Rol[]; // si se omite, visible para todos
}

/** Navegación principal de FarmaInvex (topbar). Filtrada por rol. */
export const NAV: ItemNav[] = [
  { href: "/dashboard", etiqueta: "Panel", icono: "panel" },
  { href: "/medicamentos", etiqueta: "Medicamentos", icono: "medicamentos" },
  { href: "/lotes", etiqueta: "Lotes", icono: "lotes" },
  { href: "/inventario", etiqueta: "Inventario", icono: "inventario" },
  { href: "/salidas", etiqueta: "Salidas", icono: "salidas" },
  { href: "/clientes", etiqueta: "Clientes", icono: "clientes", roles: ["ADMIN", "SUPERVISOR", "FARMACEUTICO"] },
  { href: "/proveedores", etiqueta: "Proveedores", icono: "proveedores", roles: ["ADMIN", "SUPERVISOR", "FARMACEUTICO"] },
  { href: "/vencimientos", etiqueta: "Vencimientos", icono: "vencimientos" },
  { href: "/alertas", etiqueta: "Alertas", icono: "alertas" },
  { href: "/supervision", etiqueta: "Supervisión", icono: "supervision", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/reportes", etiqueta: "Reportes", icono: "reportes", roles: ["ADMIN", "SUPERVISOR"] },
  { href: "/admin", etiqueta: "Administración", icono: "admin", roles: ["ADMIN"] },
];

export function navParaRol(rol: Rol): ItemNav[] {
  return NAV.filter((item) => !item.roles || item.roles.includes(rol));
}
