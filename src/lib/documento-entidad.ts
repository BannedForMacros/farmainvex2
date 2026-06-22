import type { DatosDocumento } from "@/services/decolecta.service";

/** Forma compacta de una entidad con documento (cliente o proveedor). */
export interface EntidadLite {
  id: string;
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  nombre: string;
}

/** Resultado de buscar un documento al crear una entidad. */
export type BusquedaEntidad =
  | { estado: "registrado"; entidad: EntidadLite }
  | { estado: "encontrado"; datos: DatosDocumento }
  | { estado: "no_encontrado"; error: string };

export interface ResultadoEntidad {
  ok: boolean;
  error?: string;
  entidad?: EntidadLite;
}

/** Acciones que necesita el formulario/selector genérico de entidad. */
export interface AccionesEntidad {
  buscar: (tipo: "RUC" | "DNI", numero: string) => Promise<BusquedaEntidad>;
  crear: (input: {
    tipoDocumento: "RUC" | "DNI";
    numeroDocumento: string;
    nombreManual?: string;
  }) => Promise<ResultadoEntidad>;
}
