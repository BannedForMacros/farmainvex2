"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRightLeft, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  registrarMovimiento,
  type EstadoMovimiento,
} from "@/app/(app)/lotes/movimiento-actions";
import { calcularNuevoStock, esSalida, type TipoMovimientoStock } from "@/domain/inventario";
import { ETIQUETA_TIPO_MOVIMIENTO } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EstadoBadge } from "@/components/estado-badge";
import { EntidadSelector } from "@/components/documento/entidad-selector";
import { buscarDocumentoProveedor, crearProveedor } from "@/app/(app)/proveedores/actions";
import type { LoteOpcion } from "@/services/inventario.service";
import type { EntidadLite } from "@/lib/documento-entidad";

const inicial: EstadoMovimiento = {};
const TODOS: TipoMovimientoStock[] = ["ENTRADA", "SALIDA", "TRASLADO", "BAJA"];
const SOLO_SALIDA: TipoMovimientoStock[] = ["SALIDA", "TRASLADO", "BAJA"];

/** Motivos sugeridos según el tipo de movimiento (categorías auditables). */
const MOTIVOS: Record<TipoMovimientoStock, string[]> = {
  ENTRADA: ["Compra / reposición", "Devolución de área", "Donación", "Ajuste de inventario"],
  SALIDA: ["Dispensación", "Consumo interno", "Devolución a proveedor"],
  VENTA: ["Venta mostrador", "Venta institucional"],
  TRASLADO: ["Traslado entre establecimientos"],
  BAJA: ["Vencimiento", "Deterioro", "Contaminación", "Retiro sanitario", "Rotura / merma"],
};

export function RegistrarMovimientoGlobal({
  lotes,
  establecimientos = [],
  usuarios = [],
  proveedores = [],
  soloSalidas = false,
}: {
  lotes: LoteOpcion[];
  establecimientos?: string[];
  usuarios?: string[];
  proveedores?: EntidadLite[];
  soloSalidas?: boolean;
}) {
  const [estado, action, pendiente] = useActionState(registrarMovimiento, inicial);
  const formRef = useRef<HTMLFormElement>(null);

  // El sistema pre-selecciona el lote más urgente (FEFO: el primero de la lista).
  const [loteId, setLoteId] = useState(() => lotes[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoMovimientoStock>("SALIDA");
  const [motivo, setMotivo] = useState<string>(MOTIVOS.SALIDA[0]);
  const [cantidad, setCantidad] = useState("");
  const [proveedorId, setProveedorId] = useState("");

  const tipos = soloSalidas ? SOLO_SALIDA : TODOS;
  const lote = lotes.find((l) => l.id === loteId);
  const cant = Number(cantidad);
  const preview =
    lote && Number.isFinite(cant) && cant > 0 ? calcularNuevoStock(tipo, lote.stock, cant) : null;
  const mostrarDestino = esSalida(tipo); // destino/recepción solo aplican a salidas

  const cambiarTipo = (nuevo: TipoMovimientoStock) => {
    setTipo(nuevo);
    setMotivo(MOTIVOS[nuevo][0]); // sugiere el motivo más común del nuevo tipo
  };

  useEffect(() => {
    if (estado.ok) {
      toast.success("Movimiento registrado");
      formRef.current?.reset();
      setCantidad("");
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado]);

  if (lotes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No hay lotes con stock disponible para registrar movimientos.
      </p>
    );
  }

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="loteId" value={loteId} />
      <input type="hidden" name="proveedorId" value={proveedorId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Lote</Label>
          <Select value={loteId} onChange={(e) => setLoteId(e.target.value)}>
            {lotes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.codigo} · {l.medicamento} — stock {l.stock} · vence {l.vence}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tipo de movimiento</Label>
          <Select value={tipo} onChange={(e) => cambiarTipo(e.target.value as TipoMovimientoStock)}>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_MOVIMIENTO[t]}
                {t === "ENTRADA" ? " (suma stock)" : ""}
              </option>
            ))}
          </Select>
          {/* el name="tipo" se envía por un campo oculto para no depender del foco */}
          <input type="hidden" name="tipo" value={tipo} />
        </div>

        <div className="space-y-1.5">
          <Label>Cantidad</Label>
          <Input
            type="number"
            name="cantidad"
            min={1}
            max={mostrarDestino ? lote?.stock : undefined}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Motivo</Label>
          <Select name="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="">— Sin especificar —</option>
            {MOTIVOS[tipo].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Fecha del movimiento</Label>
          <Input type="date" name="fecha" />
          <p className="text-xs text-muted-foreground">Vacío = hoy.</p>
        </div>

        {tipo === "ENTRADA" && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Proveedor (entrada)</Label>
            <EntidadSelector
              entidades={proveedores}
              value={proveedorId}
              onSelect={setProveedorId}
              acciones={{ buscar: buscarDocumentoProveedor, crear: crearProveedor }}
              noun="proveedor"
              nounCapital="Proveedor"
            />
          </div>
        )}

        {mostrarDestino && (
          <>
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
          </>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Documento de referencia</Label>
          <Input name="documentoRef" placeholder="N.º de guía de remisión / acta de baja (opcional)" />
        </div>
      </div>

      {/* Panel predictivo: stock actual, estado y resultado en vivo */}
      {lote && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-secondary/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Stock disponible: <span className="font-semibold text-foreground">{lote.stock}</span>
          </span>
          <EstadoBadge estado={lote.estado} />
          {(lote.estado === "CRITICO" || lote.estado === "PREVENTIVA") && (
            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--warning)]">
              <TriangleAlert className="size-3.5" /> Próximo a vencer — prioriza su salida (FEFO)
            </span>
          )}
          {preview?.ok && (
            <span className="ml-auto font-medium text-fx-blue">
              Quedarán {preview.nuevoStock} unidad(es)
            </span>
          )}
          {preview && !preview.ok && (
            <span className="ml-auto font-medium text-danger">{preview.error}</span>
          )}
        </div>
      )}

      <Button type="submit" disabled={pendiente || !loteId || !preview?.ok}>
        <ArrowRightLeft className="size-4" />
        {pendiente ? "Registrando…" : "Registrar movimiento"}
      </Button>
    </form>
  );
}
