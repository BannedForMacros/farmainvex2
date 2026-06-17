import type { Metadata } from "next";
import { EnConstruccion } from "@/components/layout/en-construccion";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <EnConstruccion
      titulo="Generación de reportes"
      descripcion="Reportes de medicamentos, lotes, próximos a vencer e incidencias. Exportación a PDF y Excel."
    />
  );
}
