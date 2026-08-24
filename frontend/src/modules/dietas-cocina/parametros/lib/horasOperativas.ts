/** Convierte "HH:mm" a minutos desde medianoche. */
export function minutosDesdeHora24(hora24: string): number {
  const [horasStr, minutosStr] = hora24.split(":")
  const horas = Number.parseInt(horasStr ?? "", 10)
  const minutos = Number.parseInt(minutosStr ?? "", 10)
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return 0
  return horas * 60 + minutos
}

export function minutosDelDia(fecha: Date): number {
  return fecha.getHours() * 60 + fecha.getMinutes()
}

const MINUTOS_DIA = 24 * 60

/**
 * Indica si `ahora` está entre inicio y fin (ambos inclusivos).
 * Si inicio > fin, la ventana cruza medianoche (ej. 19:00 → 09:30).
 */
export function estaEnRangoHorario(
  ahora: number,
  inicio: number,
  fin: number,
): boolean {
  if (inicio <= fin) return ahora >= inicio && ahora <= fin
  return ahora >= inicio || ahora <= fin
}

/** Minutos hasta el próximo `objetivo` (puede ser al día siguiente). */
export function minutosHastaHora(ahora: number, objetivo: number): number {
  if (objetivo >= ahora) return objetivo - ahora
  return objetivo + MINUTOS_DIA - ahora
}

/** Suma minutos a una hora "HH:mm" y devuelve "HH:mm" (24 h). */
export function sumarMinutosHora(hora24: string, minutos: number): string {
  const total = (minutosDesdeHora24(hora24) + minutos + MINUTOS_DIA) % MINUTOS_DIA
  const horas = Math.floor(total / 60)
  const mins = total % 60
  return `${horas.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

export function horaDesdeMinutos(total: number): string {
  const normalizado = ((total % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA
  const horas = Math.floor(normalizado / 60)
  const mins = normalizado % 60
  return `${horas.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
