import type {
  EstadoCategoria,
  EstadoCocina,
  EstadoConciliacion,
  EstadoDieta,
  EstadoDietaCatalogo,
  EstadoLogisticaEtiqueta,
  EstadoUsuario,
  ResultadoAuditoria,
} from "@/modules/dietas-cocina/types/enums"

/** Tokens semánticos compartidos en todo el flujo operativo. */
export const estadoBadgeTokens = {
  success: "border-primary/20 bg-primary/10 text-primary",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  progress: "border-orange-500/25 bg-orange-500/10 text-orange-800 dark:text-orange-300",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  transit: "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  delivered: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted text-muted-foreground",
  inactive: "border-border bg-muted/80 text-muted-foreground",
  closed: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",
} as const

export type EstadoBadgeToken = keyof typeof estadoBadgeTokens

export interface EstadoVisualConfig {
  label: string
  className: string
}

export const estadoDietaConfig: Record<EstadoDieta, EstadoVisualConfig> = {
  confirmada: { label: "Confirmada", className: estadoBadgeTokens.success },
  guardado: { label: "Guardado", className: estadoBadgeTokens.warning },
  "no-solicitada": { label: "Sin solicitud", className: estadoBadgeTokens.danger },
  preparando: { label: "Preparando", className: estadoBadgeTokens.progress },
  "en-preparacion": { label: "En gestión", className: estadoBadgeTokens.progress },
  "lista-despacho": { label: "Lista p/ Despacho", className: estadoBadgeTokens.warning },
  "por-iniciar": { label: "En gestión", className: estadoBadgeTokens.progress },
  recibida: { label: "Recibida", className: estadoBadgeTokens.transit },
  devuelta: { label: "Devuelta", className: estadoBadgeTokens.danger },
  recogida: { label: "Recogida", className: estadoBadgeTokens.closed },
  cancelada: { label: "Cancelada", className: estadoBadgeTokens.inactive },
  despachada: { label: "Despachada", className: estadoBadgeTokens.info },
}

export const estadoCocinaConfig: Record<EstadoCocina, EstadoVisualConfig> = {
  por_iniciar: { label: "En gestión", className: estadoBadgeTokens.progress },
  en_preparacion: { label: "En gestión", className: estadoBadgeTokens.progress },
  lista: { label: "Lista", className: estadoBadgeTokens.warning },
  despachada: { label: "Despachada", className: estadoBadgeTokens.info },
  cancelada: { label: "Cancelada", className: estadoBadgeTokens.inactive },
}

export const estadoLogisticaConfig: Record<
  EstadoLogisticaEtiqueta,
  EstadoVisualConfig
> = {
  generada: { label: "Generada", className: estadoBadgeTokens.warning },
  impresa: { label: "Impresa", className: estadoBadgeTokens.neutral },
  pre_entregada: { label: "Pre-entregada", className: estadoBadgeTokens.transit },
  entregada: { label: "Entregada", className: estadoBadgeTokens.delivered },
  devuelta: { label: "Devuelta", className: estadoBadgeTokens.danger },
}

export const estadoConciliacionConfig: Record<
  EstadoConciliacion,
  EstadoVisualConfig
> = {
  coincide: { label: "Coincide", className: estadoBadgeTokens.success },
  "conciliado-manual": {
    label: "Conciliado manual",
    className: estadoBadgeTokens.neutral,
  },
  "dif-cantidad": {
    label: "Dif. cantidad",
    className: estadoBadgeTokens.warning,
  },
  "dif-tarifa": { label: "Dif. tarifa", className: estadoBadgeTokens.warning },
  pendiente: { label: "Pendiente", className: estadoBadgeTokens.warning },
}

export const estadoDietaCatalogoConfig: Record<
  EstadoDietaCatalogo,
  EstadoVisualConfig
> = {
  vigente: { label: "Vigente", className: estadoBadgeTokens.success },
  programada: { label: "Programada", className: estadoBadgeTokens.warning },
  vencida: { label: "Vencida", className: estadoBadgeTokens.danger },
  inactiva: { label: "Inactiva", className: estadoBadgeTokens.neutral },
}

export const estadoCategoriaConfig: Record<EstadoCategoria, EstadoVisualConfig> =
  {
    activo: { label: "Activo", className: estadoBadgeTokens.success },
    borrador: { label: "Borrador", className: estadoBadgeTokens.neutral },
  }

export const resultadoAuditoriaConfig: Record<
  ResultadoAuditoria,
  EstadoVisualConfig
> = {
  exitoso: { label: "Exitoso", className: estadoBadgeTokens.delivered },
  fallido: { label: "Fallido", className: estadoBadgeTokens.danger },
}

export const estadoUsuarioConfig: Record<
  EstadoUsuario,
  { label: string; dotClassName: string }
> = {
  activo: { label: "Activo", dotClassName: "bg-emerald-500" },
  inactivo: { label: "Inactivo", dotClassName: "bg-muted-foreground" },
}

export function claseBadgeEstadoDieta(estado: EstadoDieta): string {
  return estadoDietaConfig[estado]?.className ?? estadoBadgeTokens.neutral
}

export function claseBadgeEstadoCocina(estado: EstadoCocina): string {
  return estadoCocinaConfig[estado]?.className ?? estadoBadgeTokens.neutral
}

export function claseBadgeLogistica(estado: EstadoLogisticaEtiqueta): string {
  return estadoLogisticaConfig[estado]?.className ?? estadoBadgeTokens.neutral
}

export function claseBadgeConciliacion(estado: EstadoConciliacion): string {
  return estadoConciliacionConfig[estado]?.className ?? estadoBadgeTokens.warning
}

export function claseBadgeDietaCatalogo(estado: EstadoDietaCatalogo): string {
  return estadoDietaCatalogoConfig[estado]?.className ?? estadoBadgeTokens.neutral
}

export function claseBadgeCategoria(estado: EstadoCategoria): string {
  return estadoCategoriaConfig[estado]?.className ?? estadoBadgeTokens.neutral
}

export function labelEstadoDieta(estado: EstadoDieta): string {
  return estadoDietaConfig[estado]?.label ?? estado
}

export function labelEstadoCocina(estado: EstadoCocina): string {
  return estadoCocinaConfig[estado]?.label ?? estado
}

export function labelEstadoLogistica(estado: EstadoLogisticaEtiqueta): string {
  return estadoLogisticaConfig[estado]?.label ?? estado
}

/** Colores de conciliación para texto/filas (no solo badges). */
export const conciliacionColores = {
  ok: "text-primary",
  okBadge: estadoBadgeTokens.success,
  alerta: "text-amber-700 dark:text-amber-400",
  alertaBadge: estadoBadgeTokens.warning,
  alertaFila: "bg-amber-500/5",
  error: "text-destructive",
  neutro: "text-muted-foreground",
  neutroBadge: estadoBadgeTokens.neutral,
} as const

export function badgeClassPorEstado(estado: EstadoConciliacion): string {
  return claseBadgeConciliacion(estado)
}
