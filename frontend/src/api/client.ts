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

function extraerMensajeError(error: AxiosError<ApiErrorBody>): string {
  const body = error.response?.data
  if (body?.detail) return body.detail
  if (body?.title) return body.title
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
