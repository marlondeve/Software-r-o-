import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type EstadoDieta =
  | "confirmada"
  | "guardado"
  | "no-solicitada"
  | "preparando"
  | "en-preparacion"
  | "lista-despacho"
  | "por-iniciar"
  | "recibida"
  | "devuelta"
  | "cancelada"
  | "despachada"

const ESTADO_CONFIG: Record<
  EstadoDieta,
  { label: string; className: string }
> = {
  confirmada: {
    label: "Confirmada",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  guardado: {
    label: "Guardado",
    className: "bg-accent/30 text-accent-foreground border-accent/40",
  },
  "no-solicitada": {
    label: "No solicitada",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  preparando: {
    label: "Preparando",
    className: "bg-muted text-muted-foreground border-border",
  },
  "en-preparacion": {
    label: "En preparación",
    className: "bg-accent/30 text-accent-foreground border-accent/40",
  },
  "lista-despacho": {
    label: "Lista p/ Despacho",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  "por-iniciar": {
    label: "Por iniciar",
    className: "bg-muted text-muted-foreground border-border",
  },
  recibida: {
    label: "Recibida",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  devuelta: {
    label: "Devuelta",
    className: "bg-muted text-muted-foreground border-border",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-muted/80 text-muted-foreground border-border",
  },
  despachada: {
    label: "Despachada",
    className: "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400",
  },
}

interface EstadoBadgeProps {
  estado: EstadoDieta
  className?: string
}

export function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  const config = ESTADO_CONFIG[estado]
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
