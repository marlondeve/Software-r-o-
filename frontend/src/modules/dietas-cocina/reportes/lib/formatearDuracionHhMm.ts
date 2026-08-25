/**
 * Formatea una duración en minutos como HH:MM (p. ej. 95 → "01:35").
 */
export function formatearDuracionHhMm(minutos: number): string {
  const total = Math.max(0, Math.round(Number.isFinite(minutos) ? minutos : 0))
  const horas = Math.floor(total / 60)
  const mins = total % 60
  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

/**
 * Normaliza textos de hito ("95 min", "01:35", "95") a HH:MM.
 */
export function normalizarTiempoHitoAHhMm(tiempo: string): string {
  const raw = tiempo.trim()
  if (!raw || raw === "—") return raw

  const hhmm = raw.match(/^(\d{1,4}):([0-5]\d)$/)
  if (hhmm) {
    return `${hhmm[1].padStart(2, "0")}:${hhmm[2]}`
  }

  const minutos = Number.parseFloat(raw.replace(/[^0-9.-]/g, ""))
  if (!Number.isFinite(minutos)) return raw
  return formatearDuracionHhMm(minutos)
}
