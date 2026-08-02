import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import {
  mapMatrizPermisosResponse,
  mapPermisosUiToActualizarRequest,
} from "@/modules/dietas-cocina/api/mappers/permisos.mapper"
import {
  mapListadoUsuariosResponse,
  mapRolesModuloResponse,
  mapUsuarioDtoToDomain,
  mapUsuarioToCrearRequest,
  mapUsuarioToEditarRequest,
} from "@/modules/dietas-cocina/api/mappers/usuarios.mapper"
import { buildDietasCocinaPath, extraerCuerpoApi } from "@/modules/dietas-cocina/api/utils"
import type {
  MetaPaginacionDto,
  PermisoRolDto,
  RolModuloDto,
} from "@/modules/dietas-cocina/types/api-dtos"
import type { CapacidadEtiquetas } from "@/modules/dietas-cocina/types/enums"
import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"

export interface FiltrosUsuarios {
  rolModuloId?: string
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
      rolModuloId: filtros.rolModuloId,
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

export async function cambiarRolUsuario(id: string, rolModuloId: string): Promise<void> {
  await apiClient.patch(buildDietasCocinaPath(`/usuarios/${id}/rol`), {
    rolModuloId,
  })
}

export async function cambiarEstadoUsuario(id: string, activo: boolean): Promise<void> {
  await apiClient.patch(buildDietasCocinaPath(`/usuarios/${id}/estado`), { activo })
}

export async function listarRoles(): Promise<RolModuloDto[]> {
  const { data } = await apiClient.get<unknown>(buildDietasCocinaPath("/roles"))
  return mapRolesModuloResponse(data)
}

export async function crearRol(input: {
  nombre: string
  permisos: Record<string, boolean>
  capacidadesEtiquetas?: CapacidadEtiquetas[]
}): Promise<RolModuloDto> {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    buildDietasCocinaPath("/roles"),
    {
      nombre: input.nombre,
      ...mapPermisosUiToActualizarRequest(
        input.permisos,
        input.capacidadesEtiquetas,
      ),
    },
  )
  const body = extraerCuerpoApi(data)
  const roles = mapRolesModuloResponse({ data: [body] })
  return roles[0] ?? { nombre: input.nombre }
}

export async function obtenerPermisosRoles(): Promise<PermisoRolDto[]> {
  const { data } = await apiClient.get<unknown>(
    buildDietasCocinaPath("/roles/permisos"),
  )
  return mapMatrizPermisosResponse(data)
}

export async function actualizarPermisosRol(
  rolModuloId: string,
  permisos: Record<string, boolean>,
  capacidadesEtiquetas?: CapacidadEtiquetas[],
): Promise<void> {
  await apiClient.put(
    buildDietasCocinaPath(`/roles/${rolModuloId}/permisos`),
    mapPermisosUiToActualizarRequest(permisos, capacidadesEtiquetas),
  )
}

export async function editarRol(
  rolModuloId: string,
  nombre: string,
): Promise<RolModuloDto> {
  const { data } = await apiClient.put<ApiResponse<unknown>>(
    buildDietasCocinaPath(`/roles/${rolModuloId}`),
    { nombre },
  )
  const body = extraerCuerpoApi(data)
  const roles = mapRolesModuloResponse({ data: [body] })
  return roles[0] ?? { nombre }
}

export async function eliminarRol(rolModuloId: string): Promise<void> {
  await apiClient.delete(buildDietasCocinaPath(`/roles/${rolModuloId}`))
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
