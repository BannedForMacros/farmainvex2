import type { Metadata } from "next";
import Link from "next/link";
import { FileBarChart, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { REPORTES } from "@/services/reportes.service";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generación de reportes</h1>
        <p className="text-sm text-muted-foreground">
          Elige un reporte para filtrarlo por fechas, visualizar sus gráficos y descargarlo en PDF o Excel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTES.map((r) => (
          <Link key={r.tipo} href={`/reportes/${r.tipo}`} className="group">
            <Card className="transition-colors group-hover:border-fx-blue/40 group-hover:bg-secondary/40">
              <CardContent className="flex items-center gap-3 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-fx-blue">
                  <FileBarChart className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{r.titulo}</p>
                  <p className="text-sm text-muted-foreground">{r.descripcion}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
