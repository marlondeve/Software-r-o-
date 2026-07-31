import type { RutaDietas } from "@/modules/dietas-cocina/types/enums"
import type { PermisoRolDto } from "@/modules/dietas-cocina/types/api-dtos"
import { permisosRecordToRutas } from "@/modules/dietas-cocina/usuarios/lib/permisosApiBridge"
import { useSyncExternalStore } from "react"

let matrizPermisosApi: PermisoRolDto[] | null = null
let matrizVersion = 0
const listeners = new Set<() => void>()

function notificarMatrizCambiada() {
  matrizVersion += 1
  listeners.forEach((listener) => listener())
}

export function establecerMatrizPermisosApi(entries: PermisoRolDto[]): void {
  matrizPermisosApi = entries
  notificarMatrizCambiada()
}

export function obtenerMatrizPermisosApi(): PermisoRolDto[] | null {
  return matrizPermisosApi
}

export function limpiarMatrizPermisosApi(): void {
  matrizPermisosApi = null
  notificarMatrizCambiada()
}

function subscribeMatrizPermisos(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getMatrizPermisosVersion(): number {
  return matrizVersion
}

/** Re-renderiza cuando la matriz API termina de cargar o cambia. */
export function useMatrizPermisosVersion(): number {
  return useSyncExternalStore(
    subscribeMatrizPermisos,
    getMatrizPermisosVersion,
    getMatrizPermisosVersion,
  )
}

export function obtenerRutasPermitidasDesdeApi(rol: string | null): RutaDietas[] | null {
  if (!rol || !matrizPermisosApi) return null

  const clave = rol.trim().toLowerCase()
  const entry =
    matrizPermisosApi.find((item) => item.rol?.toLowerCase() === clave) ??
    matrizPermisosApi.find((item) => item.rolId === rol)

  if (!entry?.permisos) return null
  return permisosRecordToRutas(entry.permisos) as RutaDietas[]
}

export function permisosPorRolNombreDesdeApi(
  permisosApi: PermisoRolDto[],
  rol: string,
): RutaDietas[] {
  const clave = rol.trim().toLowerCase()
  const entry = permisosApi.find((item) => item.rol?.toLowerCase() === clave)
  return (entry?.permisos ? permisosRecordToRutas(entry.permisos) : []) as RutaDietas[]
}
