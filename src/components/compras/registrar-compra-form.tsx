"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { registrarCompra, type EstadoCompra } from "@/app/(app)/compras/actions";
import { buscarDocumentoProveedor, crearProveedor } from "@/app/(app)/proveedores/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EntidadSelector } from "@/components/documento/entidad-selector";
import type { EntidadLite } from "@/lib/documento-entidad";

const inicial: EstadoCompra = {};

interface Medicamento {
  id: string;
  nombreComercial: string;
  codigo: string;
}

interface Linea {
  key: number;
  medicamentoId: string;
  numeroLote: string;
  cantidad: string;
  costoUnitario: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  proveedorId: string;
  documentoRef: string;
}

function nuevaLinea(key: number, medId: string): Linea {
  return {
    key,
    medicamentoId: medId,
    numeroLote: "",
    cantidad: "",
    costoUnitario: "0",
    fechaFabricacion: "",
    fechaVencimiento: "",
    proveedorId: "",
    documentoRef: "",
  };
}

export function RegistrarCompraForm({
  medicamentos,
  establecimientos,
  proveedores,
}: {
  medicamentos: Medicamento[];
  establecimientos: { id: string; nombre: string }[];
  proveedores: EntidadLite[];
}) {
  const [estado, action, pendiente] = useActionState(registrarCompra, inicial);
  const [lineas, setLineas] = useState<Linea[]>(() => [nuevaLinea(1, medicamentos[0]?.id ?? "")]);
  const [nextKey, setNextKey] = useState(2);

  useEffect(() => {
    if (estado.error) toast.error(estado.error);
  }, [estado]);

  if (medicamentos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Primero registra medicamentos para poder ingresar lotes.
      </p>
    );
  }

  const actualizar = (key: number, patch: Partial<Linea>) =>
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const agregar = () => {
    setLineas((prev) => [...prev, nuevaLinea(nextKey, medicamentos[0]?.id ?? "")]);
    setNextKey((k) => k + 1);
  };
  const quitar = (key: number) => setLineas((prev) => prev.filter((l) => l.key !== key));

  const lineaValida = (l: Linea) =>
    l.medicamentoId &&
    l.numeroLote.trim() &&
    l.fechaFabricacion &&
    l.fechaVencimiento &&
    new Date(l.fechaVencimiento) > new Date(l.fechaFabricacion) &&
    Number(l.cantidad) >= 1;

  const todoValido = lineas.every(lineaValida);

  const lineasJson = JSON.stringify(
    lineas.map((l) => ({
      medicamentoId: l.medicamentoId,
      numeroLote: l.numeroLote,
      cantidad: Number(l.cantidad) || 0,
      costoUnitario: Number(l.costoUnitario) || 0,
      fechaFabricacion: l.fechaFabricacion,
      fechaVencimiento: l.fechaVencimiento,
      proveedorId: l.proveedorId,
      documentoRef: l.documentoRef,
    })),
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="lineas" value={lineasJson} />

      {/* Cabecera compartida */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Fecha de compra</Label>
          <Input type="date" name="fecha" />
          <p className="text-xs text-muted-foreground">Vacío = hoy.</p>
        </div>
        <div className="space-y-1.5 lg:col-span-2">
          <Label>Establecimiento (destino del stock)</Label>
          <Select name="establecimientoId" defaultValue="">
            <option value="">— Sin asignar —</option>
            {establecimientos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Líneas: un producto/lote por fila, cada uno con su proveedor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Productos / lotes de la compra</Label>
          <span className="text-xs text-muted-foreground">{lineas.length} producto(s)</span>
        </div>

        {lineas.map((linea, idx) => {
          const fechasMal =
            linea.fechaFabricacion &&
            linea.fechaVencimiento &&
            new Date(linea.fechaVencimiento) <= new Date(linea.fechaFabricacion);
          return (
            <div key={linea.key} className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Producto {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => quitar(linea.key)}
                  disabled={lineas.length === 1}
                  aria-label="Quitar producto"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Medicamento</Label>
                  <Select
                    value={linea.medicamentoId}
                    onChange={(e) => actualizar(linea.key, { medicamentoId: e.target.value })}
                  >
                    {medicamentos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombreComercial} ({m.codigo})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>N.º de lote</Label>
                  <Input
                    value={linea.numeroLote}
                    onChange={(e) => actualizar(linea.key, { numeroLote: e.target.value })}
                    placeholder="L-XXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={linea.cantidad}
                    onChange={(e) => actualizar(linea.key, { cantidad: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha fabricación</Label>
                  <Input
                    type="date"
                    value={linea.fechaFabricacion}
                    onChange={(e) => actualizar(linea.key, { fechaFabricacion: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha vencimiento</Label>
                  <Input
                    type="date"
                    value={linea.fechaVencimiento}
                    onChange={(e) => actualizar(linea.key, { fechaVencimiento: e.target.value })}
                  />
                  {fechasMal && (
                    <p className="text-xs text-danger">Debe ser posterior a la fabricación.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Costo unitario (S/)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={linea.costoUnitario}
                    onChange={(e) => actualizar(linea.key, { costoUnitario: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Proveedor</Label>
                  <EntidadSelector
                    entidades={proveedores}
                    value={linea.proveedorId}
                    onSelect={(id) => actualizar(linea.key, { proveedorId: id })}
                    acciones={{ buscar: buscarDocumentoProveedor, crear: crearProveedor }}
                    noun="proveedor"
                    nounCapital="Proveedor"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Documento (guía/factura)</Label>
                  <Input
                    value={linea.documentoRef}
                    onChange={(e) => actualizar(linea.key, { documentoRef: e.target.value })}
                    placeholder="N.º guía / factura"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <Button type="button" variant="outline" onClick={agregar}>
          <Plus className="size-4" /> Agregar otro producto
        </Button>
      </div>

      <Button type="submit" disabled={pendiente || !todoValido}>
        <PackagePlus className="size-4" />
        {pendiente ? "Registrando…" : `Registrar compra (${lineas.length} producto/s)`}
      </Button>
    </form>
  );
}
