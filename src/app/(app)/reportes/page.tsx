import type { Metadata } from "next";
import { FileText, FileSpreadsheet, FileBarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { REPORTES } from "@/services/reportes.service";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Generación de reportes</h1>
        <p className="text-sm text-muted-foreground">
          Descarga reportes en PDF o Excel. Reflejan el estado actual del sistema.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTES.map((r) => (
          <Card key={r.tipo}>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-fx-blue">
                  <FileBarChart className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{r.titulo}</p>
                  <p className="text-sm text-muted-foreground">{r.descripcion}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/api/reportes?tipo=${r.tipo}&formato=pdf`}
                  className={buttonVariants({ variant: "primary", size: "sm" })}
                >
                  <FileText className="size-4" /> PDF
                </a>
                <a
                  href={`/api/reportes?tipo=${r.tipo}&formato=excel`}
                  className={buttonVariants({ variant: "teal", size: "sm" })}
                >
                  <FileSpreadsheet className="size-4" /> Excel
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
