import { apiClient } from "@/api/client"
import type { ApiResponse } from "@/api/types"
import { extraerCuerpoApi, normalizarClave } from "@/modules/dietas-cocina/api/utils"
import { encuestasHabilitado } from "@/lib/modulosFlags"
import type { AccesoModulo } from "@/types/module"
import type { Usuario } from "@/types/user"

export interface LoginModuloResponse {
  id: string
  usuario: string
  email: string
  nombreCompleto: string
  rolNombre: string
}

function inicialesDesdeNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "US"
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase()
  return `${partes[0]![0] ?? ""}${partes[1]![0] ?? ""}`.toUpperCase()
}

export function mapLoginResponseToUsuario(payload: unknown): Usuario {
  const registro =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {}
  const email = String(normalizarClave(registro, "email", "Email") ?? "")
  const nombre = String(
    normalizarClave(registro, "nombreCompleto", "NombreCompleto", "nombre", "Nombre") ??
      normalizarClave(registro, "usuario", "Usuario", "identificacion", "Identificacion") ??
      "Usuario",
  )
  const rolNombre = String(
    normalizarClave(registro, "rolNombre", "RolNombre") ?? "Usuario",
  )
  const esAdministrador = rolNombre.toLowerCase() === "administrador"
  const accesos: AccesoModulo[] = esAdministrador
    ? [
        { moduloId: "dietas-cocina", rol: rolNombre },
        ...(encuestasHabilitado()
          ? [{ moduloId: "encuestas" as const, rol: "Administrador" as const }]
          : []),
      ]
    : [{ moduloId: "dietas-cocina", rol: rolNombre }]

  return {
    id: String(normalizarClave(registro, "id", "Id") ?? crypto.randomUUID()),
    email: email || `${String(normalizarClave(registro, "usuario", "Usuario") ?? "usuario")}@clinicadelrio.com`,
    nombre,
    iniciales: inicialesDesdeNombre(nombre),
    esAdministrador,
    accesos,
  }
}

export async function loginModulo(usuario: string, password: string): Promise<Usuario> {
  const { data } = await apiClient.post<ApiResponse<unknown>>("/auth/login", {
    usuario,
    password,
  })
  return mapLoginResponseToUsuario(extraerCuerpoApi(data))
}

export async function cambiarPasswordModulo(input: {
  usuario: string
  passwordActual: string
  passwordNueva: string
}): Promise<string> {
  const { data } = await apiClient.post<ApiResponse<{ mensaje?: string; Mensaje?: string }>>(
    "/auth/cambiar-password",
    {
      usuario: input.usuario,
      passwordActual: input.passwordActual,
      passwordNueva: input.passwordNueva,
    },
  )
  const body = extraerCuerpoApi(data)
  return String(body?.mensaje ?? body?.Mensaje ?? "Contraseña actualizada correctamente.")
}

export interface RestablecerPasswordResult {
  passwordTemporal: string
  mensaje: string
}

export async function restablecerPasswordUsuario(id: string): Promise<RestablecerPasswordResult> {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    `/dietas-cocina/usuarios/${id}/restablecer-password`,
  )
  const body = extraerCuerpoApi(data) as Record<string, unknown>
  return {
    passwordTemporal: String(
      normalizarClave(body, "passwordTemporal", "PasswordTemporal") ?? "",
    ),
    mensaje: String(
      normalizarClave(body, "mensaje", "Mensaje") ??
        "Contraseña restablecida correctamente.",
    ),
  }
}
