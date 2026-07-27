import axios, { type AxiosError } from "axios"

import { apiBaseUrl } from "@/api/config"
import type { ApiErrorBody } from "@/api/types"

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
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

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
    return "Servicio no disponible. Reinicie el backend (AuthController) e intente de nuevo."
  }
  return error.message || "Error desconocido en la API"
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    return Promise.reject(
      new BitalApiError(extraerMensajeError(error), error.response?.status),
    )
  },
)
