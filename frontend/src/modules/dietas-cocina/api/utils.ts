import type { AxiosResponse } from "axios"

import type { ApiResponse } from "@/api/types"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

const COMIDA_API: Record<TiempoComida, string> = {
  desayuno: "Desayuno",
  "merienda-manana": "MediaNueve",
  almuerzo: "Almuerzo",
  "merienda-tarde": "Onces",
  cena: "Cena",
  "merienda-noche": "MediaNoche",
}

const COMIDA_INTERNA: Record<string, TiempoComida> = {
  desayuno: "desayuno",
  medianueve: "merienda-manana",
  "merienda mañana": "merienda-manana",
  "merienda manana": "merienda-manana",
  almuerzo: "almuerzo",
  onces: "merienda-tarde",
  "merienda tarde": "merienda-tarde",
  cena: "cena",
  medianoche: "merienda-noche",
  "merienda noche": "merienda-noche",
}

export function buildDietasCocinaPath(path: string): string {
  const normalizado = path.startsWith("/") ? path : `/${path}`
  return `/dietas-cocina${normalizado}`
}

export function fechaOperativaHoy(fecha = new Date()): string {
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, "0")
  const day = String(fecha.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function mapearComidaApi(comida: TiempoComida): string {
  return COMIDA_API[comida]
}

export function mapearComidaInterna(valor: string): TiempoComida {
  const clave = valor.trim().toLowerCase()
  if (clave in COMIDA_INTERNA) {
    return COMIDA_INTERNA[clave]!
  }
  const porId = (Object.keys(COMIDA_API) as TiempoComida[]).find(
    (id) => id === clave || id.replace(/-/g, " ") === clave,
  )
  return porId ?? "almuerzo"
}

export function unwrapApiResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data
}

export function normalizarClave(obj: Record<string, unknown>, ...claves: string[]): unknown {
  for (const clave of claves) {
    if (clave in obj) return obj[clave]
    const camel = clave.charAt(0).toLowerCase() + clave.slice(1)
    if (camel in obj) return obj[camel]
    const pascal = clave.charAt(0).toUpperCase() + clave.slice(1)
    if (pascal in obj) return obj[pascal]
  }
  return undefined
}

/** Dietas-cocina devuelve DTO directo, `{ data }` o `{ value }` (ApiNegocio). */
export function extraerCuerpoApi<T>(payload: T | ApiResponse<T>): T {
  if (payload && typeof payload === "object") {
    const envoltorio = payload as Record<string, unknown>
    if ("data" in envoltorio) {
      const contenido = envoltorio.data
      if (
        "success" in envoltorio ||
        Array.isArray(contenido) ||
        (contenido !== null && typeof contenido === "object")
      ) {
        return contenido as T
      }
    }
    if ("value" in envoltorio && Array.isArray(envoltorio.value)) {
      return envoltorio.value as T
    }
  }
  return payload as T
}
