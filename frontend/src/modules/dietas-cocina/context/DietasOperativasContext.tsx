import type { FilaDieta, EventoTrazabilidad } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { BitalApiError } from "@/api/client"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import { estaOnlineAhora } from "@/hooks/useConectividadRed"
import { requiereConsistencia } from "@/modules/dietas-cocina/lib/comidaOperativa"
import { tiposDietaParaComida } from "@/modules/dietas-cocina/lib/tiposDietaCatalogo"
import { obtenerDietasOperativasRepository } from "@/modules/dietas-cocina/api/repositories"
import {
  cargarFilasCensoDesdeApi,
  sincronizarFilasDesdeCensoApi,
} from "@/modules/dietas-cocina/api/services/censo-dietas.service"
import type {
  CancelarDietaPayload,
  CatalogoDietaItem,
  NovedadDietaPayload,
} from "@/modules/dietas-cocina/types/repositories"
import type { DatosSolicitudDietaInput } from "@/modules/dietas-cocina/api/mappers"
import {
  mapFilaDietaDtoToDomain,
  normalizarFilaDietaDto,
} from "@/modules/dietas-cocina/api/mappers"
import { configDietasOperativas, mockDietas, MOCK_CATALOGO_DIETAS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { obtenerComidaActivaOperativa } from "@/modules/dietas-cocina/config/operativa-defaults"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"
import { invalidarCacheCatalogoDietas } from "@/modules/dietas-cocina/api/services/dietas.service"
import { formatearHoraDesdeFecha } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import { suscribirRefreshCenso } from "@/modules/dietas-cocina/lib/cocinaSyncBus"
import {
  cargarDietasOperativas,
  guardarDietasOperativas,
} from "@/modules/dietas-cocina/lib/dietasStorage"
import {
  deduplicarFilasPorPacienteComida,
  reemplazarFilaPorIdOIdentidad,
} from "@/modules/dietas-cocina/lib/fusionarFilasDieta"
import {
  EVENTOS_DIETAS_COCINA,
  suscribirEventosDietasCocina,
} from "@/modules/dietas-cocina/realtime/dietasCocinaEventos"

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function esGuidValido(id: string): boolean {
  return GUID_REGEX.test(id)
}

async function resolverIdFilaApi(
  id: string,
  filasActuales: FilaDieta[],
): Promise<{ id: string; filas: FilaDieta[] }> {
  if (esGuidValido(id)) return { id, filas: filasActuales }

  const filaLocal = filasActuales.find((fila) => fila.id === id)
  if (!filaLocal) {
    throw new Error("La dieta no está sincronizada. Pulsa «Actualizar censo» e inténtalo de nuevo.")
  }

  const { filas } = await sincronizarFilasDesdeCensoApi(filaLocal.comida, filasActuales)
  const sincronizada = filas.find(
    (fila) =>
      fila.pacienteId === filaLocal.pacienteId && fila.comida === filaLocal.comida,
  )

  if (!sincronizada || !esGuidValido(sincronizada.id)) {
    throw new Error("No se pudo obtener el identificador de la dieta en el servidor.")
  }

  return { id: sincronizada.id, filas }
}

function formatearHoraSincronizacion(): string {
  return formatearHoraDesdeFecha()
}

const ERROR_SIN_CONEXION =
  "Sin conexión. Conecte a la red para realizar esta acción."

function requiereConexionApi(): void {
  if (!estaOnlineAhora()) {
    throw new Error(ERROR_SIN_CONEXION)
  }
}

function estadoInicialFilas(persistido: ReturnType<typeof cargarDietasOperativas>): FilaDieta[] {
  const hoy = fechaOperativaHoy()
  if (persistido?.filas.length && persistido.fechaOperativa === hoy) {
    return persistido.filas.map((fila) => ({ ...fila }))
  }
  if (!usarApiDietasCocina() && persistido?.filas.length) {
    return persistido.filas.map((fila) => ({ ...fila }))
  }
  if (!usarApiDietasCocina()) {
    return mockDietas.filas.map((fila) => ({ ...fila }))
  }
  return []
}

function estadoInicialSincronizacion(
  persistido: ReturnType<typeof cargarDietasOperativas>,
): string {
  if (usarApiDietasCocina()) {
    return "Sin sincronizar"
  }
  if (persistido?.ultimaSincronizacion) {
    return persistido.ultimaSincronizacion
  }
  return mockDietas.ultimaSincronizacion
}

export interface DietasOperativasContextValue {
  filas: FilaDieta[]
  ultimaSincronizacion: string
  meta: typeof configDietasOperativas
  catalogo: CatalogoDietaItem[]
  tiposDieta: string[]
  resolverTiposDietaParaComida: (comida: TiempoComida) => string[]
  consistencias: string[]
  sincronizandoCenso: boolean
  errorSincronizacion: string | null
  actualizarFila: (id: string, cambios: Partial<FilaDieta>) => void
  setFilas: React.Dispatch<React.SetStateAction<FilaDieta[]>>
  sincronizarCenso: (comida?: TiempoComida) => Promise<number>
  asignarConsistenciaMasiva: (ids: string[], consistencia: string) => number
  filasPorComida: (comida: TiempoComida) => FilaDieta[]
  guardarSolicitud: (id: string, datos: DatosSolicitudDietaInput) => Promise<FilaDieta>
  confirmarDietaApi: (id: string) => Promise<FilaDieta>
  confirmarMasivoApi: (ids: string[], usuario: string) => Promise<void>
  cancelarDietaApi: (id: string, payload: CancelarDietaPayload) => Promise<FilaDieta>
  reactivarDietaCanceladaApi: (id: string) => Promise<FilaDieta>
  registrarNovedadApi: (id: string, payload: NovedadDietaPayload) => Promise<FilaDieta>
  obtenerDetalleApi: (id: string) => Promise<FilaDieta>
  obtenerHistorialApi: (id: string) => Promise<EventoTrazabilidad[]>
  aplicarFilaRemota: (fila: FilaDieta) => void
}

const DietasOperativasContext = createContext<DietasOperativasContextValue | null>(
  null,
)

export function DietasOperativasProvider({ children }: { children: ReactNode }) {
  const apiActiva = usarApiDietasCocina()
  const persistido = useMemo(() => cargarDietasOperativas(), [apiActiva])
  const dietasRepository = useMemo(() => obtenerDietasOperativasRepository(), [])
  const censoInicialCargado = useRef(false)

  const [filas, setFilas] = useState<FilaDieta[]>(() => estadoInicialFilas(persistido))
  const filasRef = useRef(filas)
  filasRef.current = filas
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(() =>
    estadoInicialSincronizacion(persistido),
  )
  const [catalogo, setCatalogo] = useState<CatalogoDietaItem[]>([])
  const [sincronizandoCenso, setSincronizandoCenso] = useState(false)
  const [errorSincronizacion, setErrorSincronizacion] = useState<string | null>(
    null,
  )

  useEffect(() => {
    guardarDietasOperativas({ filas, ultimaSincronizacion })
  }, [filas, ultimaSincronizacion])

  useEffect(() => {
    if (!apiActiva) return
    void dietasRepository
      .obtenerCatalogo()
      .then(setCatalogo)
      .catch(() => setCatalogo([]))
  }, [apiActiva, dietasRepository])

  useEffect(() => {
    if (!apiActiva) return
    return suscribirEventosDietasCocina((evento) => {
      if (evento.tipo !== EVENTOS_DIETAS_COCINA.CatalogoActualizado) return
      invalidarCacheCatalogoDietas()
      void dietasRepository
        .obtenerCatalogo()
        .then(setCatalogo)
        .catch(() => {})
    })
  }, [apiActiva, dietasRepository])

  const actualizarFila = useCallback(
    (id: string, cambios: Partial<FilaDieta>) => {
      setFilas((prev) =>
        prev.map((fila) => (fila.id === id ? { ...fila, ...cambios } : fila)),
      )
    },
    [],
  )

  const reemplazarFila = useCallback((fila: FilaDieta) => {
    setFilas((prev) => reemplazarFilaPorIdOIdentidad(prev, fila))
  }, [])

  const aplicarFilaRemota = reemplazarFila

  const aplicarConflictoFila = useCallback(
    (error: unknown) => {
      if (!(error instanceof BitalApiError) || error.status !== 409) return
      if (!error.estadoActual || typeof error.estadoActual !== "object") return
      const fila = mapFilaDietaDtoToDomain(normalizarFilaDietaDto(error.estadoActual))
      if (fila.id || fila.pacienteId || fila.cedula) reemplazarFila(fila)
    },
    [reemplazarFila],
  )

  const syncEnVueloRef = useRef(false)
  const syncPendienteRef = useRef<Set<TiempoComida>>(new Set())

  const sincronizarCenso = useCallback(
    async (comida: TiempoComida = "almuerzo"): Promise<number> => {
      if (syncEnVueloRef.current) {
        syncPendienteRef.current.add(comida)
        return 0
      }
      syncEnVueloRef.current = true
      setSincronizandoCenso(true)
      setErrorSincronizacion(null)

      try {
        if (apiActiva) {
          requiereConexionApi()
          const { filas: filasFusionadas, totalEnCenso } =
            await sincronizarFilasDesdeCensoApi(comida, filasRef.current)
          setFilas(deduplicarFilasPorPacienteComida(filasFusionadas))
          setUltimaSincronizacion(formatearHoraSincronizacion())
          return totalEnCenso
        }

        const candidatos = await dietasRepository.obtenerCenso(
          fechaOperativaHoy(),
          comida,
        )
        let resultado = 0
        setFilas((prev) => {
          const idsExistentes = new Set(prev.map((f) => f.pacienteId))
          const nuevos = candidatos.filas
            .filter((fila) => !idsExistentes.has(fila.pacienteId))
            .map((fila, index) => ({
              ...fila,
              id: fila.id || `censo-${Date.now()}-${index}`,
            }))
          resultado = nuevos.length
          return deduplicarFilasPorPacienteComida(
            nuevos.length > 0 ? [...prev, ...nuevos] : prev,
          )
        })
        setUltimaSincronizacion(formatearHoraSincronizacion())
        return resultado
      } catch (error) {
        const mensaje =
          error instanceof Error
            ? error.message
            : "No se pudo sincronizar el censo hospitalario."
        setErrorSincronizacion(mensaje)
        throw error
      } finally {
        setSincronizandoCenso(false)
        syncEnVueloRef.current = false
        const [siguiente] = syncPendienteRef.current
        if (siguiente) {
          syncPendienteRef.current.delete(siguiente)
          void sincronizarCenso(siguiente)
        }
      }
    },
    [apiActiva, dietasRepository],
  )

  useEffect(() => {
    if (!apiActiva || censoInicialCargado.current) return
    censoInicialCargado.current = true
    if (!estaOnlineAhora()) return
    setSincronizandoCenso(true)
    void cargarFilasCensoDesdeApi(obtenerComidaActivaOperativa(), [])
      .then(({ filas: filasCargadas, totalEnCenso }) => {
        setFilas(deduplicarFilasPorPacienteComida(filasCargadas))
        setUltimaSincronizacion(formatearHoraSincronizacion())
        if (totalEnCenso === 0) {
          setErrorSincronizacion(null)
        }
      })
      .catch((error) => {
        setErrorSincronizacion(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el censo desde el API.",
        )
      })
      .finally(() => setSincronizandoCenso(false))
  }, [apiActiva])

  useEffect(() => {
    if (!apiActiva) return
    return suscribirRefreshCenso((comida) => {
      void sincronizarCenso(comida)
    })
  }, [apiActiva, sincronizarCenso])

  const asignarConsistenciaMasiva = useCallback(
    (ids: string[], consistencia: string) => {
      const setIds = new Set(ids)
      let actualizados = 0
      setFilas((prev) =>
        prev.map((fila) => {
          if (!setIds.has(fila.id)) return fila
          if (!requiereConsistencia(fila.comida)) return fila
          actualizados += 1
          return { ...fila, consistencia }
        }),
      )
      return actualizados
    },
    [],
  )

  const filasPorComida = useCallback(
    (comida: TiempoComida) => filas.filter((f) => f.comida === comida),
    [filas],
  )

  const guardarSolicitud = useCallback(
    async (id: string, datos: DatosSolicitudDietaInput) => {
      if (apiActiva) requiereConexionApi()
      const { id: filaId, filas: filasSync } = await resolverIdFilaApi(id, filasRef.current)
      if (filasSync !== filasRef.current) setFilas(filasSync)
      try {
        const fila = await dietasRepository.guardarSolicitud(filaId, datos)
        reemplazarFila(fila)
        return fila
      } catch (error) {
        aplicarConflictoFila(error)
        throw error
      }
    },
    [apiActiva, dietasRepository, reemplazarFila, aplicarConflictoFila],
  )

  const confirmarDietaApi = useCallback(
    async (id: string) => {
      if (apiActiva) requiereConexionApi()
      const { id: filaId, filas: filasSync } = await resolverIdFilaApi(id, filasRef.current)
      if (filasSync !== filasRef.current) setFilas(filasSync)
      try {
        const fila = await dietasRepository.confirmar(filaId)
        reemplazarFila(fila)
        return fila
      } catch (error) {
        aplicarConflictoFila(error)
        throw error
      }
    },
    [apiActiva, dietasRepository, reemplazarFila, aplicarConflictoFila],
  )

  const confirmarMasivoApi = useCallback(
    async (ids: string[], usuario: string) => {
      if (apiActiva) requiereConexionApi()
      let filasBase = filasRef.current
      const idsResueltos: string[] = []
      for (const id of ids) {
        const resuelto = await resolverIdFilaApi(id, filasBase)
        filasBase = resuelto.filas
        idsResueltos.push(resuelto.id)
      }
      setFilas(filasBase)
      await dietasRepository.confirmarMasivo(idsResueltos, usuario)
      await sincronizarCenso(obtenerComidaActivaOperativa())
    },
    [apiActiva, dietasRepository, sincronizarCenso],
  )

  const cancelarDietaApi = useCallback(
    async (id: string, payload: CancelarDietaPayload) => {
      if (apiActiva) requiereConexionApi()
      const { id: filaId, filas: filasSync } = await resolverIdFilaApi(id, filasRef.current)
      if (filasSync !== filasRef.current) setFilas(filasSync)
      try {
        const fila = await dietasRepository.cancelar(filaId, payload)
        reemplazarFila(fila)
        return fila
      } catch (error) {
        aplicarConflictoFila(error)
        throw error
      }
    },
    [apiActiva, dietasRepository, reemplazarFila, aplicarConflictoFila],
  )

  const reactivarDietaCanceladaApi = useCallback(
    async (id: string) => {
      if (apiActiva) requiereConexionApi()
      const { id: filaId, filas: filasSync } = await resolverIdFilaApi(id, filasRef.current)
      if (filasSync !== filasRef.current) setFilas(filasSync)
      try {
        const fila = await dietasRepository.reactivarCancelada(filaId)
        reemplazarFila(fila)
        return fila
      } catch (error) {
        aplicarConflictoFila(error)
        throw error
      }
    },
    [apiActiva, dietasRepository, reemplazarFila, aplicarConflictoFila],
  )

  const registrarNovedadApi = useCallback(
    async (id: string, payload: NovedadDietaPayload) => {
      if (apiActiva) requiereConexionApi()
      const { id: filaId, filas: filasSync } = await resolverIdFilaApi(id, filasRef.current)
      if (filasSync !== filasRef.current) setFilas(filasSync)
      try {
        const fila = await dietasRepository.registrarNovedad(filaId, payload)
        reemplazarFila(fila)
        return fila
      } catch (error) {
        aplicarConflictoFila(error)
        throw error
      }
    },
    [apiActiva, dietasRepository, reemplazarFila, aplicarConflictoFila],
  )

  const obtenerDetalleApi = useCallback(
    (id: string) => dietasRepository.obtenerDetalle(id),
    [dietasRepository],
  )

  const obtenerHistorialApi = useCallback(
    (id: string) => dietasRepository.obtenerHistorial(id),
    [dietasRepository],
  )

  const catalogoOperativo = useMemo(() => {
    if (apiActiva && catalogo.length > 0) return catalogo
    return MOCK_CATALOGO_DIETAS
  }, [apiActiva, catalogo])

  const tiposDieta = useMemo(
    () => catalogoOperativo.map((item) => item.nombre),
    [catalogoOperativo],
  )

  const resolverTiposDietaParaComida = useCallback(
    (comida: TiempoComida) => tiposDietaParaComida(comida, catalogoOperativo),
    [catalogoOperativo],
  )

  const meta = useMemo(
    () => ({
      ...configDietasOperativas,
      tiposDieta,
    }),
    [tiposDieta],
  )

  const value = useMemo(
    () => ({
      filas,
      ultimaSincronizacion,
      meta,
      catalogo: catalogoOperativo,
      tiposDieta,
      resolverTiposDietaParaComida,
      consistencias: configDietasOperativas.consistencias,
      sincronizandoCenso,
      errorSincronizacion,
      actualizarFila,
      setFilas,
      sincronizarCenso,
      asignarConsistenciaMasiva,
      filasPorComida,
      guardarSolicitud,
      confirmarDietaApi,
      confirmarMasivoApi,
      cancelarDietaApi,
      reactivarDietaCanceladaApi,
      registrarNovedadApi,
      obtenerDetalleApi,
      obtenerHistorialApi,
      aplicarFilaRemota,
    }),
    [
      filas,
      ultimaSincronizacion,
      meta,
      catalogoOperativo,
      tiposDieta,
      resolverTiposDietaParaComida,
      sincronizandoCenso,
      errorSincronizacion,
      actualizarFila,
      sincronizarCenso,
      asignarConsistenciaMasiva,
      filasPorComida,
      guardarSolicitud,
      confirmarDietaApi,
      confirmarMasivoApi,
      cancelarDietaApi,
      reactivarDietaCanceladaApi,
      registrarNovedadApi,
      obtenerDetalleApi,
      obtenerHistorialApi,
      aplicarFilaRemota,
    ],
  )

  return (
    <DietasOperativasContext.Provider value={value}>
      {children}
    </DietasOperativasContext.Provider>
  )
}

export function useDietasOperativas(): DietasOperativasContextValue {
  const ctx = useContext(DietasOperativasContext)
  if (!ctx) {
    throw new Error(
      "useDietasOperativas debe usarse dentro de DietasOperativasProvider",
    )
  }
  return ctx
}
