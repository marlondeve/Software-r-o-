import {
  formatearFechaHoraEnCadena,
  formatearHoraDesdeFecha,
  parsearFechaApi,
  ZONA_HORARIA_COLOMBIA,
} from "@/modules/dietas-cocina/parametros/lib/formatoHora"

export function tituloTipoDieta(tipoDieta: string | null | undefined): string {
  const valor = tipoDieta?.trim()
  if (!valor) return "Sin dieta asignada"
  if (/^dieta\s+/i.test(valor)) return valor
  return `Dieta ${valor}`
}

function partesCalendarioColombia(fecha: Date) {
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

function esMismoDiaColombia(a: Date, b: Date): boolean {
  const ca = partesCalendarioColombia(a)
  const cb = partesCalendarioColombia(b)
  return ca.anio === cb.anio && ca.mes === cb.mes && ca.dia === cb.dia
}

function fechaCortaColombia(fecha: Date): string {
  const { anio, mes, dia } = partesCalendarioColombia(fecha)
  return `${dia.toString().padStart(2, "0")}/${mes.toString().padStart(2, "0")}/${anio}`
}

/** ISO del API (UTC, a menudo sin Z) → texto en hora Colombia. */
function formatearFechaLocalDesdeApi(valor: string): string | null {
  const texto = valor.trim()
  if (!texto) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(texto) || texto.includes("T")) {
    const fecha = parsearFechaApi(texto)
    if (Number.isNaN(fecha.getTime())) return null
    const hora = formatearHoraDesdeFecha(fecha)
    return esMismoDiaColombia(fecha, new Date())
      ? `Hoy, ${hora}`
      : `${fechaCortaColombia(fecha)} · ${hora}`
  }

  const parsed = Date.parse(texto)
  if (Number.isNaN(parsed)) return null
  const fecha = new Date(parsed)
  const hora = formatearHoraDesdeFecha(fecha)
  return esMismoDiaColombia(fecha, new Date())
    ? `Hoy, ${hora}`
    : `${fechaCortaColombia(fecha)} · ${hora}`
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

function puntajeNombreSolicitante(valor?: string): number {
  if (!valor) return 0
  if (/^\d+$/.test(valor)) return 1
  if (/\s/.test(valor)) return 3
  return 2
}

/** Prefiere nombre completo frente a cédula o usuario de login al mezclar censo y detalle. */
export function preferirNombreSolicitante(
  actual?: string | null,
  previo?: string | null,
): string | undefined {
  const a = actual?.trim() || undefined
  const b = previo?.trim() || undefined
  if (puntajeNombreSolicitante(a) >= puntajeNombreSolicitante(b)) return a ?? b
  return b
}
