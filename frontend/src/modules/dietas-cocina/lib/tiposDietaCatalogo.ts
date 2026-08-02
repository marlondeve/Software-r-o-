import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { CatalogoDietaItem } from "@/modules/dietas-cocina/types/repositories"
import {
  esMerienda,
  esTipoDietaMerienda,
  tipoDietaPredeterminadoMerienda,
} from "@/modules/dietas-cocina/lib/comidaOperativa"

export function dietaTieneTarifaVigenteParaComida(
  item: Pick<CatalogoDietaItem, "nombre" | "tarifasVigentes">,
  comida: TiempoComida,
): boolean {
  const monto = item.tarifasVigentes?.[comida]
  return typeof monto === "number" && monto > 0
}

/** Tipos de dieta con tarifa vigente para la comida (catálogo FCR). */
export function tiposDietaParaComida(
  comida: TiempoComida,
  catalogo: CatalogoDietaItem[],
): string[] {
  const conTarifa = catalogo
    .filter((item) => dietaTieneTarifaVigenteParaComida(item, comida))
    .map((item) => item.nombre)

  if (conTarifa.length > 0) {
    return conTarifa
  }

  return tiposDietaParaComidaSinTarifas(comida, catalogo.map((item) => item.nombre))
}

function tiposDietaParaComidaSinTarifas(
  comida: TiempoComida,
  nombres: string[],
): string[] {
  if (esMerienda(comida)) {
    return nombres.filter(esTipoDietaMerienda)
  }
  return nombres.filter((nombre) => !esTipoDietaMerienda(nombre))
}

export function resolverTipoDietaAlCambiarComida(
  comida: TiempoComida,
  tipoDietaActual: string,
  catalogo: CatalogoDietaItem[],
): string {
  const tiposValidos = tiposDietaParaComida(comida, catalogo)
  if (tiposValidos.length === 0) return ""

  const predeterminadoMerienda = tipoDietaPredeterminadoMerienda(comida)
  if (
    predeterminadoMerienda &&
    tiposValidos.some(
      (tipo) => tipo.toLowerCase() === predeterminadoMerienda.toLowerCase(),
    )
  ) {
    return predeterminadoMerienda
  }

  const actualValido = tiposValidos.find(
    (tipo) => tipo.toLowerCase() === tipoDietaActual.trim().toLowerCase(),
  )
  if (actualValido) return actualValido

  return tiposValidos.length === 1 ? tiposValidos[0] : ""
}
