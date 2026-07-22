/** Convierte "HH:mm" (24 h) a formato 12 h, p. ej. "07:00 a. m." */
export function formatearHora12(hora24: string): string {
  const [horasStr, minutosStr] = hora24.split(":")
  const horas = Number.parseInt(horasStr ?? "", 10)
  const minutos = Number.parseInt(minutosStr ?? "", 10)

  if (Number.isNaN(horas) || Number.isNaN(minutos)) return hora24

  const periodo = horas >= 12 ? "p. m." : "a. m."
  const horas12 = horas % 12 || 12

  return `${horas12.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")} ${periodo}`
}

export type PeriodoHora = "a. m." | "p. m."

export interface PartesHora12 {
  hora: number
  minuto: number
  periodo: PeriodoHora
}

/** Parsea "HH:mm" (24 h) a componentes en 12 h. */
export function parsearHora24(hora24: string): PartesHora12 {
  const [horasStr, minutosStr] = hora24.split(":")
  const horas = Number.parseInt(horasStr ?? "", 10)
  const minutos = Number.parseInt(minutosStr ?? "", 10)

  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return { hora: 12, minuto: 0, periodo: "a. m." }
  }

  return {
    hora: horas % 12 || 12,
    minuto: minutos,
    periodo: horas >= 12 ? "p. m." : "a. m.",
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
  return `${horas24.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`
}

/** Formatea un rango de horas en 12 h. */
export function formatearRangoHora12(inicio: string, fin: string): string {
  return `${formatearHora12(inicio)} – ${formatearHora12(fin)}`
}
