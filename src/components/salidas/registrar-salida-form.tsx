"use client";

import { useActionState, useEffect, useState } from "react";
import { PackageMinus, Plus, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { registrarSalida, type EstadoMovimiento } from "@/app/(app)/lotes/movimiento-actions";
import { calcularNuevoStock, type TipoMovimientoStock } from "@/domain/inventario";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LoteOpcion } from "@/services/inventario.service";

const inicial: EstadoMovimiento = {};
const TIPOS: TipoMovimientoStock[] = ["SALIDA", "TRASLADO", "BAJA"];

const MOTIVOS: Record<string, string[]> = {
  SALIDA: ["Dispensación", "Consumo interno", "Devolución a proveedor"],
  TRASLADO: ["Traslado entre establecimientos"],
  BAJA: ["Vencimiento", "Deterioro", "Contaminación", "Retiro sanitario", "Rotura / merma"],
};

interface Linea {
  key: number;
  loteId: string;
  cantidad: string;
  motivo: string;
}

export function RegistrarSalidaForm({
  lotes,
  establecimientos,
  usuarios,
}: {
  lotes: LoteOpcion[];
  establecimientos: string[];
  usuarios: string[];
}) {
  const [estado, action, pendiente] = useActionState(registrarSalida, inicial);
  const [tipo, setTipo] = useState<TipoMovimientoStock>("SALIDA");
  const [lineas, setLineas] = useState<Linea[]>(() => [
    { key: 1, loteId: lotes[0]?.id ?? "", cantidad: "", motivo: MOTIVOS.SALIDA[0] },
  ]);
  const [nextKey, setNextKey] = useState(2);

  useEffect(() => {
    if (estado.error) toast.error(estado.error);
  }, [estado]);

  if (lotes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No hay lotes con stock disponible para registrar salidas.
      </p>
    );
  }

  const cambiarTipo = (nuevo: TipoMovimientoStock) => {
    setTipo(nuevo);
    setLineas((prev) => prev.map((l) => ({ ...l, motivo: MOTIVOS[nuevo][0] })));
  };

  const actualizar = (key: number, patch: Partial<Linea>) =>
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const agregar = () => {
    setLineas((prev) => [
      ...prev,
      { key: nextKey, loteId: lotes[0]?.id ?? "", cantidad: "", motivo: MOTIVOS[tipo][0] },
    ]);
    setNextKey((k) => k + 1);
  };

  const quitar = (key: number) => setLineas((prev) => prev.filter((l) => l.key !== key));

  // Stock disponible por línea, descontando líneas previas del mismo lote.
  const evaluarLinea = (idx: number) => {
    const linea = lineas[idx];
    const lote = lotes.find((l) => l.id === linea.loteId);
    if (!lote) return { lote, disponible: 0, preview: null as ReturnType<typeof calcularNuevoStock> | null };
    const consumidoAntes = lineas
      .slice(0, idx)
      .filter((l) => l.loteId === linea.loteId)
      .reduce((s, l) => s + (Number(l.cantidad) || 0), 0);
    const disponible = lote.stock - consumidoAntes;
    const cant = Number(linea.cantidad);
    const preview = cant > 0 ? calcularNuevoStock(tipo, disponible, cant) : null;
    return { lote, disponible, preview };
  };

  const todoValido = lineas.every((l, i) => {
    const { preview } = evaluarLinea(i);
    return l.loteId && preview?.ok;
  });

  const lineasJson = JSON.stringify(
    lineas.map((l) => ({ loteId: l.loteId, cantidad: Number(l.cantidad) || 0, motivo: l.motivo })),
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="lineas" value={lineasJson} />

      {/* Cabecera de la salida (compartida por todos los lotes) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo de salida</Label>
          <Select value={tipo} onChange={(e) => cambiarTipo(e.target.value as TipoMovimientoStock)}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_MOVIMIENTO[t]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Fecha del movimiento</Label>
          <Input type="date" name="fecha" />
          <p className="text-xs text-muted-foreground">Vacío = hoy.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Destino</Label>
          <Select name="destino" defaultValue="">
            <option value="">— Sin destino —</option>
            {establecimientos.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Recibido por</Label>
          <Select name="recibidoPor" defaultValue="">
            <option value="">— Sin especificar —</option>
            {usuarios.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Documento de referencia</Label>
          <Input name="documentoRef" placeholder="N.º de guía de remisión / acta de baja (opcional)" />
        </div>
      </div>

      {/* Líneas: un lote por fila */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Lotes de la salida</Label>
          <span className="text-xs text-muted-foreground">{lineas.length} lote(s)</span>
        </div>

        {lineas.map((linea, idx) => {
          const { lote, disponible, preview } = evaluarLinea(idx);
          return (
            <div key={linea.key} className="rounded-lg border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1.5fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label>Lote</Label>
                  <Select
                    value={linea.loteId}
                    onChange={(e) => actualizar(linea.key, { loteId: e.target.value })}
                  >
                    {lotes.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.codigo} · {l.medicamento} — stock {l.stock} · vence {l.vence}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    max={disponible}
                    value={linea.cantidad}
                    onChange={(e) => actualizar(linea.key, { cantidad: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Motivo</Label>
                  <Select
                    value={linea.motivo}
                    onChange={(e) => actualizar(linea.key, { motivo: e.target.value })}
                  >
                    <option value="">— Sin especificar —</option>
                    {MOTIVOS[tipo].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={() => quitar(linea.key)}
                  disabled={lineas.length === 1}
                  aria-label="Quitar lote"
                  className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Indicador por línea */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">
                  Disponible: <span className="font-medium text-foreground">{disponible}</span>
                </span>
                {(lote?.estado === "CRITICO" || lote?.estado === "PREVENTIVA") && (
                  <span className="inline-flex items-center gap-1 text-[color:var(--warning)]">
                    <TriangleAlert className="size-3" /> Próximo a vencer (FEFO)
                  </span>
                )}
                {preview?.ok && (
                  <span className="font-medium text-fx-blue">Quedarán {preview.nuevoStock}</span>
                )}
                {preview && !preview.ok && (
                  <span className="font-medium text-danger">{preview.error}</span>
                )}
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" onClick={agregar}>
          <Plus className="size-4" /> Agregar otro lote
        </Button>
      </div>

      <Button type="submit" disabled={pendiente || !todoValido}>
        <PackageMinus className="size-4" />
        {pendiente ? "Registrando…" : `Registrar salida (${lineas.length} lote/s)`}
      </Button>
    </form>
  );
}
