import type { EstadoUsuario, RolDietas } from "@/modules/dietas-cocina/types/enums"
export const rolDietasEstilos: Record<RolDietas, { className: string }> = {
  Nutricionista: {
    className: "bg-primary/10 text-primary border-primary/20",
  },
  Administrador: {
    className: "bg-muted text-muted-foreground border-border",
  },
  Proveedor: {
    className: "bg-secondary text-secondary-foreground border-border",
  },
  Doctor: {
    className: "bg-primary/10 text-primary border-primary/20",
  },
  Enfermera: {
    className: "bg-accent/30 text-accent-foreground border-accent/40",
  },
}

export const estadoUsuarioEstilos: Record<
  EstadoUsuario,
  { label: string; dotClassName: string }
> = {
  activo: {
    label: "Activo",
    dotClassName: "bg-emerald-500",
  },
  inactivo: {
    label: "Inactivo",
    dotClassName: "bg-muted-foreground",
  },
}
