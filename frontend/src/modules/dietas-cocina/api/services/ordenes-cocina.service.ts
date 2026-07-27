import {
  enriquecerOrdenesConApi,
  mapFilasDietasToOrdenesCocina,
} from "@/modules/dietas-cocina/api/mappers/ordenCocina.mapper"
import { cargarFilasCensoDesdeApi } from "@/modules/dietas-cocina/api/services/censo-dietas.service"
import { listarEtiquetas } from "@/modules/dietas-cocina/api/services/etiquetas.service"
import { listarOrdenesCocina } from "@/modules/dietas-cocina/api/services/ordenes-cocina-api.service"
import { configDietasOperativas } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

/** Bandejas de cocina: censo + etiquetas enriquecidas con GET /ordenes-cocina. */
export async function cargarOrdenesCocinaDesdeCenso(
  comida: TiempoComida = configDietasOperativas.comidaActiva,
): Promise<{
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
}> {
  const [censo, etiquetas, ordenesApi] = await Promise.all([
    cargarFilasCensoDesdeApi(comida, []),
    listarEtiquetas(),
    listarOrdenesCocina({
      fecha: fechaOperativaHoy(),
      comida,
    }).catch(() => []),
  ])

  const ordenesBase = mapFilasDietasToOrdenesCocina(censo.filas, etiquetas)

  return {
    ordenes: enriquecerOrdenesConApi(ordenesBase, ordenesApi),
    etiquetas,
  }
}
