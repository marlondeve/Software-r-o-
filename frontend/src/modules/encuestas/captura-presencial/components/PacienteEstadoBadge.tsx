import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EstadoPaciente } from "@/modules/encuestas/captura-presencial/datos/mockCapturaPresencial"

const ESTADO_CONFIG: Record<EstadoPaciente, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  en_proceso: {
    label: "En proceso",
    className: "border-transparent bg-accent text-accent-foreground",
  },
  completada: {
    label: "Completada",
    className: "bg-muted text-muted-foreground border-border",
  },
  no_disponible: {
    label: "No disp.",
    className: "border-transparent bg-foreground/80 text-background",
  },
}

export function PacienteEstadoBadge({
  estado,
  className,
}: {
  estado: EstadoPaciente
  className?: string
}) {
  const config = ESTADO_CONFIG[estado]

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium uppercase", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
