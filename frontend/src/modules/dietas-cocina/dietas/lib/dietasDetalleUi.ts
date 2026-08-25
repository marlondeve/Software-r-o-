import {
  formatearFechaHoraEnCadena,
  formatearHoraDesdeFecha,
  parsearFechaApi,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"

export function tituloTipoDieta(tipoDieta: string | null | undefined): string {
  const valor = tipoDieta?.trim()
  if (!valor) return "Sin dieta asignada"
  if (/^dieta\s+/i.test(valor)) return valor
  return `Dieta ${valor}`
}

function esMismaFechaLocal(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** ISO del API (UTC, a menudo sin Z) → texto local es-CO. */
function formatearFechaLocalDesdeApi(valor: string): string | null {
  const texto = valor.trim()
  if (!texto) return null

  // ISO / fecha con hora: interpretar como UTC si no trae zona.
  if (/^\d{4}-\d{2}-\d{2}/.test(texto) || texto.includes("T")) {
    const fecha = parsearFechaApi(texto)
    if (Number.isNaN(fecha.getTime())) return null
    const hora = formatearHoraDesdeFecha(fecha)
    return esMismaFechaLocal(fecha, new Date())
      ? `Hoy, ${hora}`
      : `${fecha.toLocaleDateString("es-CO")} · ${hora}`
  }

  const parsed = Date.parse(texto)
  if (Number.isNaN(parsed)) return null
  const fecha = new Date(parsed)
  const hora = formatearHoraDesdeFecha(fecha)
  return esMismaFechaLocal(fecha, new Date())
    ? `Hoy, ${hora}`
    : `${fecha.toLocaleDateString("es-CO")} · ${hora}`
}

export function formatearSolicitadoEn(valor?: string | null): string | undefined {
  if (!valor?.trim()) return undefined
  return formatearFechaLocalDesdeApi(valor.trim()) ?? formatearFechaHoraEnCadena(valor.trim())
}

export function formatearFechaTrazabilidad(valor: unknown): string {
  if (valor == null || valor === "") return "—"
  const texto = String(valor)
  return formatearFechaLocalDesdeApi(texto) ?? formatearFechaHoraEnCadena(texto)
}
