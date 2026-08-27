import { formatearHoraDesdeFecha, ZONA_HORARIA_COLOMBIA } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

function capitalizar(texto: string): string {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatearFechaOperativa(fecha = new Date()): string {
  const texto = fecha.toLocaleDateString("es-CO", {
    timeZone: ZONA_HORARIA_COLOMBIA,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return capitalizar(texto)
}

export function formatearHoraActualizacion(fecha = new Date()): string {
  return formatearHoraDesdeFecha(fecha)
}

/** p. ej. "Hoy, 07:21 p. m." */
export function formatearUltimaActualizacionReporte(fecha = new Date()): string {
  const hora = formatearHoraActualizacion(fecha)
  const mismaFecha = fecha.toLocaleDateString("en-CA", {
    timeZone: ZONA_HORARIA_COLOMBIA,
  }) === new Date().toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA_COLOMBIA })
  if (mismaFecha) return `Hoy, ${hora}`
  return `${formatearFechaOperativa(fecha)} · ${hora}`
}
