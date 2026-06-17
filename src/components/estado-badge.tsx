import { CircleCheck, TriangleAlert, CircleAlert, type LucideIcon } from "lucide-react";
import type { EstadoVencimiento } from "@/domain/vencimiento";
import { SEMAFORO } from "@/domain/vencimiento";
import { Badge } from "@/components/ui/badge";

/** Icono de Lucide por estado de vencimiento (reemplaza los antiguos emojis). */
export const ICONO_ESTADO: Record<EstadoVencimiento, LucideIcon> = {
  VIGENTE: CircleCheck,
  PREVENTIVA: TriangleAlert,
  CRITICO: CircleAlert,
};

/** Badge con icono + etiqueta para el semáforo sanitario. */
export function EstadoBadge({
  estado,
  className,
}: {
  estado: EstadoVencimiento;
  className?: string;
}) {
  const Icono = ICONO_ESTADO[estado];
  const { etiqueta, tono } = SEMAFORO[estado];
  return (
    <Badge tono={tono} className={className}>
      <Icono className="size-3.5" />
      {etiqueta}
    </Badge>
  );
}
