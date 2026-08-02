import {
  etiquetaCampo,
  etiquetaValor,
} from "@/modules/dietas-cocina/auditoria/lib/auditoriaCatalogo"
import type { CambioLegible } from "@/modules/dietas-cocina/types/audit"

export type { CambioLegible }

export interface CambiosFormateados {
  resumen: string
  cambios: CambioLegible[]
  jsonTecnico?: { antes?: string; despues?: string }
}

function parseJsonSeguro(raw: string | null | undefined): Record<string, unknown> | null {
  const texto = String(raw ?? "").trim()
  if (!texto || texto === "null" || texto === "{}") return null
  try {
    const parsed = JSON.parse(texto) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return { valor: parsed }
  } catch {
    return null
  }
}

function formatearJsonIndentado(raw: string | null | undefined): string | undefined {
  const texto = String(raw ?? "").trim()
  if (!texto || texto === "null") return undefined
  try {
    return JSON.stringify(JSON.parse(texto), null, 2)
  } catch {
    return texto
  }
}

function clavesUnificadas(
  antes: Record<string, unknown> | null,
  despues: Record<string, unknown> | null,
): string[] {
  const claves = new Set<string>()
  if (antes) Object.keys(antes).forEach((k) => claves.add(k))
  if (despues) Object.keys(despues).forEach((k) => claves.add(k))
  return [...claves].sort()
}

function construirCambio(
  clave: string,
  valorAntes: unknown,
  valorDespues: unknown,
): CambioLegible | null {
  const anteriorFmt = etiquetaValor(valorAntes)
  const nuevoFmt = etiquetaValor(valorDespues)

  if (valorAntes === undefined && valorDespues !== undefined) {
    return { campo: etiquetaCampo(clave), nuevo: nuevoFmt }
  }
  if (valorAntes !== undefined && valorDespues === undefined) {
    return { campo: etiquetaCampo(clave), anterior: anteriorFmt }
  }
  if (anteriorFmt === nuevoFmt) return null
  return {
    campo: etiquetaCampo(clave),
    anterior: anteriorFmt,
    nuevo: nuevoFmt,
  }
}

function resumenDesdeCambios(cambios: CambioLegible[]): string {
  if (cambios.length === 0) return "Sin cambios registrados"

  const prioridad = ["Estado logístico", "Estado", "Consistencia", "Código"]
  const ordenados = [...cambios].sort((a, b) => {
    const ia = prioridad.indexOf(a.campo)
    const ib = prioridad.indexOf(b.campo)
    const pa = ia === -1 ? 99 : ia
    const pb = ib === -1 ? 99 : ib
    return pa - pb
  })

  const conDiff = ordenados.find((c) => c.anterior && c.nuevo)
  if (conDiff) {
    const base = `${conDiff.campo}: ${conDiff.anterior} → ${conDiff.nuevo}`
    if (cambios.length === 1) return base
    return `${base} (+${cambios.length - 1} más)`
  }

  if (cambios.length === 1) {
    const c = cambios[0]!
    if (c.nuevo) return `${c.campo}: ${c.nuevo}`
    if (c.anterior) return `${c.campo}: ${c.anterior}`
  }

  return ordenados
    .slice(0, 2)
    .map((c) => {
      if (c.anterior && c.nuevo) return `${c.campo}: ${c.anterior} → ${c.nuevo}`
      if (c.nuevo) return `${c.campo}: ${c.nuevo}`
      return `${c.campo}: ${c.anterior}`
    })
    .join(" · ")
}

function resumenCreacion(despues: Record<string, unknown>): string {
  if (typeof despues.count === "number") {
    const tipo =
      "etiquetasIds" in despues
        ? "etiqueta"
        : "ordenIds" in despues
          ? "orden"
          : "registro"
    const plural = despues.count === 1 ? "" : "s"
    return `Se registraron ${despues.count} ${tipo}${plural}`
  }
  if (despues.codigo) {
    return `Código: ${etiquetaValor(despues.codigo)}`
  }
  const entradas = Object.entries(despues).slice(0, 2)
  if (entradas.length === 0) return "Registro creado"
  return entradas
    .map(([k, v]) => `${etiquetaCampo(k)}: ${etiquetaValor(v)}`)
    .join(" · ")
}

function resumenTextoPlano(antes: string | null | undefined, despues: string | null | undefined): string {
  const a = String(antes ?? "").trim()
  const d = String(despues ?? "").trim()
  if (a && d) return `${truncar(a)} → ${truncar(d)}`
  if (d) return truncar(d)
  if (a) return truncar(a)
  return "—"
}

function truncar(texto: string, max = 80): string {
  if (texto.length <= max) return texto
  return `${texto.slice(0, max)}…`
}

export function formatearCambiosAuditoria(
  datosAntes?: string | null,
  datosDespues?: string | null,
): CambiosFormateados {
  const jsonTecnico = {
    antes: formatearJsonIndentado(datosAntes),
    despues: formatearJsonIndentado(datosDespues),
  }

  const antes = parseJsonSeguro(datosAntes)
  const despues = parseJsonSeguro(datosDespues)

  if (!antes && !despues) {
    const resumen = resumenTextoPlano(datosAntes, datosDespues)
    return {
      resumen,
      cambios: [],
      jsonTecnico:
        jsonTecnico.antes || jsonTecnico.despues ? jsonTecnico : undefined,
    }
  }

  if (!antes && despues) {
    if (typeof despues.count === "number") {
      const cambios = clavesUnificadas(null, despues)
        .map((k) => construirCambio(k, undefined, despues[k]))
        .filter((c): c is CambioLegible => c !== null)
      return {
        resumen: resumenCreacion(despues),
        cambios,
        jsonTecnico,
      }
    }

    const cambios = clavesUnificadas(null, despues)
      .map((k) => construirCambio(k, undefined, despues[k]))
      .filter((c): c is CambioLegible => c !== null)
    return {
      resumen: resumenDesdeCambios(cambios),
      cambios,
      jsonTecnico,
    }
  }

  const cambios = clavesUnificadas(antes, despues)
    .map((k) => construirCambio(k, antes?.[k], despues?.[k]))
    .filter((c): c is CambioLegible => c !== null)

  return {
    resumen: resumenDesdeCambios(cambios),
    cambios,
    jsonTecnico,
  }
}

export function cambiosFormateadosALineas(
  formateado: CambiosFormateados,
): { prefijo: "-" | "+"; texto: string }[] {
  if (formateado.cambios.length === 0) {
    if (formateado.resumen && formateado.resumen !== "—") {
      return [{ prefijo: "+", texto: formateado.resumen }]
    }
    return []
  }
  return formateado.cambios.flatMap((c) => {
    const lineas: { prefijo: "-" | "+"; texto: string }[] = []
    if (c.anterior) lineas.push({ prefijo: "-", texto: `${c.campo}: ${c.anterior}` })
    if (c.nuevo) lineas.push({ prefijo: "+", texto: `${c.campo}: ${c.nuevo}` })
    return lineas
  })
}
