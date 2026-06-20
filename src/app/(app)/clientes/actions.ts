"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRol } from "@/lib/session";
import {
  consultarDocumento,
  validarFormatoDocumento,
  type ResultadoConsulta,
} from "@/services/decolecta.service";
import type { ClienteLite } from "@/services/cliente.service";

const ROLES = ["ADMIN", "SUPERVISOR", "FARMACEUTICO"] as const;

/** Consulta el documento en Decolecta (para el formulario de creación). */
export async function buscarDocumentoCliente(
  tipo: "RUC" | "DNI",
  numero: string,
): Promise<ResultadoConsulta> {
  await requireRol([...ROLES]);
  return consultarDocumento(tipo, numero);
}

export interface ResultadoCliente {
  ok: boolean;
  error?: string;
  cliente?: ClienteLite;
}

/**
 * Crea un cliente. Reconsulta Decolecta como fuente de verdad: si el documento
 * existe, guarda los datos OFICIALES (no editables); si no, exige nombre manual.
 */
export async function crearCliente(input: {
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  nombreManual?: string;
}): Promise<ResultadoCliente> {
  await requireRol([...ROLES]);

  const tipo = input.tipoDocumento;
  const numero = input.numeroDocumento.trim();
  const errFormato = validarFormatoDocumento(tipo, numero);
  if (errFormato) return { ok: false, error: errFormato };

  const existe = await prisma.cliente.findUnique({ where: { numeroDocumento: numero } });
  if (existe) return { ok: false, error: "Ya existe un cliente con ese documento." };

  const consulta = await consultarDocumento(tipo, numero);

  let data;
  if (consulta.ok) {
    data = {
      tipoDocumento: tipo,
      numeroDocumento: numero,
      nombre: consulta.datos.nombre,
      direccion: consulta.datos.direccion ?? null,
      estado: consulta.datos.estado ?? null,
      condicion: consulta.datos.condicion ?? null,
      distrito: consulta.datos.distrito ?? null,
      provincia: consulta.datos.provincia ?? null,
      departamento: consulta.datos.departamento ?? null,
      origenDatos: "API" as const,
    };
  } else {
    const nombre = (input.nombreManual ?? "").trim();
    if (!nombre) return { ok: false, error: consulta.error };
    data = {
      tipoDocumento: tipo,
      numeroDocumento: numero,
      nombre,
      origenDatos: "MANUAL" as const,
    };
  }

  const cliente = await prisma.cliente.create({ data });
  revalidatePath("/clientes");
  return {
    ok: true,
    cliente: {
      id: cliente.id,
      tipoDocumento: cliente.tipoDocumento as "RUC" | "DNI",
      numeroDocumento: cliente.numeroDocumento,
      nombre: cliente.nombre,
    },
  };
}

/** Edición limitada: el nombre solo es editable en clientes MANUAL; siempre el estado activo. */
export async function editarCliente(
  id: string,
  input: { nombre?: string; activo: boolean },
): Promise<{ ok: boolean; error?: string }> {
  await requireRol([...ROLES]);
  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) return { ok: false, error: "Cliente no encontrado." };

  const data: { activo: boolean; nombre?: string } = { activo: input.activo };
  if (cliente.origenDatos === "MANUAL" && input.nombre?.trim()) {
    data.nombre = input.nombre.trim();
  }
  await prisma.cliente.update({ where: { id }, data });
  revalidatePath("/clientes");
  return { ok: true };
}

export async function eliminarCliente(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRol(["ADMIN", "SUPERVISOR"]);
  const ventas = await prisma.movimientoFarmaceutico.count({ where: { clienteId: id } });
  if (ventas > 0) {
    return { ok: false, error: "Tiene ventas registradas. Desactívalo en lugar de eliminarlo." };
  }
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clientes");
  return { ok: true };
}
