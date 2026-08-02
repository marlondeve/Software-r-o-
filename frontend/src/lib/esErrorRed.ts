import axios from "axios"

import { BitalApiError } from "@/api/client"

export function esErrorRed(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (!error.response) return true
    const codigo = error.code
    if (
      codigo === "ERR_NETWORK" ||
      codigo === "ECONNABORTED" ||
      codigo === "ETIMEDOUT"
    ) {
      return true
    }
  }

  if (error instanceof BitalApiError) {
    if (error.status == null || error.status === 0) return true
    return false
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes("network error") ||
      msg.includes("failed to fetch") ||
      msg.includes("load failed") ||
      msg.includes("net::")
    ) {
      return true
    }
  }

  return false
}

/** Conflicto de estado entre cliente y servidor (validación de negocio). */
export function esErrorConflictoSync(error: unknown): boolean {
  if (error instanceof BitalApiError) {
    const status = error.status
    return status === 400 || status === 409 || status === 422
  }
  return false
}
