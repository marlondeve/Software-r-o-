import type { RolModuloDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { UsuarioModulo } from "@/modules/dietas-cocina/types/users"
import { USUARIOS_FILTROS_UI } from "@/modules/dietas-cocina/usuarios/datos/usuariosFiltrosUi"

export interface DatosDemoUsuarios {
  usuarios: UsuarioModulo[]
  roles: RolModuloDto[]
  filtros: typeof USUARIOS_FILTROS_UI
}

const VACIO: DatosDemoUsuarios = {
  usuarios: [],
  roles: [],
  filtros: USUARIOS_FILTROS_UI,
}

/** Solo en desarrollo sin API; excluido del bundle de producción por tree-shaking. */
export async function cargarMockUsuarios(): Promise<DatosDemoUsuarios> {
  if (!import.meta.env.DEV) {
    return VACIO
  }

  const mock = await import("@/modules/dietas-cocina/usuarios/datos/mockUsuarios")
  return {
    usuarios: mock.mockUsuariosDietas.usuarios,
    roles: mock.mockRolesDietas,
    filtros: USUARIOS_FILTROS_UI,
  }
}
