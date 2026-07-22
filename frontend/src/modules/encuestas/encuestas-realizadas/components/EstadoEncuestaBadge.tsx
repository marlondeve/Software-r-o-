import { Ban, CircleCheck, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EstadoEncuesta } from "@/modules/encuestas/encuestas-realizadas/datos/mockEncuestasRealizadas"

const ESTADO_CONFIG: Record<
  EstadoEncuesta,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  completada: {
    label: "Completada",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: CircleCheck,
  },
  incompleta: {
    label: "Incompleta",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/25",
    icon: Clock,
  },
  anulada: {
    label: "Anulada",
    className: "bg-muted text-muted-foreground border-border",
    icon: Ban,
  },
}

export function EstadoEncuestaBadge({ estado }: { estado: EstadoEncuesta }) {
  const config = ESTADO_CONFIG[estado]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", config.className)}>
      <Icon data-icon="inline-start" />
      {config.label}
    </Badge>
  )
}
