import {
  formatearFechaHoraEnCadena,
  formatearHoraDesdeFecha,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"

export function tituloTipoDieta(tipoDieta: string | null | undefined): string {
  const valor = tipoDieta?.trim()
  if (!valor) return "Sin dieta asignada"
  if (/^dieta\s+/i.test(valor)) return valor
  return `Dieta ${valor}`
}

export function formatearSolicitadoEn(valor?: string | null): string | undefined {
  if (!valor?.trim()) return undefined

  const texto = valor.trim()
  const parsed = Date.parse(texto)
  if (!Number.isNaN(parsed)) {
    const fecha = new Date(parsed)
    const hoy = new Date()
    const esHoy =
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getDate() === hoy.getDate()
    const hora = formatearHoraDesdeFecha(fecha)
    return esHoy
      ? `Hoy, ${hora}`
      : `${fecha.toLocaleDateString("es-CO")} · ${hora}`
  }

  return formatearFechaHoraEnCadena(texto)
}

export function formatearFechaTrazabilidad(valor: unknown): string {
  if (valor == null || valor === "") return "—"
  const texto = String(valor)
  const parsed = Date.parse(texto)
  if (Number.isNaN(parsed)) return formatearFechaHoraEnCadena(texto)

  const fecha = new Date(parsed)
  const hoy = new Date()
  const esHoy =
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  const hora = formatearHoraDesdeFecha(fecha)
  return esHoy ? `Hoy, ${hora}` : `${fecha.toLocaleDateString("es-CO")} · ${hora}`
}
