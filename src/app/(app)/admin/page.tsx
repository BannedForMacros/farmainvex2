import type { Metadata } from "next";
import { EnConstruccion } from "@/components/layout/en-construccion";

export const metadata: Metadata = { title: "Administración" };

export default function AdminPage() {
  return (
    <EnConstruccion
      titulo="Administración"
      descripcion="Gestión de catálogos (medicamentos, establecimientos, usuarios) y umbrales de alerta."
    />
  );
}
