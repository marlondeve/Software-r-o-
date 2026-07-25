import { censoRepositoryHttp } from "@/modules/dietas-cocina/api/censoRepository.http"
import { censoRepositoryMock } from "@/modules/dietas-cocina/api/censoRepository.mock"
import { cicloBandejasRepositoryMock } from "@/modules/dietas-cocina/api/cicloBandejasRepository.mock"
import { cicloBandejasRepositoryHttp } from "@/modules/dietas-cocina/api/cicloBandejasRepository.http"
import type { CensoRepository } from "@/modules/dietas-cocina/api/censoRepository"
import type { CicloBandejasRepository } from "@/modules/dietas-cocina/api/cicloBandejasRepository"

export type { CensoRepository } from "@/modules/dietas-cocina/api/censoRepository"
export type { CicloBandejasRepository } from "@/modules/dietas-cocina/api/cicloBandejasRepository"
export type { DietasRepository } from "@/modules/dietas-cocina/api/dietasRepository"
export { dietasRepositoryHttp } from "@/modules/dietas-cocina/api/dietasRepository"
export { censoRepositoryMock } from "@/modules/dietas-cocina/api/censoRepository.mock"
export { censoRepositoryHttp } from "@/modules/dietas-cocina/api/censoRepository.http"
export { cicloBandejasRepositoryMock } from "@/modules/dietas-cocina/api/cicloBandejasRepository.mock"
export { cicloBandejasRepositoryHttp } from "@/modules/dietas-cocina/api/cicloBandejasRepository.http"

function usarApiHttp(): boolean {
  return import.meta.env.VITE_DIETAS_COCINA_API === "true"
}

export function usarApiDietasCocina(): boolean {
  return usarApiHttp()
}

export function obtenerCensoRepository(): CensoRepository {
  return usarApiHttp() ? censoRepositoryHttp : censoRepositoryMock
}

export function obtenerCicloBandejasRepository(): CicloBandejasRepository {
  return usarApiHttp() ? cicloBandejasRepositoryHttp : cicloBandejasRepositoryMock
}
