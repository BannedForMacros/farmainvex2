import type { Metadata } from "next";
import { EnConstruccion } from "@/components/layout/en-construccion";

export const metadata: Metadata = { title: "Supervisión farmacéutica" };

export default function SupervisionPage() {
  return (
    <EnConstruccion
      titulo="Supervisión farmacéutica"
      descripcion="Control de almacenamiento, validación de estados sanitarios y seguimiento de incidencias."
    />
  );
}
