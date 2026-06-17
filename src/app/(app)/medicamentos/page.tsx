import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { BotonEliminar } from "@/components/boton-eliminar";
import { eliminarMedicamento } from "./actions";

export const metadata: Metadata = { title: "Medicamentos" };

export default async function MedicamentosPage() {
  const medicamentos = await prisma.medicamento.findMany({
    include: { _count: { select: { lotes: true } } },
    orderBy: { nombreComercial: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Medicamentos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de productos farmacéuticos registrados.
          </p>
        </div>
        <Link href="/medicamentos/nuevo" className={buttonVariants({ variant: "primary" })}>
          <Plus className="size-4" /> Nuevo medicamento
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {medicamentos.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aún no hay medicamentos. Crea el primero con “Nuevo medicamento”.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-3 font-medium">Código</th>
                    <th className="p-3 font-medium">Nombre comercial</th>
                    <th className="p-3 font-medium">Laboratorio</th>
                    <th className="p-3 font-medium">Presentación</th>
                    <th className="p-3 font-medium">Lotes</th>
                    <th className="p-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {medicamentos.map((m) => (
                    <tr key={m.id} className="border-b border-border/60 hover:bg-muted/40">
                      <td className="p-3 font-mono text-xs">{m.codigo}</td>
                      <td className="p-3 font-medium">{m.nombreComercial}</td>
                      <td className="p-3 text-muted-foreground">{m.laboratorio}</td>
                      <td className="p-3 text-muted-foreground">{m.presentacion ?? "—"}</td>
                      <td className="p-3">{m._count.lotes}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/medicamentos/${m.id}/editar`}
                            className="inline-grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-fx-blue"
                            aria-label={`Editar ${m.nombreComercial}`}
                            title="Editar"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          <BotonEliminar
                            accion={eliminarMedicamento}
                            id={m.id}
                            descripcion={`el medicamento "${m.nombreComercial}"`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
