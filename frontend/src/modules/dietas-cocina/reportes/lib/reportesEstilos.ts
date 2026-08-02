import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

/**
 * Colores hex para gráficos (Recharts/SVG).
 * Alineados con estadoBadgeTokens y variables CSS --chart-* / --primary.
 */
export const chartColorHex = {
  success: "#006671",
  progress: "#ea580c",
  warning: "#d97706",
  info: "#0284c7",
  transit: "#7c3aed",
  delivered: "#059669",
  danger: "#dc2626",
  neutral: "#64748b",
  closed: "#475569",
  muted: "#94a3b8",
  accent: "#00818f",
  secondary: "#4a6700",
  highlight: "#bbf244",
} as const

/** Paleta categórica para tipos de dieta y series múltiples. */
export const chartPaletteCategorica = [
  chartColorHex.success,
  chartColorHex.accent,
  chartColorHex.secondary,
  chartColorHex.transit,
  chartColorHex.neutral,
] as const

export const chartPaletteMotivosRechazo = [
  chartColorHex.danger,
  chartColorHex.progress,
  chartColorHex.warning,
] as const

export const chartPaletteMotivosRecogida = [
  chartColorHex.info,
  chartColorHex.accent,
  chartColorHex.success,
] as const

/** Colores por tiempo de comida — distinguibles pero coherentes con la marca. */
export const chartPaletteComidas: Record<TiempoComida, string> = {
  desayuno: "#db2777",
  "merienda-manana": "#ec4899",
  almuerzo: chartColorHex.info,
  "merienda-tarde": chartColorHex.accent,
  cena: chartColorHex.transit,
  "merienda-noche": "#a855f7",
}

/** Segmentos del donut de estado de órdenes (vista proveedor). */
export const segmentoOrdenReporteColores = {
  enCocina: chartColorHex.progress,
  listas: chartColorHex.warning,
  despachadas: chartColorHex.info,
  recibidas: chartColorHex.transit,
  recogidas: chartColorHex.closed,
  recogidasConsumidas: chartColorHex.warning,
  rechazadas: chartColorHex.danger,
} as const

/** Segmentos del donut de estado logístico (vista nutricionista). */
export const segmentoEtiquetaReporteColores = {
  entregadas: chartColorHex.delivered,
  enTransito: chartColorHex.info,
  recogidas: chartColorHex.closed,
  rechazadas: chartColorHex.danger,
} as const

/** Mock/demo: resumen simplificado de estado de dietas. */
export const segmentoResumenMockColores = {
  entregado: chartColorHex.success,
  enCocina: chartColorHex.progress,
  enTransito: chartColorHex.info,
  pendiente: chartColorHex.muted,
  enPreparacion: chartColorHex.highlight,
} as const

export type HallazgoVariant = "destructive" | "info" | "warning"
export type TendenciaVariant = "positive" | "negative" | "neutral"
export type DetalleKpiVariant = "positive" | "negative" | "neutral"

export const hallazgoVariantEstilos: Record<
  HallazgoVariant,
  { container: string; dot: string }
> = {
  destructive: {
    container: "border-destructive/20 bg-destructive/5",
    dot: "bg-destructive",
  },
  info: {
    container: "border-primary/20 bg-primary/5",
    dot: "bg-primary",
  },
  warning: {
    container: "border-amber-500/25 bg-amber-500/5",
    dot: "bg-amber-500",
  },
}

export const tendenciaVariantEstilos: Record<TendenciaVariant, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

export const detalleKpiVariantEstilos: Record<DetalleKpiVariant, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

export function colorCategoricoPorIndice(indice: number): string {
  return chartPaletteCategorica[indice % chartPaletteCategorica.length]!
}

export function colorMotivoRechazoPorIndice(indice: number): string {
  return chartPaletteMotivosRechazo[indice % chartPaletteMotivosRechazo.length]!
}

export function colorMotivoRecogidaPorIndice(indice: number): string {
  return chartPaletteMotivosRecogida[indice % chartPaletteMotivosRecogida.length]!
}
