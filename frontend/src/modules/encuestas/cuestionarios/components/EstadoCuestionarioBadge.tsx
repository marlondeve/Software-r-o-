import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EstadoCuestionario } from "@/modules/encuestas/cuestionarios/datos/mockCuestionarios"

const ESTADO_CONFIG: Record<EstadoCuestionario, { label: string; className: string }> = {
  activo: {
    label: "Activo",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  inactivo: {
    label: "Inactivo",
    className: "bg-muted text-muted-foreground border-border",
  },
  borrador: {
    label: "Borrador",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  },
}

export function EstadoCuestionarioBadge({ estado }: { estado: EstadoCuestionario }) {
  const config = ESTADO_CONFIG[estado]
  return (
    <Badge variant="outline" className={cn("rounded-full font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
