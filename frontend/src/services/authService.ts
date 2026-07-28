import type { AccesoModulo } from "@/types/module"
import type { Usuario } from "@/types/user"

import {
  cambiarPasswordModulo,
  loginModulo,
  logoutModulo,
  obtenerSesionModulo,
} from "@/api/authModulo.service"
import { limpiarModuloActivo } from "@/lib/modulos"
import { moduloHabilitado } from "@/lib/modulosFlags"

const SESSION_KEY = "bital:session"

function normalizarUsuario(raw: Usuario): Usuario | null {
  const accesos = (raw.accesos ?? []).filter(
    (acceso): acceso is AccesoModulo =>
      (acceso.moduloId === "dietas-cocina" || acceso.moduloId === "encuestas") &&
      moduloHabilitado(acceso.moduloId),
  )

  const esAdministrador =
    raw.esAdministrador === true ||
    (raw.accesos ?? []).some(
      (acceso) => (acceso.moduloId as string) === "administracion",
    )

  if (accesos.length === 0) {
    return null
  }

  return {
    ...raw,
    esAdministrador,
    accesos,
  }
}

function guardarSesion(usuario: Usuario): Usuario {
  const normalizado = normalizarUsuario(usuario)
  if (!normalizado) {
    throw new Error("El usuario no tiene acceso a ningún módulo.")
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalizado))
  return normalizado
}

function limpiarSesionLocal(): void {
  sessionStorage.removeItem(SESSION_KEY)
  limpiarModuloActivo()
}

export function obtenerSesion(): Usuario | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const usuario = normalizarUsuario(JSON.parse(raw) as Usuario)
    if (!usuario) {
      limpiarSesionLocal()
      return null
    }
    return usuario
  } catch {
    limpiarSesionLocal()
    return null
  }
}

export async function rehidratarSesion(): Promise<Usuario | null> {
  try {
    const sesion = await obtenerSesionModulo()
    return guardarSesion(sesion)
  } catch {
    limpiarSesionLocal()
    return null
  }
}

export async function iniciarSesion(
  usuario: string,
  password: string,
): Promise<Usuario> {
  const sesion = await loginModulo(usuario, password)
  return guardarSesion(sesion)
}

export async function cambiarPasswordSesion(
  usuario: string,
  passwordActual: string,
  passwordNueva: string,
): Promise<string> {
  return cambiarPasswordModulo({ usuario, passwordActual, passwordNueva })
}

export async function cerrarSesion(): Promise<void> {
  try {
    await logoutModulo()
  } catch {
    // Si el token ya expiró, igual limpiamos el estado local.
  }
  limpiarSesionLocal()
}
