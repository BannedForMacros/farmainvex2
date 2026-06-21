"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Save, CheckCircle2, AlertCircle, Lock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  buscarDocumentoCliente,
  crearCliente,
  type BusquedaCliente,
} from "@/app/(app)/clientes/actions";
import type { ClienteLite } from "@/services/cliente.service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CrearClienteForm({ onCreated }: { onCreated?: (c: ClienteLite) => void }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"RUC" | "DNI">("RUC");
  const [numero, setNumero] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<BusquedaCliente | null>(null);
  const [nombreManual, setNombreManual] = useState("");
  const [guardando, setGuardando] = useState(false);

  const reset = () => {
    setResultado(null);
    setNombreManual("");
  };

  const buscar = async () => {
    if (!numero.trim()) return;
    setBuscando(true);
    try {
      setResultado(await buscarDocumentoCliente(tipo, numero));
    } finally {
      setBuscando(false);
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      const r = await crearCliente({ tipoDocumento: tipo, numeroDocumento: numero, nombreManual });
      if (!r.ok || !r.cliente) {
        toast.error(r.error ?? "No se pudo crear el cliente.");
        return;
      }
      toast.success("Cliente registrado");
      if (onCreated) onCreated(r.cliente);
      else {
        router.push("/clientes");
        router.refresh();
      }
    } finally {
      setGuardando(false);
    }
  };

  const registrado = resultado?.estado === "registrado" ? resultado.cliente : null;
  const datos = resultado?.estado === "encontrado" ? resultado.datos : null;
  const noEncontrado = resultado?.estado === "no_encontrado" ? resultado.error : null;
  const puedeGuardar = !registrado && (datos !== null || (!!noEncontrado && nombreManual.trim().length > 0));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as "RUC" | "DNI");
              reset();
            }}
          >
            <option value="RUC">RUC</option>
            <option value="DNI">DNI</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Número de documento</Label>
          <Input
            inputMode="numeric"
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value.replace(/\D/g, ""));
              reset();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                buscar();
              }
            }}
            placeholder={tipo === "RUC" ? "11 dígitos" : "8 dígitos"}
          />
        </div>
        <Button type="button" variant="outline" onClick={buscar} disabled={buscando || !numero}>
          <Search className="size-4" />
          {buscando ? "Buscando…" : "Buscar"}
        </Button>
      </div>

      {/* Ya registrado */}
      {registrado && (
        <div className="space-y-2 rounded-lg border border-[color:var(--warning)]/40 bg-[color:var(--warning)]/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-[color:var(--warning)]">
            <AlertCircle className="size-4" /> Este {tipo} ya está registrado
          </p>
          <p className="text-base font-semibold">{registrado.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {tipo} {registrado.numeroDocumento}
          </p>
          {onCreated ? (
            <Button type="button" onClick={() => onCreated(registrado)}>
              <UserCheck className="size-4" /> Usar este cliente
            </Button>
          ) : (
            <Link
              href={`/clientes/${registrado.id}/editar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver cliente
            </Link>
          )}
        </div>
      )}

      {/* Datos oficiales (no editables) */}
      {datos && (
        <div className="space-y-2 rounded-lg border border-success/40 bg-success/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="size-4" /> Documento verificado
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" /> Datos oficiales (no editables)
            </span>
          </p>
          <p className="text-base font-semibold">{datos.nombre}</p>
          {datos.direccion && <p className="text-sm text-muted-foreground">{datos.direccion}</p>}
          {(datos.estado || datos.condicion) && (
            <p className="text-xs text-muted-foreground">
              {[datos.estado, datos.condicion, datos.distrito].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      )}

      {/* No encontrado → nombre manual */}
      {noEncontrado && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4" /> {noEncontrado} Ingresa el nombre manualmente.
          </p>
          <div className="space-y-1.5">
            <Label>Nombre / Razón social</Label>
            <Input
              value={nombreManual}
              onChange={(e) => setNombreManual(e.target.value)}
              placeholder="Nombre del cliente"
            />
          </div>
        </div>
      )}

      <Button type="button" onClick={guardar} disabled={!puedeGuardar || guardando}>
        <Save className="size-4" />
        {guardando ? "Guardando…" : "Guardar cliente"}
      </Button>
    </div>
  );
}
