import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EnConstruccion({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-fx-blue">
            <Construction className="size-7" />
          </span>
          <p className="text-lg font-semibold">Módulo en construcción</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Esta sección forma parte del plan de desarrollo de FarmaInvex y se implementará en
            las siguientes fases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
