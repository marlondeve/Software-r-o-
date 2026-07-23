import { cicloBandejasRepositoryMock } from "@/modules/dietas-cocina/api/cicloBandejasRepository.mock"
import { cicloBandejasRepositoryHttp } from "@/modules/dietas-cocina/api/cicloBandejasRepository.http"
import type { CicloBandejasRepository } from "@/modules/dietas-cocina/api/cicloBandejasRepository"

export type { CicloBandejasRepository } from "@/modules/dietas-cocina/api/cicloBandejasRepository"
export type { DietasRepository } from "@/modules/dietas-cocina/api/dietasRepository"
export { dietasRepositoryHttp } from "@/modules/dietas-cocina/api/dietasRepository"
export { cicloBandejasRepositoryMock } from "@/modules/dietas-cocina/api/cicloBandejasRepository.mock"
export { cicloBandejasRepositoryHttp } from "@/modules/dietas-cocina/api/cicloBandejasRepository.http"

export function obtenerCicloBandejasRepository(): CicloBandejasRepository {
  return import.meta.env.VITE_DIETAS_COCINA_API === "true"
    ? cicloBandejasRepositoryHttp
    : cicloBandejasRepositoryMock
}
