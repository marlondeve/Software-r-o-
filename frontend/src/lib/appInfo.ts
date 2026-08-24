export const APP_NAME = "RIOSOFT"

export const APP_NAME_STEM = "RIO"

export const APP_NAME_ACCENT = "SOFT"

export const APP_OWNER = "Fundación Clínica del Río"

export const APP_DEVELOPER = "MeritumDev"

/** Año de inicio del copyright (mostrado como rango si difiere del actual). */
export const APP_COPYRIGHT_SINCE = 2026

export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "1.2.4"

export function obtenerTextoCopyright(anio = new Date().getFullYear()): string {
  const rango =
    anio > APP_COPYRIGHT_SINCE
      ? `${APP_COPYRIGHT_SINCE}–${anio}`
      : String(APP_COPYRIGHT_SINCE)
  return `© ${rango} ${APP_OWNER}. Todos los derechos reservados.`
}

/** Una línea para espacios reducidos (sidebar). */
export function obtenerTextoCopyrightCorto(anio = new Date().getFullYear()): string {
  return `© ${anio} ${APP_OWNER}`
}
