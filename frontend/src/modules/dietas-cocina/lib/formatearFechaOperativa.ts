function capitalizar(texto: string): string {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatearFechaOperativa(fecha = new Date()): string {
  const texto = fecha.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  return capitalizar(texto)
}

export function formatearHoraActualizacion(fecha = new Date()): string {
  return fecha.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/** p. ej. "Hoy, 6:15 p. m." — sin mezclar formato 24 h con AM/PM. */
export function formatearUltimaActualizacionReporte(fecha = new Date()): string {
  const hoy = new Date()
  const hora = formatearHoraActualizacion(fecha)
  const esHoy = fecha.toDateString() === hoy.toDateString()
  if (esHoy) return `Hoy, ${hora}`
  return `${formatearFechaOperativa(fecha)} · ${hora}`
}
