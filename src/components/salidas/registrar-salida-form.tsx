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
import { LotesHistorialModal } from "./lotes-historial-modal";
import type { MedicamentoConLotes } from "@/services/inventario.service";

const inicial: EstadoMovimiento = {};
const TIPOS: TipoMovimientoStock[] = ["SALIDA", "TRASLADO", "BAJA"];

const MOTIVOS: Record<string, string[]> = {
  SALIDA: ["Dispensación", "Consumo interno", "Devolución a proveedor"],
  TRASLADO: ["Traslado entre establecimientos"],
  BAJA: ["Vencimiento", "Deterioro", "Contaminación", "Retiro sanitario", "Rotura / merma"],
};

interface Linea {
  key: number;
  medId: string;
  loteId: string;
  cantidad: string;
  motivo: string;
  documentoRef: string;
}

export function RegistrarSalidaForm({
  medicamentos,
  establecimientos,
  usuarios,
}: {
  medicamentos: MedicamentoConLotes[];
  establecimientos: string[];
  usuarios: string[];
}) {
  const [estado, action, pendiente] = useActionState(registrarSalida, inicial);
  const [tipo, setTipo] = useState<TipoMovimientoStock>("SALIDA");
  const nuevaLinea = (key: number): Linea => {
    const med = medicamentos[0];
    return {
      key,
      medId: med?.id ?? "",
      loteId: med?.lotes[0]?.id ?? "",
      cantidad: "",
      motivo: MOTIVOS.SALIDA[0],
      documentoRef: "",
    };
  };
  const [lineas, setLineas] = useState<Linea[]>(() => [nuevaLinea(1)]);
  const [nextKey, setNextKey] = useState(2);

  useEffect(() => {
    if (estado.error) toast.error(estado.error);
  }, [estado]);

  if (medicamentos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No hay medicamentos con stock disponible para registrar salidas.
      </p>
    );
  }

  const cambiarTipo = (nuevo: TipoMovimientoStock) => {
    setTipo(nuevo);
    setLineas((prev) => prev.map((l) => ({ ...l, motivo: MOTIVOS[nuevo][0] })));
  };

  const actualizar = (key: number, patch: Partial<Linea>) =>
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  // Al cambiar de medicamento, reselecciona su primer lote (FEFO).
  const cambiarMedicamento = (key: number, medId: string) => {
    const med = medicamentos.find((m) => m.id === medId);
    actualizar(key, { medId, loteId: med?.lotes[0]?.id ?? "" });
  };

  const agregar = () => {
    setLineas((prev) => [...prev, nuevaLinea(nextKey)]);
    setNextKey((k) => k + 1);
  };
  const quitar = (key: number) => setLineas((prev) => prev.filter((l) => l.key !== key));

  const evaluarLinea = (idx: number) => {
    const linea = lineas[idx];
    const med = medicamentos.find((m) => m.id === linea.medId);
    const lote = med?.lotes.find((l) => l.id === linea.loteId);
    if (!med || !lote) return { med, lote, disponible: 0, preview: null as ReturnType<typeof calcularNuevoStock> | null };
    const consumidoAntes = lineas
      .slice(0, idx)
      .filter((l) => l.loteId === linea.loteId)
      .reduce((s, l) => s + (Number(l.cantidad) || 0), 0);
    const disponible = lote.stock - consumidoAntes;
    const cant = Number(linea.cantidad);
    const preview = cant > 0 ? calcularNuevoStock(tipo, disponible, cant) : null;
    return { med, lote, disponible, preview };
  };

  const todoValido = lineas.every((l, i) => l.loteId && evaluarLinea(i).preview?.ok);

  const lineasJson = JSON.stringify(
    lineas.map((l) => ({
      loteId: l.loteId,
      cantidad: Number(l.cantidad) || 0,
      motivo: l.motivo,
      documentoRef: l.documentoRef,
    })),
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="lineas" value={lineasJson} />

      {/* Cabecera de la salida (compartida) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Label>Fecha</Label>
          <Input type="date" name="fecha" />
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
      </div>

      {/* Detalle: medicamento → lote, cantidad, motivo y documento por línea */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Detalle de la salida</Label>
          <span className="text-xs text-muted-foreground">{lineas.length} ítem(s)</span>
        </div>

        {lineas.map((linea, idx) => {
          const { med, disponible, preview } = evaluarLinea(idx);
          return (
            <div key={linea.key} className="rounded-lg border border-border p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                <div className="space-y-1.5 lg:col-span-3">
                  <Label>Medicamento</Label>
                  <Select
                    value={linea.medId}
                    onChange={(e) => cambiarMedicamento(linea.key, e.target.value)}
                  >
                    {medicamentos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5 lg:col-span-3">
                  <Label>Lote</Label>
                  <div className="flex gap-1">
                    <Select
                      className="flex-1"
                      value={linea.loteId}
                      onChange={(e) => actualizar(linea.key, { loteId: e.target.value })}
                    >
                      {med?.lotes.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.codigo} — stock {l.stock} · vence {l.vence}
                        </option>
                      ))}
                    </Select>
                    {med && (
                      <LotesHistorialModal
                        medicamento={med}
                        loteSeleccionado={linea.loteId}
                        onElegir={(loteId) => actualizar(linea.key, { loteId })}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 lg:col-span-1">
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

                <div className="space-y-1.5 lg:col-span-2">
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

                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Documento</Label>
                  <Input
                    value={linea.documentoRef}
                    onChange={(e) => actualizar(linea.key, { documentoRef: e.target.value })}
                    placeholder="N.º guía / acta"
                  />
                </div>

                <div className="flex lg:col-span-1 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => quitar(linea.key)}
                    disabled={lineas.length === 1}
                    aria-label="Quitar ítem"
                    className="grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Indicador en vivo por línea */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">
                  Disponible: <span className="font-medium text-foreground">{disponible}</span>
                </span>
                {(preview?.ok || preview === null) &&
                  (med?.lotes.find((l) => l.id === linea.loteId)?.estado === "CRITICO" ||
                    med?.lotes.find((l) => l.id === linea.loteId)?.estado === "PREVENTIVA") && (
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
        {pendiente ? "Registrando…" : `Registrar salida (${lineas.length} ítem/s)`}
      </Button>
    </form>
  );
}
