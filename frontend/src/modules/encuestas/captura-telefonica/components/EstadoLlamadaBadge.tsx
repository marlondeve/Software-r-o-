import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type {
  EstadoLlamada,
  FilaCapturaTelefonica,
} from "@/modules/encuestas/captura-telefonica/datos/mockCapturaTelefonica"

const ESTADO_CONFIG: Record<
  EstadoLlamada,
  { label: string; className: string;}
> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-muted text-muted-foreground border-border",
  },
  reintento: {
    label: "Reintento",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/25",
  },
  no_contesta: {
    label: "No contesta",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  rechazo: {
    label: "Rechazo",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  completada: {
    label: "Completada",
    className: "bg-primary/10 text-primary border-primary/20",
  },
}

interface EstadoLlamadaBadgeProps {
  estado: EstadoLlamada
  horaReintento?: FilaCapturaTelefonica["horaReintento"]
  className?: string
}

export function EstadoLlamadaBadge({
  estado,
  horaReintento,
  className,
}: EstadoLlamadaBadgeProps) {
  const config = ESTADO_CONFIG[estado]

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium uppercase",
        config.className,
        className,
      )}
    >
      {config.label}
      {estado === "reintento" && horaReintento ? ` ${horaReintento}` : ""}
    </Badge>
  )
}
