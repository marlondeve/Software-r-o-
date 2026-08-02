/** Pasos estándar de flujos QR: escaneo → verificación → confirmación en pantalla de éxito. */
export const ETIQUETAS_PASOS_FLUJO = ["Escanear", "Comprobar", "Éxito"] as const

export const ETIQUETAS_TOTAL_PASOS_FLUJO = ETIQUETAS_PASOS_FLUJO.length

export type EtiquetaPasoFlujo = (typeof ETIQUETAS_PASOS_FLUJO)[number]
