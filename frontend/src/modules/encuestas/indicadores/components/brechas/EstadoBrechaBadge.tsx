import { BookmarkCheck, CircleCheck, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EstadoBrecha } from "@/modules/encuestas/indicadores/datos/mockAnalisisBrechas"

const CONFIG: Record<
  EstadoBrecha,
  { label: string; className: string; icon: typeof CircleCheck }
> = {
  en_gestion: {
    label: "En gestión",
    className: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    icon: BookmarkCheck,
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: TriangleAlert,
  },
  justificado: {
    label: "Justificado",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: CircleCheck,
  },
}

export function EstadoBrechaBadge({ estado }: { estado: EstadoBrecha }) {
  const config = CONFIG[estado]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", config.className)}>
      <Icon data-icon="inline-start" />
      {config.label}
    </Badge>
  )
}
