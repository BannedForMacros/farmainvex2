/**
 * Consulta de RUC/DNI vía la API Decolecta. Solo se ejecuta en el servidor;
 * el token vive en process.env.DECOLECTA_API y nunca se expone al cliente.
 */
const BASE = "https://api.decolecta.com/v1";

export interface DatosDocumento {
  tipoDocumento: "RUC" | "DNI";
  numeroDocumento: string;
  nombre: string;
  direccion?: string;
  estado?: string;
  condicion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
}

export type ResultadoConsulta =
  | { ok: true; datos: DatosDocumento }
  | { ok: false; error: string; noEncontrado?: boolean };

/** Valida el formato del documento antes de gastar una consulta. */
export function validarFormatoDocumento(tipo: "RUC" | "DNI", numero: string): string | null {
  if (tipo === "RUC" && !/^\d{11}$/.test(numero)) return "El RUC debe tener 11 dígitos.";
  if (tipo === "DNI" && !/^\d{8}$/.test(numero)) return "El DNI debe tener 8 dígitos.";
  return null;
}

export async function consultarDocumento(
  tipo: "RUC" | "DNI",
  numeroRaw: string,
): Promise<ResultadoConsulta> {
  const numero = numeroRaw.trim();
  const errFormato = validarFormatoDocumento(tipo, numero);
  if (errFormato) return { ok: false, error: errFormato };

  const token = process.env.DECOLECTA_API;
  if (!token) {
    return {
      ok: false,
      error: "La consulta automática no está configurada. Ingresa el nombre manualmente.",
    };
  }

  const url =
    tipo === "RUC"
      ? `${BASE}/sunat/ruc?numero=${numero}`
      : `${BASE}/reniec/dni?numero=${numero}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "No se pudo conectar con el servicio de consulta." };
  }

  if (res.status === 404 || res.status === 422 || res.status === 400) {
    return { ok: false, error: "Documento no encontrado.", noEncontrado: true };
  }
  if (!res.ok) return { ok: false, error: `Error en la consulta (HTTP ${res.status}).` };

  const json = await res.json().catch(() => null);
  if (!json) return { ok: false, error: "Respuesta inválida del servicio." };

  if (tipo === "RUC") {
    if (!json.razon_social) return { ok: false, error: "Documento no encontrado.", noEncontrado: true };
    return {
      ok: true,
      datos: {
        tipoDocumento: "RUC",
        numeroDocumento: numero,
        nombre: json.razon_social,
        direccion: json.direccion ?? undefined,
        estado: json.estado ?? undefined,
        condicion: json.condicion ?? undefined,
        distrito: json.distrito ?? undefined,
        provincia: json.provincia ?? undefined,
        departamento: json.departamento ?? undefined,
      },
    };
  }

  const nombre =
    json.full_name ??
    [json.first_last_name, json.second_last_name, json.first_name].filter(Boolean).join(" ");
  if (!nombre) return { ok: false, error: "Documento no encontrado.", noEncontrado: true };
  return {
    ok: true,
    datos: { tipoDocumento: "DNI", numeroDocumento: numero, nombre },
  };
}
