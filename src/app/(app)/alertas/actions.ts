"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

function revalidar() {
  revalidatePath("/alertas");
  revalidatePath("/dashboard");
}

export async function marcarLeida(id: string): Promise<{ ok: boolean }> {
  await requireSession();
  await prisma.alerta.update({ where: { id }, data: { leida: true } });
  revalidar();
  return { ok: true };
}

export async function resolverAlerta(id: string): Promise<{ ok: boolean }> {
  await requireSession();
  await prisma.alerta.update({ where: { id }, data: { resuelta: true, leida: true } });
  revalidar();
  return { ok: true };
}
