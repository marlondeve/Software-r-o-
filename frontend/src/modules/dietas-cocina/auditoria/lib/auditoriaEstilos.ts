import type { ModuloAuditoria } from "@/modules/dietas-cocina/types/enums"

export { resultadoAuditoriaConfig as resultadoAuditoriaEstilos } from "@/modules/dietas-cocina/lib/estadosEstilos"

export const MODULO_LABEL: Record<ModuloAuditoria, string> = {
  dietas: "Dietas",
  catalogo: "Catálogo y tarifas",
  cocina: "Cocina",
  etiquetas: "Etiquetas",
  reportes: "Reportes",
  conciliacion: "Conciliación",
  parametros: "Parámetros",
  usuarios: "Usuarios y roles",
  inicio: "Inicio",
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
