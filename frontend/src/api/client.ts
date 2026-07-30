import axios, { type AxiosError } from "axios"

import { apiBaseUrl } from "@/api/config"
import type { ApiErrorBody } from "@/api/types"

const SESSION_KEY = "bital:session"

export class BitalApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = "BitalApiError"
    this.status = status
  }
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Platform": "web",
  },
})

function limpiarSesionLocal(): void {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem("bital:modulo-activo")
}

function extraerMensajeError(
  error: AxiosError<
    ApiErrorBody & {
      error?: string
      message?: string
      errors?: Record<string, string[] | string>
    }
  >,
): string {
  const body = error.response?.data
  if (body?.message) return body.message
  if (body?.errors && typeof body.errors === "object") {
    const mensajes = Object.entries(body.errors).flatMap(([campo, msgs]) => {
      const lista = Array.isArray(msgs) ? msgs : [msgs]
      return lista
        .filter((msg) => !String(msg).includes("dto field is required"))
        .map((msg) => {
          if (String(msg).includes("RolDietas")) {
            return "El rol seleccionado no es válido para la API."
          }
          return `${campo.replace(/^\$\.?/, "")}: ${msg}`
        })
    })
    if (mensajes.length > 0) return mensajes.join(". ")
  }
  if (body?.detail) return body.detail
  if (body?.title && body.title !== "One or more validation errors occurred.") {
    return body.title
  }
  if (body?.title?.toLowerCase().includes("validation")) {
    return "Revise los datos del formulario e intente de nuevo."
  }
  if (body?.error) return body.error
  if (error.response?.status === 404) {
    return import.meta.env.DEV
      ? "Servicio no disponible. Verifique que el backend esté en ejecución."
      : "Servicio no disponible. Intente de nuevo más tarde."
  }
  return error.message || "Error desconocido en la API"
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status
    const requestUrl = error.config?.url ?? ""

    if (
      status === 401 &&
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/cambiar-password") &&
      !requestUrl.includes("/auth/me")
    ) {
      limpiarSesionLocal()
      if (window.location.pathname !== "/login") {
        window.location.assign("/login")
      }
    }

    return Promise.reject(
      new BitalApiError(extraerMensajeError(error), status),
    )
  },
)
