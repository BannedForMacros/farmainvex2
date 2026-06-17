import type { ReactNode } from "react";

/** Par etiqueta/valor para vistas de detalle. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {etiqueta}
      </dt>
      <dd className="text-sm font-medium text-foreground">{children ?? "—"}</dd>
    </div>
  );
}
