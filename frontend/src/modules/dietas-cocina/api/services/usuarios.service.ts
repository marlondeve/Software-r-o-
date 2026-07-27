import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  mapMatrizPermisosResponse,
  mapPermisosUiToActualizarRequest,
  rolPermisosParaApi,
} from "@/modules/dietas-cocina/api/mappers/permisos.mapper"
import {
  mapListadoUsuariosResponse,
  mapRolDominioAApi,
  mapRolDominioAApiNum,
  mapUsuarioDtoToDomain,
  mapUsuarioToCrearRequest,
  mapUsuarioToEditarRequest,
} from "@/modules/dietas-cocina/api/mappers/usuarios.mapper"
import { buildDietasCocinaPath, extraerCuerpoApi } from "@/modules/dietas-cocina/api/utils"
import type { MetaPaginacionDto, PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { RolDietas } from "@/modules/dietas-cocina/types/enums"
import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"

export interface FiltrosUsuarios {
  rol?: RolDietas
  estado?: boolean
  page?: number
  pageSize?: number
}

export interface ListadoUsuariosResult {
  usuarios: UsuarioModulo[]
  meta?: MetaPaginacionDto
}

export async function listarUsuarios(
  filtros: FiltrosUsuarios = {},
): Promise<ListadoUsuariosResult> {
  const { data } = await apiClient.get<unknown>(buildDietasCocinaPath("/usuarios"), {
    params: {
      page: filtros.page,
      pageSize: filtros.pageSize,
      estado: filtros.estado,
      rol: filtros.rol ? mapRolDominioAApi(filtros.rol) : undefined,
    },
  })

  return mapListadoUsuariosResponse(data)
}

export async function crearUsuario(
  usuario: Omit<UsuarioModulo, "id">,
): Promise<UsuarioModulo> {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    buildDietasCocinaPath("/usuarios"),
    mapUsuarioToCrearRequest(usuario),
  )
  return mapUsuarioDtoToDomain(extraerCuerpoApi(data))
}

export async function editarUsuario(
  id: string,
  usuario: Omit<UsuarioModulo, "id">,
): Promise<UsuarioModulo> {
  const { data } = await apiClient.put<ApiResponse<unknown>>(
    buildDietasCocinaPath(`/usuarios/${id}`),
    mapUsuarioToEditarRequest(usuario),
  )
  return mapUsuarioDtoToDomain(extraerCuerpoApi(data))
}

export async function cambiarRolUsuario(id: string, rol: RolDietas): Promise<void> {
  await apiClient.patch(buildDietasCocinaPath(`/usuarios/${id}/rol`), {
    rol: mapRolDominioAApiNum(rol),
  })
}

export async function cambiarEstadoUsuario(id: string, activo: boolean): Promise<void> {
  await apiClient.patch(buildDietasCocinaPath(`/usuarios/${id}/estado`), { activo })
}

export async function obtenerPermisosRoles(): Promise<PermisoRolDto[]> {
  const { data } = await apiClient.get<unknown>(
    buildDietasCocinaPath("/roles/permisos"),
  )
  return mapMatrizPermisosResponse(data)
}

export async function actualizarPermisosRol(
  rol: RolDietas,
  permisos: Record<string, boolean>,
): Promise<void> {
  await apiClient.put(
    buildDietasCocinaPath(`/roles/${rolPermisosParaApi(rol)}/permisos`),
    mapPermisosUiToActualizarRequest(permisos),
  )
}

export async function obtenerUsuarioSafe(id: string): Promise<UsuarioModulo | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<unknown>>(
      buildDietasCocinaPath(`/usuarios/${id}`),
    )
    return mapUsuarioDtoToDomain(extraerCuerpoApi(data))
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) return null
    throw error
  }
}
