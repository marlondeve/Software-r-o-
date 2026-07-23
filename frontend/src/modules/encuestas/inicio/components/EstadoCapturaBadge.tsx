import { AlertTriangle, CircleCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EstadoCaptura } from "@/modules/encuestas/inicio/datos/mockInicio"

const ESTADO_CONFIG: Record<
  EstadoCaptura,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  completada: {
    label: "Completada",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: CircleCheck,
  },
  revision: {
    label: "Revisión",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
}

export function EstadoCapturaBadge({ estado }: { estado: EstadoCaptura }) {
  const config = ESTADO_CONFIG[estado]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", config.className)}>
      <Icon data-icon="inline-start" />
      {config.label}
    </Badge>
  )
}
