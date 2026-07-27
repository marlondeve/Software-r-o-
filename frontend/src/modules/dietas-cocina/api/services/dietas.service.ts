import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  mapEventoTrazabilidadDto,
  mapFilaDietaDtoToDomain,
  mapFilaDietaList,
  mapSolicitudToRequest,
  type DatosSolicitudDietaInput,
} from "@/modules/dietas-cocina/api/mappers"
import {
  buildDietasCocinaPath,
  extraerCuerpoApi,
  fechaOperativaHoy,
  normalizarClave,
} from "@/modules/dietas-cocina/api/utils"
import { repararTextoUtf8 } from "@/modules/dietas-cocina/api/utils/texto"
import type {
  BulkConfirmarRequestDto,
  BuscarDietasRequestDto,
  CatalogoDietaDto,
  CensoDietasDto,
  EventoTrazabilidadDto,
  FilaDietaDto,
  TarifaHistoricoDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { FilaDieta, EventoTrazabilidad } from "@/modules/dietas-cocina/types/diets"

let catalogoCache: CatalogoDietaDto[] | null = null

async function obtenerCatalogoInterno(): Promise<CatalogoDietaDto[]> {
  if (catalogoCache) return catalogoCache
  catalogoCache = await obtenerCatalogoDietas()
  return catalogoCache
}

function mapaNombresCatalogo(catalogo: CatalogoDietaDto[]): Map<string, string> {
  return new Map(
    catalogo
      .filter((item) => item.id)
      .map((item) => [String(item.id), String(item.nombre ?? item.codigo ?? "")]),
  )
}

async function resolverTipoDietaId(nombreDieta: string): Promise<string | undefined> {
  const catalogo = await obtenerCatalogoInterno()
  const normalizado = nombreDieta.trim().toLowerCase()
  const item =
    catalogo.find(
      (entry) =>
        String(entry.nombre ?? "").trim().toLowerCase() === normalizado ||
        String(entry.codigo ?? "").trim().toLowerCase() === normalizado,
    ) ??
    catalogo.find((entry) => {
      const nombre = String(entry.nombre ?? "").trim().toLowerCase()
      return (
        nombre.includes(normalizado) ||
        normalizado.includes(nombre.replace(/^dieta\s+/, ""))
      )
    })
  return item?.id ? String(item.id) : undefined
}

export async function obtenerDietasPaciente(
  pacienteId: string,
  fecha = fechaOperativaHoy(),
): Promise<FilaDieta[]> {
  const { data } = await apiClient.get<FilaDietaDto[] | ApiResponse<FilaDietaDto[]>>(
    buildDietasCocinaPath(`/paciente/${pacienteId}/dietas`),
    { params: { fecha } },
  )
  const catalogo = mapaNombresCatalogo(await obtenerCatalogoInterno())
  return mapFilaDietaList(extraerCuerpoApi(data), catalogo)
}

export async function obtenerDetalleDieta(filaDietaId: string): Promise<FilaDieta> {
  const { data } = await apiClient.get<FilaDietaDto | ApiResponse<FilaDietaDto>>(
    buildDietasCocinaPath(`/dietas/${filaDietaId}`),
  )
  const catalogo = mapaNombresCatalogo(await obtenerCatalogoInterno())
  return mapFilaDietaDtoToDomain(extraerCuerpoApi(data), catalogo)
}

export async function obtenerHistorialDieta(
  filaDietaId: string,
): Promise<EventoTrazabilidad[]> {
  const { data } = await apiClient.get<
    EventoTrazabilidadDto[] | ApiResponse<EventoTrazabilidadDto[]>
  >(buildDietasCocinaPath(`/dietas/${filaDietaId}/historial`))
  const items = extraerCuerpoApi(data)
  return Array.isArray(items) ? items.map(mapEventoTrazabilidadDto) : []
}

export async function guardarSolicitudDieta(
  filaDietaId: string,
  datos: DatosSolicitudDietaInput,
): Promise<FilaDieta> {
  const tipoDietaId = await resolverTipoDietaId(datos.tipoDieta)
  const { data } = await apiClient.post<FilaDietaDto | ApiResponse<FilaDietaDto>>(
    buildDietasCocinaPath(`/dietas/${filaDietaId}/solicitud`),
    mapSolicitudToRequest(datos, tipoDietaId),
  )
  const catalogo = mapaNombresCatalogo(await obtenerCatalogoInterno())
  return mapFilaDietaDtoToDomain(extraerCuerpoApi(data), catalogo)
}

export async function confirmarDieta(filaDietaId: string): Promise<FilaDieta> {
  const { data } = await apiClient.post<FilaDietaDto | ApiResponse<FilaDietaDto>>(
    buildDietasCocinaPath(`/dietas/${filaDietaId}/confirmar`),
    {},
  )
  const catalogo = mapaNombresCatalogo(await obtenerCatalogoInterno())
  return mapFilaDietaDtoToDomain(extraerCuerpoApi(data), catalogo)
}

export async function confirmarDietasMasivo(
  dietasIds: string[],
  usuario: string,
): Promise<void> {
  const body: BulkConfirmarRequestDto = { dietasIds, usuario }
  await apiClient.post(buildDietasCocinaPath("/dietas/bulk/confirmar"), body)
}

export async function cancelarDieta(
  filaDietaId: string,
  motivo: string,
): Promise<FilaDieta> {
  await apiClient.post(
    buildDietasCocinaPath(`/dietas/${filaDietaId}/cancelar`),
    motivo,
    { headers: { "Content-Type": "application/json" } },
  )
  return obtenerDetalleDieta(filaDietaId)
}

export async function registrarNovedadDieta(
  filaDietaId: string,
  payload: Record<string, unknown>,
): Promise<FilaDieta> {
  const { data } = await apiClient.post<FilaDietaDto | ApiResponse<FilaDietaDto>>(
    buildDietasCocinaPath(`/dietas/${filaDietaId}/novedad`),
    payload,
  )
  const catalogo = mapaNombresCatalogo(await obtenerCatalogoInterno())
  return mapFilaDietaDtoToDomain(extraerCuerpoApi(data), catalogo)
}

export async function buscarDietas(filtros: BuscarDietasRequestDto): Promise<FilaDieta[]> {
  const { data } = await apiClient.post<CensoDietasDto | ApiResponse<CensoDietasDto>>(
    buildDietasCocinaPath("/dietas/buscar"),
    filtros,
  )
  const catalogo = mapaNombresCatalogo(await obtenerCatalogoInterno())
  const censo = extraerCuerpoApi(data)
  return mapFilaDietaList(censo.filas ?? (censo as { Filas?: FilaDietaDto[] }).Filas, catalogo)
}

export async function obtenerCatalogoDietas(): Promise<CatalogoDietaDto[]> {
  const { data } = await apiClient.get<
    CatalogoDietaDto[] | ApiResponse<CatalogoDietaDto[]> | { value?: CatalogoDietaDto[] }
  >(buildDietasCocinaPath("/catalogo"))
  const payload = extraerCuerpoApi(data)
  let items: CatalogoDietaDto[] = []
  if (Array.isArray(payload)) items = payload
  else if (payload && typeof payload === "object") {
    const value = normalizarClave(payload as Record<string, unknown>, "value", "Value")
    if (Array.isArray(value)) items = value as CatalogoDietaDto[]
  }
  return items.map((item) => ({
    ...item,
    nombre: repararTextoUtf8(item.nombre),
    descripcion: repararTextoUtf8(item.descripcion),
  }))
}

export async function obtenerDetalleDietaSafe(
  filaDietaId: string,
): Promise<FilaDieta | null> {
  try {
    return await obtenerDetalleDieta(filaDietaId)
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) return null
    throw error
  }
}

export function invalidarCacheCatalogoDietas(): void {
  catalogoCache = null
}

export async function obtenerDetalleCatalogoDieta(id: string): Promise<CatalogoDietaDto> {
  const { data } = await apiClient.get<CatalogoDietaDto | ApiResponse<CatalogoDietaDto>>(
    buildDietasCocinaPath(`/catalogo/${id}`),
  )
  return extraerCuerpoApi(data)
}

export async function crearDietaCatalogo(
  body: Record<string, unknown>,
): Promise<CatalogoDietaDto> {
  const { data } = await apiClient.post<CatalogoDietaDto | ApiResponse<CatalogoDietaDto>>(
    buildDietasCocinaPath("/catalogo"),
    body,
  )
  invalidarCacheCatalogoDietas()
  return extraerCuerpoApi(data)
}

export async function actualizarDietaCatalogo(
  id: string,
  body: Record<string, unknown>,
): Promise<CatalogoDietaDto> {
  const { data } = await apiClient.patch<CatalogoDietaDto | ApiResponse<CatalogoDietaDto>>(
    buildDietasCocinaPath(`/catalogo/${id}`),
    body,
  )
  invalidarCacheCatalogoDietas()
  return extraerCuerpoApi(data)
}

export async function desactivarDietaCatalogo(id: string): Promise<CatalogoDietaDto> {
  const { data } = await apiClient.patch<CatalogoDietaDto | ApiResponse<CatalogoDietaDto>>(
    buildDietasCocinaPath(`/catalogo/${id}/desactivar`),
    {},
  )
  invalidarCacheCatalogoDietas()
  return extraerCuerpoApi(data)
}

export async function obtenerTarifasDieta(id: string): Promise<TarifaHistoricoDto[]> {
  const { data } = await apiClient.get<TarifaHistoricoDto[] | ApiResponse<TarifaHistoricoDto[]>>(
    buildDietasCocinaPath(`/catalogo/${id}/tarifas`),
  )
  const payload = extraerCuerpoApi(data)
  return Array.isArray(payload) ? payload : []
}

export async function registrarTarifaDieta(
  id: string,
  body: Record<string, unknown>,
): Promise<TarifaHistoricoDto> {
  const { data } = await apiClient.post<TarifaHistoricoDto | ApiResponse<TarifaHistoricoDto>>(
    buildDietasCocinaPath(`/catalogo/${id}/tarifas`),
    body,
  )
  invalidarCacheCatalogoDietas()
  return extraerCuerpoApi(data)
}
