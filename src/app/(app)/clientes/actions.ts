"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { requireRol } from "@/lib/session";
import {
  consultarDocumento,
  validarFormatoDocumento,
  type DatosDocumento,
} from "@/services/decolecta.service";
import type { ClienteLite } from "@/services/cliente.service";

const ROLES = ["ADMIN", "SUPERVISOR", "FARMACEUTICO"] as const;

export type BusquedaCliente =
  | { estado: "registrado"; cliente: ClienteLite }
  | { estado: "encontrado"; datos: DatosDocumento }
  | { estado: "no_encontrado"; error: string };

/**
 * Para el formulario de creación: primero comprueba si el documento YA está
 * registrado (avisa con su razón social); si no, lo consulta en Decolecta.
 */
export async function buscarDocumentoCliente(
  tipo: "RUC" | "DNI",
  numero: string,
): Promise<BusquedaCliente> {
  await requireRol([...ROLES]);
  const num = numero.trim();

  const errFormato = validarFormatoDocumento(tipo, num);
  if (errFormato) return { estado: "no_encontrado", error: errFormato };

  const existente = await prisma.cliente.findUnique({ where: { numeroDocumento: num } });
  if (existente) {
    return {
      estado: "registrado",
      cliente: {
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
  if (existe) return { ok: false, error: `El ${tipo} ${numero} ya está registrado: ${existe.nombre}.` };

  const consulta = await consultarDocumento(tipo, numero);

  let data: Prisma.ClienteCreateInput;
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
