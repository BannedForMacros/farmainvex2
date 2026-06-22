"use client";

import { useMemo, useState } from "react";
import { UserPlus, Search, User, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EntidadDocumentoForm } from "./entidad-documento-form";
import { ETIQUETA_TIPO_DOCUMENTO } from "@/lib/enums";
import type { AccionesEntidad, EntidadLite } from "@/lib/documento-entidad";

/**
 * Selector genérico con buscador + alta inline (Decolecta). Reutilizable para
 * clientes (en ventas) y proveedores (en entradas).
 */
export function EntidadSelector({
  entidades,
  value,
  onSelect,
  acciones,
  noun = "registro",
  nounCapital = "Registro",
}: {
  entidades: EntidadLite[];
  value: string;
  onSelect: (id: string) => void;
  acciones: AccionesEntidad;
  noun?: string;
  nounCapital?: string;
}) {
  const [lista, setLista] = useState<EntidadLite[]>(entidades);
  const [modo, setModo] = useState<"buscar" | "crear">("buscar");
  const [busqueda, setBusqueda] = useState("");

  const seleccionado = lista.find((c) => c.id === value);
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.numeroDocumento.includes(q),
    );
  }, [lista, busqueda]);

  return (
    <Modal
      title={modo === "crear" ? `Nuevo ${noun}` : `Seleccionar ${noun}`}
      description={
        modo === "crear"
          ? "Consulta por RUC/DNI para traer los datos oficiales."
          : `Busca y elige el ${noun}.`
      }
      contentClassName="sm:max-w-xl"
      trigger={(open) => (
        <button
          type="button"
          onClick={() => {
            setModo("buscar");
            open();
          }}
          className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-surface px-3 text-left text-sm shadow-sm transition-colors hover:border-fx-blue/50"
        >
          <User className="size-4 shrink-0 text-muted-foreground" />
          {seleccionado ? (
            <span className="truncate">
              <span className="font-medium">{seleccionado.nombre}</span>
              <span className="text-muted-foreground">
                {" "}
                · {ETIQUETA_TIPO_DOCUMENTO[seleccionado.tipoDocumento]} {seleccionado.numeroDocumento}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Seleccionar {noun}…</span>
          )}
        </button>
      )}
    >
      {(close) =>
        modo === "crear" ? (
          <EntidadDocumentoForm
            acciones={acciones}
            noun={noun}
            onCreated={(c) => {
              setLista((prev) => (prev.some((x) => x.id === c.id) ? prev : [c, ...prev]));
              onSelect(c.id);
              setModo("buscar");
              close();
            }}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o documento…"
                  className="pl-9"
                />
              </div>
              <button
                type="button"
                onClick={() => setModo("crear")}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <UserPlus className="size-4" /> Crear
              </button>
            </div>

            <div className="max-h-72 space-y-1 overflow-y-auto">
              {filtrados.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Sin {noun}s. Usa “Crear” para registrar uno.
                </p>
              ) : (
                filtrados.map((c) => {
                  const activo = c.id === value;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelect(c.id);
                        close();
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        activo ? "border-fx-blue bg-fx-blue/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <User className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {ETIQUETA_TIPO_DOCUMENTO[c.tipoDocumento]} {c.numeroDocumento}
                        </p>
                      </div>
                      {activo && <Check className="size-4 text-fx-blue" />}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground">{nounCapital}s activos disponibles.</p>
          </div>
        )
      }
    </Modal>
  );
}
