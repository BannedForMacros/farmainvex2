import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { recalcularVencimientos } from "@/services/vencimientos.service";

/**
 * Recálculo del monitoreo de vencimientos (sección V.3 / VII).
 *
 * Modo local: se llama desde el botón "Recalcular" del panel (POST) y al
 * cargar el dashboard. Para producción, este mismo endpoint puede conectarse
 * a Vercel Cron o a un cron del sistema enviando un encabezado de autorización.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultado = await recalcularVencimientos();
  return NextResponse.json(resultado);
}
