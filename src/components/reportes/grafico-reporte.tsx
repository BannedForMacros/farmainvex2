"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { GraficoReporte } from "@/services/reportes.service";

/** Paleta FarmaInvex (logo + semáforo). */
const PALETA = ["#002878", "#0064B4", "#008CDC", "#00A08C", "#18B981", "#F5A623", "#E5304B", "#6E6E82"];

/** Colores fijos para los estados del semáforo, si la serie los usa. */
const COLOR_ESTADO: Record<string, string> = {
  "Producto vigente": "#18B981",
  "Alerta preventiva": "#F5A623",
  "Riesgo crítico": "#E5304B",
};

function colorDe(nombre: string, indice: number): string {
  return COLOR_ESTADO[nombre] ?? PALETA[indice % PALETA.length];
}

export function GraficoReporteVista({ grafico }: { grafico: GraficoReporte }) {
  if (grafico.series.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-muted-foreground">
        <BarChart3 className="size-8 opacity-40" />
        <p className="text-sm">Sin datos para graficar en el rango seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{grafico.titulo}</p>
      <ResponsiveContainer width="100%" height={300}>
        {grafico.tipo === "pie" ? (
          <PieChart>
            <Pie
              data={grafico.series}
              dataKey="valor"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {grafico.series.map((s, i) => (
                <Cell key={s.nombre} fill={colorDe(s.nombre, i)} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={grafico.series} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip cursor={{ fill: "rgba(0,40,120,0.05)" }} />
            <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
              {grafico.series.map((s, i) => (
                <Cell key={s.nombre} fill={colorDe(s.nombre, i)} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
