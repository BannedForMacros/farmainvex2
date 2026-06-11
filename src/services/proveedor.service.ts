import { prisma } from "@/lib/prisma";
import type { EntidadLite } from "@/lib/documento-entidad";

/** Lista de proveedores activos (opcionalmente filtrada por nombre o documento). */
export async function listarProveedores(busqueda?: string) {
  const q = busqueda?.trim();
  return prisma.proveedor.findMany({
    where: {
      activo: true,
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { numeroDocumento: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { nombre: "asc" },
  });
}

/** Proveedores activos en forma compacta para selectores. */
export async function proveedoresParaSelector(): Promise<EntidadLite[]> {
  const ps = await prisma.proveedor.findMany({
    where: { activo: true },
    select: { id: true, tipoDocumento: true, numeroDocumento: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
  return ps as EntidadLite[];
}

export async function obtenerProveedor(id: string) {
  return prisma.proveedor.findUnique({
    where: { id },
    include: { _count: { select: { movimientos: true } } },
  });
}
