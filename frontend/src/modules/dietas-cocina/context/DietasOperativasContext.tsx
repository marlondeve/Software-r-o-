import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
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

import {
  obtenerCensoRepository,
  usarApiDietasCocina,
} from "@/modules/dietas-cocina/api"
import { configDietasOperativas, mockDietas } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { cargarFilasCensoDesdeApi } from "@/modules/dietas-cocina/lib/cargarCensoHospitalario"
import {
  cargarDietasOperativas,
  guardarDietasOperativas,
} from "@/modules/dietas-cocina/lib/dietasStorage"
function formatearHoraSincronizacion(): string {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function estadoInicialFilas(persistido: ReturnType<typeof cargarDietasOperativas>): FilaDieta[] {
  if (persistido?.filas.length) {
    return persistido.filas.map((fila) => ({ ...fila }))
  }
  if (usarApiDietasCocina()) {
    return []
  }
  return mockDietas.filas.map((fila) => ({ ...fila }))
}

function estadoInicialSincronizacion(
  persistido: ReturnType<typeof cargarDietasOperativas>,
): string {
  if (persistido?.ultimaSincronizacion) {
    return persistido.ultimaSincronizacion
  }
  return usarApiDietasCocina() ? "Sin sincronizar" : mockDietas.ultimaSincronizacion
}

interface DietasOperativasContextValue {
  filas: FilaDieta[]
  ultimaSincronizacion: string
  meta: typeof configDietasOperativas
  sincronizandoCenso: boolean
  errorSincronizacion: string | null
  actualizarFila: (id: string, cambios: Partial<FilaDieta>) => void
  setFilas: React.Dispatch<React.SetStateAction<FilaDieta[]>>
  sincronizarCenso: (comida?: TiempoComida) => Promise<number>
  asignarConsistenciaMasiva: (ids: string[], consistencia: string) => number
  filasPorComida: (comida: TiempoComida) => FilaDieta[]
}

const DietasOperativasContext = createContext<DietasOperativasContextValue | null>(
  null,
)

export function DietasOperativasProvider({ children }: { children: ReactNode }) {
  const apiActiva = usarApiDietasCocina()
  const persistido = useMemo(() => cargarDietasOperativas(), [])
  const censoRepository = useMemo(() => obtenerCensoRepository(), [])
  const censoInicialCargado = useRef(false)

  const [filas, setFilas] = useState<FilaDieta[]>(() => estadoInicialFilas(persistido))
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(() =>
    estadoInicialSincronizacion(persistido),
  )
  const [sincronizandoCenso, setSincronizandoCenso] = useState(false)
  const [errorSincronizacion, setErrorSincronizacion] = useState<string | null>(
    null,
  )
  const filasRef = useRef(filas)
  filasRef.current = filas

  useEffect(() => {
    guardarDietasOperativas({ filas, ultimaSincronizacion })
  }, [filas, ultimaSincronizacion])

  const actualizarFila = useCallback(
    (id: string, cambios: Partial<FilaDieta>) => {
      setFilas((prev) =>
        prev.map((fila) => (fila.id === id ? { ...fila, ...cambios } : fila)),
      )
    },
    [],
  )

  const sincronizarCenso = useCallback(
    async (comida: TiempoComida = "almuerzo"): Promise<number> => {
      setSincronizandoCenso(true)
      setErrorSincronizacion(null)

      try {
        let resultado = 0

        if (apiActiva) {
          const { filas: filasActualizadas, totalEnCenso } =
            await cargarFilasCensoDesdeApi(comida, filasRef.current)
          setFilas(filasActualizadas)
          resultado = totalEnCenso
        } else {
          const candidatos =
            await censoRepository.obtenerPacientesHospitalizados(comida)

          setFilas((prev) => {
            const idsExistentes = new Set(prev.map((f) => f.pacienteId))
            const nuevos = candidatos
              .filter((fila) => !idsExistentes.has(fila.pacienteId))
              .map((fila, index) => ({
                ...fila,
                id: `censo-${Date.now()}-${index}`,
              }))
            resultado = nuevos.length
            return nuevos.length > 0 ? [...prev, ...nuevos] : prev
          })
        }

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
      }
    },
    [apiActiva, censoRepository],
  )

  useEffect(() => {
    if (!apiActiva || censoInicialCargado.current) return
    if (persistido?.filas.length) {
      censoInicialCargado.current = true
      return
    }
    censoInicialCargado.current = true
    void sincronizarCenso(configDietasOperativas.comidaActiva).catch(() => {})
  }, [apiActiva, persistido, sincronizarCenso])

  const asignarConsistenciaMasiva = useCallback(
    (ids: string[], consistencia: string) => {
      const setIds = new Set(ids)
      let actualizados = 0
      setFilas((prev) =>
        prev.map((fila) => {
          if (!setIds.has(fila.id)) return fila
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

  const value = useMemo(
    () => ({
      filas,
      ultimaSincronizacion,
      meta: configDietasOperativas,
      sincronizandoCenso,
      errorSincronizacion,
      actualizarFila,
      setFilas,
      sincronizarCenso,
      asignarConsistenciaMasiva,
      filasPorComida,
    }),
    [
      filas,
      ultimaSincronizacion,
      sincronizandoCenso,
      errorSincronizacion,
      actualizarFila,
      sincronizarCenso,
      asignarConsistenciaMasiva,
      filasPorComida,
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
