import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  obtenerDatosReporte,
  generarPDF,
  generarExcel,
  esTipoReporteValido,
  parseFecha,
} from "@/services/reportes.service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Sin permiso para generar reportes" }, { status: 403 });
  }

  const tipo = req.nextUrl.searchParams.get("tipo");
  const formato = req.nextUrl.searchParams.get("formato") ?? "pdf";
  if (!esTipoReporteValido(tipo)) {
    return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });
  }

  const filtro = {
    desde: parseFecha(req.nextUrl.searchParams.get("desde")),
    hasta: parseFecha(req.nextUrl.searchParams.get("hasta")),
  };
  const datos = await obtenerDatosReporte(tipo, filtro);

  if (formato === "excel") {
    const buffer = await generarExcel(datos);
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="farmainvex-${tipo}.xlsx"`,
      },
    });
  }

  const buffer = generarPDF(datos);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="farmainvex-${tipo}.pdf"`,
    },
  });
}
