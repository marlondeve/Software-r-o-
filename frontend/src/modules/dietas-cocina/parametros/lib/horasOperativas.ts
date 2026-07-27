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

/** Suma minutos a una hora "HH:mm" y devuelve "HH:mm" (24 h). */
export function sumarMinutosHora(hora24: string, minutos: number): string {
  const total = (minutosDesdeHora24(hora24) + minutos + 24 * 60) % (24 * 60)
  const horas = Math.floor(total / 60)
  const mins = total % 60
  return `${horas.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

export function horaDesdeMinutos(total: number): string {
  const normalizado = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const horas = Math.floor(normalizado / 60)
  const mins = normalizado % 60
  return `${horas.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
