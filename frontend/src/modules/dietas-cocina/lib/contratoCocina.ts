import type { EstadoCocina, TiempoComida } from "@/modules/dietas-cocina/types/enums"

export const LINEA_NORMALES_Y_DERIVADAS = "Normales y derivadas"

const TIPOS_DERIVADOS = new Set([
  "normal para la edad",
  "normales y derivadas",
  "hiposodica",
  "hiposódica",
  "hipograsa",
  "hipoglucida",
  "hipoglúcida",
  "astringente",
  "gastroprotectora",
  "inmunoprotectora",
])

const MERENDAS = new Set<TiempoComida>([
  "merienda-manana",
  "merienda-tarde",
  "merienda-noche",
])

export function lineaContratoFcr(nombreTipoDieta?: string | null): string {
  const nombre = (nombreTipoDieta ?? "").trim()
  if (!nombre || TIPOS_DERIVADOS.has(nombre.toLowerCase())) {
    return LINEA_NORMALES_Y_DERIVADAS
  }
  if (/licuado/i.test(nombre)) return "Hiperproteico licuado completa"
  if (/merienda\s*ma[nñ]ana/i.test(nombre)) return "Merienda mañana"
  if (/merienda\s*tarde/i.test(nombre)) return "Merienda tarde"
  if (/merienda\s*noche/i.test(nombre)) return "Merienda noche"
  return nombre
}

export function esMeriendaFcr(comida: TiempoComida): boolean {
  return MERENDAS.has(comida)
}

export function esSuministradaFcr(opts: {
  comida: TiempoComida
  estadoCocina: EstadoCocina | string
  cancelada?: boolean
  tieneEtiqueta: boolean
}): boolean {
  if (esMeriendaFcr(opts.comida)) {
    return opts.tieneEtiqueta && !opts.cancelada
  }
  if (opts.tieneEtiqueta) return true
  if (
    opts.estadoCocina === "despachada" ||
    opts.estadoCocina === "lista" ||
    opts.estadoCocina === "en_preparacion"
  ) {
    return true
  }
  if (
    (opts.estadoCocina === "cancelada" || opts.cancelada) &&
    (opts.comida === "almuerzo" || opts.comida === "cena")
  ) {
    return true
  }
  return false
}

export const PLANTILLA_FCR: Array<{
  comida: TiempoComida
  linea: string
  etiqueta: string
}> = [
  { comida: "desayuno", linea: LINEA_NORMALES_Y_DERIVADAS, etiqueta: "Desayunos normales y derivadas" },
  { comida: "desayuno", linea: "Hiperproteico", etiqueta: "Desayunos hiperproteico" },
  { comida: "desayuno", linea: "Niños de 10 m en adelante", etiqueta: "Niños de 10 m en adelante" },
  { comida: "desayuno", linea: "Hipoproteico", etiqueta: "Desayuno hipoproteico" },
  { comida: "desayuno", linea: "Líquido completa", etiqueta: "Desayuno líquido" },
  { comida: "desayuno", linea: "Líquidos claros", etiqueta: "Desayunos líquidos claros" },
  { comida: "desayuno", linea: "Hiperproteico licuado completa", etiqueta: "Desayuno hiperproteico licuado completa" },
  { comida: "almuerzo", linea: LINEA_NORMALES_Y_DERIVADAS, etiqueta: "Almuerzos normales y derivadas" },
  { comida: "almuerzo", linea: "Hiperproteico", etiqueta: "Almuerzos hiperproteico" },
  { comida: "almuerzo", linea: "Hipoproteico", etiqueta: "Almuerzo hipoproteico" },
  { comida: "almuerzo", linea: "Renal", etiqueta: "Almuerzo renal" },
  { comida: "almuerzo", linea: "Líquidos claros", etiqueta: "Almuerzo líquidos claros" },
  { comida: "almuerzo", linea: "Niños de 6 a 10 meses", etiqueta: "Niños de 6 a 10 meses" },
  { comida: "almuerzo", linea: "Niños de 10 m en adelante", etiqueta: "Niños de 10 m en adelante" },
  { comida: "almuerzo", linea: "Líquido completa", etiqueta: "Almuerzo líquido completa" },
  { comida: "almuerzo", linea: "Hiperproteico licuado completa", etiqueta: "Almuerzo hiperproteico licuado completo" },
  { comida: "cena", linea: LINEA_NORMALES_Y_DERIVADAS, etiqueta: "Cenas normales y derivadas" },
  { comida: "cena", linea: "Hiperproteico", etiqueta: "Cenas hiperproteico" },
  { comida: "cena", linea: "Niños de 6 a 10 meses", etiqueta: "Niños de 6 a 10 meses" },
  { comida: "cena", linea: "Niños de 10 m en adelante", etiqueta: "Niños de 10 m en adelante" },
  { comida: "cena", linea: "Hipoproteico", etiqueta: "Cena hipoproteica" },
  { comida: "cena", linea: "Renal", etiqueta: "Cena renal" },
  { comida: "cena", linea: "Líquidos claros", etiqueta: "Cena líquidos claros" },
  { comida: "cena", linea: "Líquido completa", etiqueta: "Cena líquida completa" },
  { comida: "cena", linea: "Hiperproteico licuado completa", etiqueta: "Cena hiperproteica licuada completa" },
  { comida: "merienda-manana", linea: "Merienda mañana", etiqueta: "Merienda mañana" },
  { comida: "merienda-tarde", linea: "Merienda tarde", etiqueta: "Merienda tarde" },
  { comida: "merienda-noche", linea: "Merienda noche", etiqueta: "Merienda noche" },
]

export function etiquetaComidaFcr(comida: TiempoComida): string {
  switch (comida) {
    case "desayuno":
      return "Desayuno"
    case "almuerzo":
      return "Almuerzo"
    case "cena":
      return "Cena"
    case "merienda-manana":
      return "Merienda mañana"
    case "merienda-tarde":
      return "Merienda tarde"
    case "merienda-noche":
      return "Merienda noche"
    default:
      return comida
  }
}
