import type { ModuloAuditoria, ResultadoAuditoria } from "@/modules/dietas-cocina/auditoria/datos/mockAuditoria"

export const MODULO_LABEL: Record<ModuloAuditoria, string> = {
  dietas: "Dietas",
  cocina: "Cocina",
  etiquetas: "Etiquetas",
  reportes: "Reportes",
  conciliacion: "Conciliación",
  parametros: "Parámetros",
  usuarios: "Usuarios y roles",
  inicio: "Inicio",
}

export const resultadoAuditoriaEstilos: Record<
  ResultadoAuditoria,
  { label: string; className: string }
> = {
  exitoso: {
    label: "Exitoso",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  fallido: {
    label: "Fallido",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

export const avatarColorPorIniciales = (iniciales: string) => {
  const paleta = [
    "bg-primary/15 text-primary",
    "bg-accent/40 text-accent-foreground",
    "bg-secondary text-secondary-foreground",
    "bg-muted text-muted-foreground",
  ]
  const indice = iniciales.charCodeAt(0) % paleta.length
  return paleta[indice]
}

export const impactoNivelColor = {
  alto: "bg-destructive",
  medio: "bg-amber-500",
  bajo: "bg-emerald-500",
  ninguno: "bg-muted-foreground",
}
