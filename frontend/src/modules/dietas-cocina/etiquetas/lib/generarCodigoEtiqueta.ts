/** Alfabeto legible (sin 0/O ni 1/I). */
const ALFABETO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

/** Formato corto: E{yyMMdd}-{4} → E260731-K7M3 */
export function generarCodigoEtiqueta(fecha = new Date()): string {
  const yy = fecha.getFullYear() % 100
  const mm = String(fecha.getMonth() + 1).padStart(2, "0")
  const dd = String(fecha.getDate()).padStart(2, "0")
  let sufijo = ""
  for (let i = 0; i < 4; i++) {
    sufijo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)]
  }
  return `E${yy}${mm}${dd}-${sufijo}`
}

export function normalizarCodigoEtiqueta(raw: string): string {
  const limpio = raw.replace(/\s+/g, "").trim().toUpperCase()
  if (limpio.startsWith("LBL:")) return limpio.slice(4)
  return limpio
}
