export type { CensoRepository } from "@/modules/dietas-cocina/api/censoRepository"
export type { CicloBandejasRepository } from "@/modules/dietas-cocina/api/cicloBandejasRepository"
export type { DietasRepository } from "@/modules/dietas-cocina/types/repositories"
export type {
  DietasOperativasRepository,
  EtiquetasRepository,
  CancelarDietaPayload,
  NovedadDietaPayload,
  CatalogoDietaItem,
} from "@/modules/dietas-cocina/types/repositories"
export { dietasRepositoryHttp } from "@/modules/dietas-cocina/api/dietasRepository"
export { censoRepositoryMock } from "@/modules/dietas-cocina/api/censoRepository.mock"
export { censoRepositoryHttp } from "@/modules/dietas-cocina/api/censoRepository.http"
export { cicloBandejasRepositoryMock } from "@/modules/dietas-cocina/api/cicloBandejasRepository.mock"
export { cicloBandejasRepositoryHttp } from "@/modules/dietas-cocina/api/cicloBandejasRepository.http"
export { dietasOperativasRepositoryHttp } from "@/modules/dietas-cocina/api/dietasOperativasRepository.http"
export { dietasOperativasRepositoryMock } from "@/modules/dietas-cocina/api/dietasOperativasRepository.mock"
export { etiquetasRepositoryHttp } from "@/modules/dietas-cocina/api/etiquetasRepository.http"
export { etiquetasRepositoryMock } from "@/modules/dietas-cocina/api/etiquetasRepository.mock"
export * from "@/modules/dietas-cocina/api/services"
export { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
export {
  obtenerCensoRepository,
  obtenerCicloBandejasRepository,
  obtenerDietasOperativasRepository,
  obtenerEtiquetasRepository,
  obtenerDietasRepository,
} from "@/modules/dietas-cocina/api/repositories"
