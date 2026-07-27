import { apiClient } from "@/api/client"
import { getPacientePorDocumento } from "@/api/pacientes.service"
import { mapFilaDietaList } from "@/modules/dietas-cocina/api/mappers"
import {
  buildDietasCocinaPath,
  extraerCuerpoApi,
  fechaOperativaHoy,
  mapearComidaApi,
  normalizarClave,
} from "@/modules/dietas-cocina/api/utils"
import { configDietasOperativas } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { fusionarFilasPorComida } from "@/modules/dietas-cocina/lib/fusionarFilasDieta"
import type { CensoDietasDto } from "@/modules/dietas-cocina/types/api-dtos"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"

const edadPorDocumento = new Map<string, number>()

async function enriquecerEdades(filas: FilaDieta[]): Promise<FilaDieta[]> {
  return Promise.all(
    filas.map(async (fila) => {
      if (fila.edad > 0 || !fila.cedula || !fila.tipoDocumento) return fila
      const clave = `${fila.tipoDocumento}-${fila.cedula}`
      if (edadPorDocumento.has(clave)) {
        return { ...fila, edad: edadPorDocumento.get(clave)! }
      }
      try {
        const paciente = await getPacientePorDocumento(fila.cedula, fila.tipoDocumento)
        if (paciente?.edad != null) {
          edadPorDocumento.set(clave, paciente.edad)
          return { ...fila, edad: paciente.edad }
        }
      } catch {
        return fila
      }
      return fila
    }),
  )
}

export async function obtenerCensoDietas(
  comida: TiempoComida,
  fecha = fechaOperativaHoy(),
): Promise<CensoDietasDto> {
  const { data } = await apiClient.get<CensoDietasDto>(
    buildDietasCocinaPath("/censo"),
    {
      params: {
        fecha,
        comida: mapearComidaApi(comida),
      },
    },
  )
  return extraerCuerpoApi(data)
}

function extraerFilasCenso(censo: CensoDietasDto | Record<string, unknown>): unknown {
  return normalizarClave(censo as Record<string, unknown>, "filas", "Filas")
}

/** Sincroniza una comida vía GET /dietas-cocina/censo (crea filas con GUID en el backend). */
export async function sincronizarFilasDesdeCensoApi(
  comida: TiempoComida,
  filasActuales: FilaDieta[] = [],
): Promise<{ filas: FilaDieta[]; totalEnCenso: number }> {
  edadPorDocumento.clear()
  const censo = await obtenerCensoDietas(comida)
  const filasApi = mapFilaDietaList(extraerFilasCenso(censo))
  const filasEnriquecidas = await enriquecerEdades(filasApi)

  return {
    filas: fusionarFilasPorComida(filasActuales, filasEnriquecidas, comida),
    totalEnCenso: filasEnriquecidas.length,
  }
}

/** Carga todas las comidas operativas desde el censo del API. */
export async function cargarFilasCensoDesdeApi(
  comidaReferencia: TiempoComida,
  filasActuales: FilaDieta[] = [],
): Promise<{ filas: FilaDieta[]; totalEnCenso: number }> {
  let acumulado = filasActuales
  let totalEnCenso = 0

  for (const { id: tiempoComida } of configDietasOperativas.comidas) {
    const { filas, totalEnCenso: total } = await sincronizarFilasDesdeCensoApi(
      tiempoComida,
      acumulado,
    )
    acumulado = filas
    if (tiempoComida === comidaReferencia) {
      totalEnCenso = total
    }
  }

  return { filas: acumulado, totalEnCenso }
}
