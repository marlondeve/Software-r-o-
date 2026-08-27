export type PeriodoHora = "a. m." | "p. m."

export interface PartesHora12 {
  hora: number
  minuto: number
  periodo: PeriodoHora
}

export interface PartesHora24 {
  hora: number
  minuto: number
}

/** Normaliza "H:mm" o "HH:mm" a formato 24 h con dos dígitos (valor interno/API). */
export function formatearHora24(hora24: string): string {
  const [horasStr, minutosStr] = hora24.split(":")
  const horas = Number.parseInt(horasStr ?? "", 10)
  const minutos = Number.parseInt(minutosStr ?? "", 10)

  if (Number.isNaN(horas) || Number.isNaN(minutos)) return hora24

  return `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`
}

/** Parsea "HH:mm" a componentes 24 h (0–23). */
export function parsearPartesHora24(hora24: string): PartesHora24 {
  const [horasStr, minutosStr] = hora24.split(":")
  const horas = Number.parseInt(horasStr ?? "", 10)
  const minutos = Number.parseInt(minutosStr ?? "", 10)

  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return { hora: 7, minuto: 0 }
  }

  return {
    hora: Math.min(23, Math.max(0, horas)),
    minuto: Math.min(59, Math.max(0, minutos)),
  }
}

/** Construye "HH:mm" desde hora y minuto en 24 h. */
export function construirHoraDesdePartes24(hora: number, minuto: number): string {
  const horasNormalizadas = ((hora % 24) + 24) % 24
  const minutosNormalizados = Math.min(59, Math.max(0, minuto))
  return `${horasNormalizadas.toString().padStart(2, "0")}:${minutosNormalizados
    .toString()
    .padStart(2, "0")}`
}

/** Parsea "HH:mm" (24 h) a componentes en 12 h. */
export function parsearHora24(hora24: string): PartesHora12 {
  const partes = parsearPartesHora24(hora24)
  return {
    hora: partes.hora % 12 || 12,
    minuto: partes.minuto,
    periodo: partes.hora >= 12 ? "p. m." : "a. m.",
  }
}

/** Convierte componentes 12 h a "HH:mm" (24 h). */
export function construirHora24(
  hora: number,
  minuto: number,
  periodo: PeriodoHora,
): string {
  let horas24 = hora % 12
  if (periodo === "p. m.") horas24 += 12
  return construirHoraDesdePartes24(horas24, minuto)
}

/** Formatea "HH:mm" para mostrar en 12 h (p. ej. "04:30 p. m."). */
export function formatearHora12(hora24: string): string {
  const { hora, minuto, periodo } = parsearHora24(formatearHora24(hora24))
  return `${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")} ${periodo}`
}

/** Zona operativa del hospital. Todas las horas visibles van en hora Colombia. */
export const ZONA_HORARIA_COLOMBIA = "America/Bogota"

/** Interpreta ISO del API como UTC cuando no trae zona horaria. */
export function parsearFechaApi(iso: string): Date {
  const trimmed = iso.trim()
  if (!trimmed) return new Date(Number.NaN)
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed)
  }
  return new Date(`${trimmed}Z`)
}

function partesHoraEnColombia(fecha: Date): { hora: number; minuto: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA_COLOMBIA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha)
  return {
    hora: Number(partes.find((p) => p.type === "hour")?.value ?? "0"),
    minuto: Number(partes.find((p) => p.type === "minute")?.value ?? "0"),
  }
}

function partesFechaEnColombia(fecha: Date): {
  anio: number
  mes: number
  dia: number
} {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA_COLOMBIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha)
  return {
    anio: Number(partes.find((p) => p.type === "year")?.value ?? "0"),
    mes: Number(partes.find((p) => p.type === "month")?.value ?? "0"),
    dia: Number(partes.find((p) => p.type === "day")?.value ?? "0"),
  }
}

/** Hora en 12 h desde ISO del API (UTC, a menudo sin Z) en hora Colombia. */
export function formatearHoraDesdeIsoApi(iso: string): string {
  const fecha = parsearFechaApi(iso)
  if (Number.isNaN(fecha.getTime())) return "—"
  return formatearHoraDesdeFecha(fecha)
}

/** Hora de un instante en formato 12 h, siempre America/Bogota. */
export function formatearHoraDesdeFecha(fecha = new Date()): string {
  const { hora, minuto } = partesHoraEnColombia(fecha)
  return formatearHora12(
    `${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`,
  )
}

/** Formatea un rango de horas en 12 h. */
export function formatearRangoHora12(inicio: string, fin: string): string {
  return `${formatearHora12(inicio)} – ${formatearHora12(fin)}`
}

/** Convierte una hora con a. m./p. m. (o AM/PM) a "HH:mm". */
export function normalizarHoraEnTexto(texto: string): string {
  const match = texto.match(
    /(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.\s*m\.|p\.\s*m\.|am|pm)?/i,
  )
  if (!match) return texto

  let horas = Number.parseInt(match[1] ?? "0", 10)
  const minutos = match[2] ?? "00"
  const periodo = match[3]?.toLowerCase().replace(/\s/g, "") ?? ""

  if (periodo.startsWith("p") && horas < 12) horas += 12
  if (periodo.startsWith("a") && horas === 12) horas = 0

  return `${horas.toString().padStart(2, "0")}:${minutos}`
}

/** Fecha/hora Colombia para etiqueta: `dd/MM/yyyy hh:mm a. m.` */
export function formatearFechaHoraLocalEtiqueta(fecha: Date): string {
  if (Number.isNaN(fecha.getTime())) return "—"
  const { anio, mes, dia } = partesFechaEnColombia(fecha)
  return `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}/${anio} ${formatearHoraDesdeFecha(fecha)}`
}

/** Fecha operativa sin hora (calendario, no instante UTC). */
function formatearSoloFechaCalendario(isoOFecha: string): string | null {
  const match = isoOFecha
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]00:00(?::00(?:\.\d+)?)?)?(?:Z|[+-]00:00)?$/i)
  if (!match) return null
  return `${match[3]}/${match[2]}/${match[1]}`
}

/**
 * Convierte la porción horaria a 12 h.
 * Si el valor es ISO del API (UTC, a menudo sin Z), lo muestra en hora Colombia.
 */
export function formatearFechaHoraEnCadena(texto: string): string {
  if (!texto) return texto
  const trimmed = texto.trim()

  const soloFecha = formatearSoloFechaCalendario(trimmed)
  if (soloFecha) return soloFecha

  // ISO / fecha-hora API → local (evita "2026-08-26T12:00 a. m.")
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || /T\d{2}:\d{2}/.test(trimmed)) {
    const fecha = parsearFechaApi(trimmed)
    if (!Number.isNaN(fecha.getTime())) {
      return formatearFechaHoraLocalEtiqueta(fecha)
    }
  }

  return trimmed.replace(
    /(\d{1,2}:\d{2}(?::\d{2})?\s*(?:a\.\s*m\.|p\.\s*m\.|AM|PM)?)/gi,
    (coincidencia) => formatearHora12(normalizarHoraEnTexto(coincidencia)),
  )
}

/** @deprecated Usar {@link formatearRangoHora12} */
export function formatearRangoHora24(inicio: string, fin: string): string {
  return formatearRangoHora12(inicio, fin)
}
