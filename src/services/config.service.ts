import { prisma } from "@/lib/prisma";
import { UMBRALES_POR_DEFECTO, type UmbralesVencimiento } from "@/domain/vencimiento";

const CLAVE_PREVENTIVA = "DIAS_ALERTA_PREVENTIVA";
const CLAVE_CRITICA = "DIAS_ALERTA_CRITICA";

/** Lee los umbrales de vencimiento desde ConfigRegla, con respaldo por defecto. */
export async function obtenerUmbrales(): Promise<UmbralesVencimiento> {
  const filas = await prisma.configRegla.findMany({
    where: { clave: { in: [CLAVE_PREVENTIVA, CLAVE_CRITICA] } },
  });
  const mapa = new Map(filas.map((f) => [f.clave, Number(f.valor)]));
  return {
    diasPreventiva: mapa.get(CLAVE_PREVENTIVA) ?? UMBRALES_POR_DEFECTO.diasPreventiva,
    diasCritico: mapa.get(CLAVE_CRITICA) ?? UMBRALES_POR_DEFECTO.diasCritico,
  };
}
