import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  mapCategoriasEdadList,
  mapCategoriasEdadToRequest,
  mapClasificarEdadResponse,
  mapTiemposComidaConfig,
  mapTiemposComidaToRequest,
} from "@/modules/dietas-cocina/api/mappers"
import { buildDietasCocinaPath, extraerCuerpoApi } from "@/modules/dietas-cocina/api/utils"
import type { ModoCargaAnticipada } from "@/modules/dietas-cocina/types/enums"
import type { CategoriaEdad, ParametrosTiempoComida } from "@/modules/dietas-cocina/types/parameters"

const USUARIO_PARAMETROS_DEFAULT = "admin"

export async function obtenerTiemposComidaConfig(): Promise<{
  tiempos: ParametrosTiempoComida[]
  modoCarga: ModoCargaAnticipada
}> {
  const { data } = await apiClient.get<ApiResponse<unknown>>(
    buildDietasCocinaPath("/parametros/tiempos-comida"),
  )
  return mapTiemposComidaConfig(extraerCuerpoApi(data))
}

export async function obtenerTiemposComida(): Promise<ParametrosTiempoComida[]> {
  const config = await obtenerTiemposComidaConfig()
  return config.tiempos
}

export async function actualizarTiemposComida(
  tiempos: ParametrosTiempoComida[],
  usuario = USUARIO_PARAMETROS_DEFAULT,
  modoCarga?: ModoCargaAnticipada,
): Promise<ParametrosTiempoComida[]> {
  const { data } = await apiClient.put<ApiResponse<unknown>>(
    buildDietasCocinaPath("/parametros/tiempos-comida"),
    mapTiemposComidaToRequest(tiempos, usuario, modoCarga),
  )
  return mapTiemposComidaConfig(extraerCuerpoApi(data)).tiempos
}

export async function obtenerTiposPaciente(): Promise<CategoriaEdad[]> {
  const { data } = await apiClient.get<ApiResponse<unknown>>(
    buildDietasCocinaPath("/parametros/tipos-paciente"),
  )
  return mapCategoriasEdadList(extraerCuerpoApi(data))
}

export async function actualizarTiposPaciente(
  categorias: CategoriaEdad[],
  usuario = USUARIO_PARAMETROS_DEFAULT,
): Promise<CategoriaEdad[]> {
  const { data } = await apiClient.put<ApiResponse<unknown>>(
    buildDietasCocinaPath("/parametros/tipos-paciente"),
    mapCategoriasEdadToRequest(categorias, usuario),
  )
  return mapCategoriasEdadList(extraerCuerpoApi(data))
}

export async function clasificarEdad(edad: number) {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    buildDietasCocinaPath("/parametros/tipos-paciente/clasificar"),
    { edad },
  )
  return mapClasificarEdadResponse(
    extraerCuerpoApi(data) as Record<string, unknown>,
  )
}
