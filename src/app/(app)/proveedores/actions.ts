"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { requireRol } from "@/lib/session";
import { consultarDocumento, validarFormatoDocumento } from "@/services/decolecta.service";
import type { BusquedaEntidad, ResultadoEntidad } from "@/lib/documento-entidad";

const ROLES = ["ADMIN", "SUPERVISOR", "FARMACEUTICO"] as const;

/** Busca el documento: avisa si ya está registrado; si no, lo consulta en Decolecta. */
export async function buscarDocumentoProveedor(
  tipo: "RUC" | "DNI",
  numero: string,
): Promise<BusquedaEntidad> {
  await requireRol([...ROLES]);
  const num = numero.trim();

  const errFormato = validarFormatoDocumento(tipo, num);
  if (errFormato) return { estado: "no_encontrado", error: errFormato };

  const existente = await prisma.proveedor.findUnique({ where: { numeroDocumento: num } });
  if (existente) {
    return {
      estado: "registrado",
      entidad: {
        id: existente.id,
        tipoDocumento: existente.tipoDocumento as "RUC" | "DNI",
        numeroDocumento: existente.numeroDocumento,
        nombre: existente.nombre,
      },
    };
  }

  const consulta = await consultarDocumento(tipo, num);
  if (consulta.ok) return { estado: "encontrado", datos: consulta.datos };
  return { estado: "no_encontrado", error: consulta.error };
}

/** Crea un proveedor. Reconsulta Decolecta como fuente de verdad (datos oficiales no editables). */
export async function crearProveedor(input: {
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  nombreManual?: string;
}): Promise<ResultadoEntidad> {
  await requireRol([...ROLES]);

  const tipo = input.tipoDocumento;
  const numero = input.numeroDocumento.trim();
  const errFormato = validarFormatoDocumento(tipo, numero);
  if (errFormato) return { ok: false, error: errFormato };

  const existe = await prisma.proveedor.findUnique({ where: { numeroDocumento: numero } });
  if (existe) return { ok: false, error: `El ${tipo} ${numero} ya está registrado: ${existe.nombre}.` };

  const consulta = await consultarDocumento(tipo, numero);

  let data: Prisma.ProveedorCreateInput;
  if (consulta.ok) {
    const d = consulta.datos;
    data = {
      tipoDocumento: tipo,
      numeroDocumento: numero,
      nombre: d.nombre,
      direccion: d.direccion ?? null,
      estado: d.estado ?? null,
      condicion: d.condicion ?? null,
      distrito: d.distrito ?? null,
      provincia: d.provincia ?? null,
      departamento: d.departamento ?? null,
      origenDatos: "API",
    };
  } else {
    const nombre = (input.nombreManual ?? "").trim();
    if (!nombre) return { ok: false, error: consulta.error };
    data = { tipoDocumento: tipo, numeroDocumento: numero, nombre, origenDatos: "MANUAL" };
  }

  try {
    const proveedor = await prisma.proveedor.create({ data });
    revalidatePath("/proveedores");
    return {
      ok: true,
      entidad: {
        id: proveedor.id,
        tipoDocumento: proveedor.tipoDocumento as "RUC" | "DNI",
        numeroDocumento: proveedor.numeroDocumento,
        nombre: proveedor.nombre,
      },
    };
  } catch (e) {
    // Carrera: dos altas simultáneas del mismo documento (unique numeroDocumento).
    if ((e as { code?: string })?.code === "P2002") {
      return { ok: false, error: `El ${tipo} ${numero} ya está registrado.` };
    }
    throw e;
  }
}

export async function editarProveedor(
  id: string,
  input: { nombre?: string; activo: boolean },
): Promise<{ ok: boolean; error?: string }> {
  await requireRol([...ROLES]);
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) return { ok: false, error: "Proveedor no encontrado." };

  const data: { activo: boolean; nombre?: string } = { activo: input.activo };
  if (proveedor.origenDatos === "MANUAL" && input.nombre?.trim()) {
    data.nombre = input.nombre.trim();
  }
  await prisma.proveedor.update({ where: { id }, data });
  revalidatePath("/proveedores");
  return { ok: true };
}

export async function eliminarProveedor(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRol(["ADMIN", "SUPERVISOR"]);
  const entradas = await prisma.movimientoFarmaceutico.count({ where: { proveedorId: id } });
  if (entradas > 0) {
    return { ok: false, error: "Tiene entradas registradas. Desactívalo en lugar de eliminarlo." };
  }
  await prisma.proveedor.delete({ where: { id } });
  revalidatePath("/proveedores");
  return { ok: true };
}
