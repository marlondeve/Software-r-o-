import type { DietaCatalogo } from "@/modules/dietas-cocina/types/catalog"
const ALIAS_TIPO_DIETA: Record<string, string> = {
  General: "Normal",
  NORMAL: "Normal",
  Blanda: "Blanda Hospitalaria",
  "Blanda / Sin sal": "Blanda / Sin sal",
  BLANDA: "Blanda Hospitalaria",
  HIPOSÓDICA: "Hiposódica",
  Hiposódica: "Hiposódica",
  DIABÉTICA: "Diabética",
  Diabética: "Diabética",
  PROTEICA: "Proteica",
  Proteica: "Proteica",
  "Líquida clara": "Líquida clara",
  "Líquida completa": "Líquida completa",
  Hipocalórica: "Hipocalórica",
}

export function normalizarNombreTipoDieta(tipo: string): string {
  return ALIAS_TIPO_DIETA[tipo] ?? tipo
}

export function resolverTarifaPorTipoDieta(
  tipoDieta: string,
  catalogo: DietaCatalogo[],
): DietaCatalogo | undefined {
  const normalizado = normalizarNombreTipoDieta(tipoDieta)
  return (
    catalogo.find(
      (d) =>
        d.activa &&
        (d.nombre.toLowerCase() === normalizado.toLowerCase() ||
          d.nombre.toLowerCase().includes(normalizado.toLowerCase()) ||
          normalizado.toLowerCase().includes(d.nombre.toLowerCase())),
    ) ?? catalogo.find((d) => d.nombre === "Normal")
  )
}

export function formatearTarifaCOP(monto: number): string {
  return formatearMonedaCOP(monto)
}

/** Interpreta montos en formato es-CO ($48.000,00). */
export function parseMonedaCOP(valor: string): number {
  const limpio = valor.replace(/[^\d,.-]/g, "").trim()
  if (!limpio) return 0

  const negativo = limpio.startsWith("-")
  const digitos = limpio.replace(/^-/, "")

  if (digitos.includes(",")) {
    const normalizado = digitos.replace(/\./g, "").replace(",", ".")
    const monto = Number.parseFloat(normalizado) || 0
    return negativo ? -monto : monto
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(digitos)) {
    const monto = Number.parseInt(digitos.replace(/\./g, ""), 10)
    return negativo ? -monto : monto
  }

  const monto = Number.parseFloat(digitos) || 0
  return negativo ? -monto : monto
}

export function formatearMonedaCOP(monto: number, conSigno = false): string {
  const formato = Math.abs(monto).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  if (conSigno && monto > 0) return `+$${formato}`
  if (conSigno && monto < 0) return `-$${formato}`
  return `$${formato}`
}

export function parseDifEconomica(valor: string): number {
  const texto = valor.trim()
  const monto = parseMonedaCOP(texto.replace(/^[+-]/, ""))
  if (texto.startsWith("-")) return -monto
  if (texto.startsWith("+")) return monto
  return monto
}
