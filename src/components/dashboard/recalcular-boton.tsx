"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RecalcularBoton() {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [cargando, setCargando] = useState(false);

  async function recalcular() {
    setCargando(true);
    try {
      const res = await fetch("/api/cron/vencimientos", { method: "POST" });
      if (!res.ok) throw new Error("fallo");
      const data = await res.json();
      toast.success(
        `Recalculado: ${data.lotesEvaluados} lote(s), ${data.alertasCreadas} alerta(s) nueva(s).`,
      );
      startTransition(() => router.refresh());
    } catch {
      toast.error("No se pudo recalcular. Revisa la conexión a la base de datos.");
    } finally {
      setCargando(false);
    }
  }

  const ocupado = cargando || pendiente;

  return (
    <Button variant="outline" onClick={recalcular} disabled={ocupado}>
      <RefreshCw className={ocupado ? "animate-spin" : ""} />
      {ocupado ? "Recalculando…" : "Recalcular estados"}
    </Button>
  );
}
