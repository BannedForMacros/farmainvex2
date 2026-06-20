import { prisma } from "@/lib/prisma";

export interface ClienteLite {
  id: string;
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  nombre: string;
}

/** Lista de clientes activos (opcionalmente filtrada por nombre o documento). */
export async function listarClientes(busqueda?: string) {
  const q = busqueda?.trim();
  return prisma.cliente.findMany({
    where: q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" } },
            { numeroDocumento: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { nombre: "asc" },
  });
}

/** Clientes activos en forma compacta para selectores. */
export async function clientesParaSelector(): Promise<ClienteLite[]> {
  const cs = await prisma.cliente.findMany({
    where: { activo: true },
    select: { id: true, tipoDocumento: true, numeroDocumento: true, nombre: true },
    orderBy: { nombre: "asc" },
  });
  return cs as ClienteLite[];
}

export async function obtenerCliente(id: string) {
  return prisma.cliente.findUnique({
    where: { id },
    include: { _count: { select: { movimientos: true } } },
  });
}
