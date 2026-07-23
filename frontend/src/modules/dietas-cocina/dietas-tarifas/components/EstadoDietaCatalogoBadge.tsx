import { Check, Clock, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { EstadoDietaCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"
import { cn } from "@/lib/utils"

const CONFIG: Record<
  EstadoDietaCatalogo,
  { label: string; className: string; Icon: typeof Check }
> = {
  vigente: {
    label: "Vigente",
    className: "bg-primary/10 text-primary border-primary/25",
    Icon: Check,
  },
  programada: {
    label: "Programada",
    className: "bg-amber-500/10 text-amber-800 border-amber-500/25 dark:text-amber-300",
    Icon: Clock,
  },
  vencida: {
    label: "Vencida",
    className: "bg-destructive/10 text-destructive border-destructive/25",
    Icon: X,
  },
}

interface EstadoDietaCatalogoBadgeProps {
  estado: EstadoDietaCatalogo
  className?: string
}

export function EstadoDietaCatalogoBadge({
  estado,
  className,
}: EstadoDietaCatalogoBadgeProps) {
  const { label, className: cls, Icon } = CONFIG[estado]
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", cls, className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  )
}
