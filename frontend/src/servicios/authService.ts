import type { AccesoModulo } from "@/tipos/modulo"
import type { Usuario } from "@/tipos/usuario"

import {
  limpiarModuloActivo,
} from "@/lib/modulos"

const SESSION_KEY = "bital:session"

function resolverAccesos(email: string): {
  accesos: AccesoModulo[]
  esAdministrador: boolean
} {
  const correo = email.toLowerCase()

  if (correo.startsWith("admin@")) {
    return {
      esAdministrador: true,
      accesos: [
        { moduloId: "dietas-cocina", rol: "Administrador" },
        { moduloId: "encuestas", rol: "Administrador" },
      ],
    }
  }

  if (correo.startsWith("dietas@")) {
    return {
      esAdministrador: false,
      accesos: [{ moduloId: "dietas-cocina", rol: "Nutricionista" }],
    }
  }

  if (correo.startsWith("encuestas@")) {
    return {
      esAdministrador: false,
      accesos: [{ moduloId: "encuestas", rol: "Analista SIAO" }],
    }
  }

  return {
    esAdministrador: false,
    accesos: [
      { moduloId: "dietas-cocina", rol: "Operador de dietas" },
      { moduloId: "encuestas", rol: "Operador de encuestas" },
    ],
  }
}

function normalizarUsuario(raw: Usuario): Usuario | null {
  const accesos = (raw.accesos ?? []).filter(
    (acceso): acceso is AccesoModulo =>
      acceso.moduloId === "dietas-cocina" || acceso.moduloId === "encuestas",
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

export function obtenerSesion(): Usuario | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const usuario = normalizarUsuario(JSON.parse(raw) as Usuario)
    if (!usuario) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return usuario
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<Usuario> {
  // Mock temporal: reemplazar con llamada a la API institucional.
  await new Promise((resolve) => setTimeout(resolve, 400))

  if (!email.trim() || !password.trim()) {
    throw new Error("Credenciales inválidas.")
  }

  const nombre = email.split("@")[0] ?? "Usuario"
  const { accesos, esAdministrador } = resolverAccesos(email)
  const usuario: Usuario = {
    id: crypto.randomUUID(),
    email,
    nombre,
    iniciales: nombre.slice(0, 2).toUpperCase(),
    esAdministrador,
    accesos,
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(usuario))
  return usuario
}

export function cerrarSesion(): void {
  sessionStorage.removeItem(SESSION_KEY)
  limpiarModuloActivo()
}
