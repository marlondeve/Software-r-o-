import type { DietaCatalogo } from "@/modules/dietas-cocina/dietas-tarifas/datos/mockDietasTarifas"

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
  return `$${monto.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
