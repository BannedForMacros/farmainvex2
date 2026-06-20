import type {
  EstadoLote,
  TipoMovimiento,
  TipoEstablecimiento,
  TipoAlerta,
  Severidad,
  EstadoIncidencia,
  TipoDocumento,
} from "@/generated/prisma/enums";

export const ETIQUETA_ESTADO_LOTE: Record<EstadoLote, string> = {
  VIGENTE: "Vigente",
  PROXIMO_VENCER: "Próximo a vencer",
  VENCIDO: "Vencido",
  OBSERVADO: "Observado",
  RETIRADO: "Retirado",
};

export const ETIQUETA_TIPO_MOVIMIENTO: Record<TipoMovimiento, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  VENTA: "Venta",
  TRASLADO: "Traslado",
  AJUSTE: "Ajuste",
  BAJA: "Baja",
};

export const ETIQUETA_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  RUC: "RUC",
  DNI: "DNI",
};

export const ETIQUETA_TIPO_ESTABLECIMIENTO: Record<TipoEstablecimiento, string> = {
  FARMACIA: "Farmacia",
  BOTICA: "Botica",
  CENTRO_DISTRIBUCION: "Centro de distribución",
  CLINICA: "Clínica",
  ALMACEN_MEDICO: "Almacén médico",
};

export const ETIQUETA_TIPO_ALERTA: Record<TipoAlerta, string> = {
  PROXIMO_VENCER: "Próximo a vencer",
  LOTE_OBSERVADO: "Lote observado",
  RIESGO_ALMACENAMIENTO: "Riesgo de almacenamiento",
  INCIDENCIA_SANITARIA: "Incidencia sanitaria",
  PRODUCTO_VENCIDO: "Producto vencido",
};

export const ETIQUETA_SEVERIDAD: Record<Severidad, string> = {
  INFO: "Informativa",
  PREVENTIVA: "Preventiva",
  CRITICA: "Crítica",
};

export const ETIQUETA_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = {
  ABIERTA: "Abierta",
  EN_SEGUIMIENTO: "En seguimiento",
  EN_VALIDACION: "En validación",
  RESUELTA: "Resuelta",
  CERRADA: "Cerrada",
};

export const TONO_SEVERIDAD: Record<Severidad, "primary" | "warning" | "danger"> = {
  INFO: "primary",
  PREVENTIVA: "warning",
  CRITICA: "danger",
};
