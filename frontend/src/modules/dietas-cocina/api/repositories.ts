import type {
  CensoRepository,
  CicloBandejasRepository,
  DietasOperativasRepository,
  DietasRepository,
  EtiquetasRepository,
} from "@/modules/dietas-cocina/types/repositories"
import { censoRepositoryHttp } from "@/modules/dietas-cocina/api/censoRepository.http"
import { censoRepositoryMock } from "@/modules/dietas-cocina/api/censoRepository.mock"
import { cicloBandejasRepositoryMock } from "@/modules/dietas-cocina/api/cicloBandejasRepository.mock"
import { cicloBandejasRepositoryHttp } from "@/modules/dietas-cocina/api/cicloBandejasRepository.http"
import { dietasRepositoryHttp } from "@/modules/dietas-cocina/api/dietasRepository"
import { dietasOperativasRepositoryHttp } from "@/modules/dietas-cocina/api/dietasOperativasRepository.http"
import { dietasOperativasRepositoryMock } from "@/modules/dietas-cocina/api/dietasOperativasRepository.mock"
import { etiquetasRepositoryHttp } from "@/modules/dietas-cocina/api/etiquetasRepository.http"
import { etiquetasRepositoryMock } from "@/modules/dietas-cocina/api/etiquetasRepository.mock"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"

export function obtenerCensoRepository(): CensoRepository {
  return usarApiDietasCocina() ? censoRepositoryHttp : censoRepositoryMock
}

export function obtenerCicloBandejasRepository(): CicloBandejasRepository {
  return usarApiDietasCocina() ? cicloBandejasRepositoryHttp : cicloBandejasRepositoryMock
}

export function obtenerDietasOperativasRepository(): DietasOperativasRepository {
  return usarApiDietasCocina()
    ? dietasOperativasRepositoryHttp
    : dietasOperativasRepositoryMock
}

export function obtenerEtiquetasRepository(): EtiquetasRepository {
  return usarApiDietasCocina() ? etiquetasRepositoryHttp : etiquetasRepositoryMock
}

export function obtenerDietasRepository(): DietasRepository {
  return dietasRepositoryHttp
}
