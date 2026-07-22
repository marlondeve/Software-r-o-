import { cn } from "@/lib/utils"
import type { TonoMotivoBrecha } from "@/modules/encuestas/indicadores/datos/mockAnalisisBrechas"

export function MotivoBrechaChip({
  motivo,
  tono,
}: {
  motivo: string
  tono: TonoMotivoBrecha
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        tono === "negativo"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground",
      )}
    >
      {motivo}
    </span>
  )
}
