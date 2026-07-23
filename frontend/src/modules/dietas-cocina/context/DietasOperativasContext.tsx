import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  mockDietas,
  type FilaDieta,
} from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import {
  cargarDietasOperativas,
  guardarDietasOperativas,
} from "@/modules/dietas-cocina/lib/dietasStorage"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

/** Pacientes nuevos del censo hospitalario (demo). */
const CENSO_NUEVOS: Omit<FilaDieta, "id">[] = [
  {
    pacienteId: "PAC-11001",
    paciente: "Salazar, L.",
    edad: 38,
    servicio: "Medicina Interna",
    pabellon: "Pab. Central",
    habitacion: "303-B",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "Ingreso reciente — pendiente valoración nutricional.",
    estado: "no-solicitada",
    comida: "almuerzo",
  },
  {
    pacienteId: "PAC-11002",
    paciente: "Peña, R.",
    edad: 52,
    servicio: "Cirugía General",
    pabellon: "Pab. Norte",
    habitacion: "405-C",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "Ninguno",
    alergico: false,
    alergias: "",
    observacionAislamiento: "",
    observaciones: "",
    estado: "no-solicitada",
    comida: "almuerzo",
  },
  {
    pacienteId: "PAC-11003",
    paciente: "Ortiz, M.",
    edad: 67,
    servicio: "UCI",
    pabellon: "Pab. Norte",
    habitacion: "316-A",
    consistencia: null,
    tipoDieta: null,
    aislamiento: "Contacto",
    alergico: true,
    alergias: "Penicilina",
    observacionAislamiento: "Precauciones de contacto.",
    observaciones: "",
    estado: "no-solicitada",
    comida: "almuerzo",
  },
]

function formatearHoraSincronizacion(): string {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface DietasOperativasContextValue {
  filas: FilaDieta[]
  ultimaSincronizacion: string
  meta: typeof mockDietas
  actualizarFila: (id: string, cambios: Partial<FilaDieta>) => void
  setFilas: React.Dispatch<React.SetStateAction<FilaDieta[]>>
  sincronizarCenso: () => number
  asignarConsistenciaMasiva: (ids: string[], consistencia: string) => number
  filasPorComida: (comida: TiempoComida) => FilaDieta[]
}

const DietasOperativasContext = createContext<DietasOperativasContextValue | null>(
  null,
)

export function DietasOperativasProvider({ children }: { children: ReactNode }) {
  const persistido = useMemo(() => cargarDietasOperativas(), [])

  const [filas, setFilas] = useState<FilaDieta[]>(
    () => persistido?.filas ?? mockDietas.filas.map((f) => ({ ...f })),
  )
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(
    () => persistido?.ultimaSincronizacion ?? mockDietas.ultimaSincronizacion,
  )

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

  const sincronizarCenso = useCallback(() => {
    let agregados = 0
    setFilas((prev) => {
      const idsExistentes = new Set(prev.map((f) => f.pacienteId))
      const nuevos = CENSO_NUEVOS.filter((f) => !idsExistentes.has(f.pacienteId)).map(
        (fila, index) => ({
          ...fila,
          id: `censo-${Date.now()}-${index}`,
        }),
      )
      agregados = nuevos.length
      return nuevos.length > 0 ? [...prev, ...nuevos] : prev
    })
    setUltimaSincronizacion(formatearHoraSincronizacion())
    return agregados
  }, [])

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
      meta: mockDietas,
      actualizarFila,
      setFilas,
      sincronizarCenso,
      asignarConsistenciaMasiva,
      filasPorComida,
    }),
    [
      filas,
      ultimaSincronizacion,
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
