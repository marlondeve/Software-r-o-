import { pacientesRepositoryHttp } from "@/modules/encuestas/api/pacientesRepository.http"
import { pacientesRepositoryMock } from "@/modules/encuestas/api/pacientesRepository.mock"
import type { PacientesRepository } from "@/modules/encuestas/api/pacientesRepository"

export type { PacientesRepository } from "@/modules/encuestas/api/pacientesRepository"
export { pacientesRepositoryMock } from "@/modules/encuestas/api/pacientesRepository.mock"
export { pacientesRepositoryHttp } from "@/modules/encuestas/api/pacientesRepository.http"

export function obtenerPacientesRepository(): PacientesRepository {
  return import.meta.env.VITE_ENCUESTAS_API === "true"
    ? pacientesRepositoryHttp
    : pacientesRepositoryMock
}
