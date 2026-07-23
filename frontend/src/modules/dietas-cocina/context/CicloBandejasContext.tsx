import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { obtenerCicloBandejasRepository } from "@/modules/dietas-cocina/api"

import {
  crearOrdenesIniciales,
  type OrdenCocina,
} from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import {
  crearEtiquetasEnfermeraIniciales,
  type EtiquetaEnfermera,
  type MotivoDevolucion,
} from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import {
  mockEtiquetas,
  type EtiquetaDieta,
  type EstadoEtiqueta,
} from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import { formatearHoraActual } from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"
import {
  puedeCancelarOrdenCocina,
  puedeConfirmarDevolucion,
  puedeConfirmarEntrega,
  puedeConfirmarPreEntrega,
  puedeDespachar,
  puedeEditarChecklist,
  puedeGenerarEtiqueta,
  puedeMarcarLista,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { crearEstadoInicialCicloBandejas, sincronizarSeedsCocinaEtiquetas } from "@/modules/dietas-cocina/lib/sincronizarSeedsCocinaEtiquetas"
import { cargarCicloBandejas, guardarCicloBandejas } from "@/modules/dietas-cocina/lib/cicloBandejasStorage"

interface ConfirmarDevolucionInput {
  motivo: MotivoDevolucion
  observaciones?: string
  fotoDevolucion?: string
}

export interface CrearOrdenDesdeDietaInput {
  pacienteId: string
  paciente: string
  edad: number
  pabellon: string
  habitacion: string
  cama?: string
  tipoDieta: string
  consistencia: string
  comida: OrdenCocina["comida"]
  aislado?: boolean
  alergias?: string[]
  observaciones?: string
}

interface CicloBandejasContextValue {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
  buscarPorCodigo: (codigo: string) => EtiquetaEnfermera | undefined
  getEtiquetaByOrdenId: (ordenId: string) => EtiquetaEnfermera | undefined
  getOrdenByEtiquetaId: (etiquetaId: string) => OrdenCocina | undefined
  marcarEnPreparacion: (ids: string[]) => void
  marcarComoLista: (ids: string[]) => void
  registrarDespacho: (ids: string[]) => void
  generarEtiquetas: (ordenIds: string[]) => string[]
  marcarEtiquetasImpresas: (etiquetaIds: string[]) => void
  reimprimirEtiquetas: (etiquetaIds: string[]) => void
  crearOrdenDesdeDieta: (input: CrearOrdenDesdeDietaInput) => string
  cancelarOrdenCocina: (ordenId: string) => boolean
  confirmarPreEntrega: (ids: string[], recibidoPor?: string) => void
  confirmarEntrega: (id: string) => void
  confirmarDevolucion: (id: string, input: ConfirmarDevolucionInput) => void
  contarRecibidasEnfermeria: () => number
  actualizarChecklist: (
    ordenId: string,
    checklistId: string,
    completado: boolean,
  ) => void
  rehidratarDesdeStorage: () => void
}

const CicloBandejasContext = createContext<CicloBandejasContextValue | null>(
  null,
)

function sincronizarOrdenConEtiqueta(
  orden: OrdenCocina,
  etiqueta: EtiquetaEnfermera,
): OrdenCocina {
  return {
    ...orden,
    estadoLogistica: etiqueta.estadoLogistica,
    etiquetaImpresa:
      etiqueta.estado === "impresa" ||
      etiqueta.estado === "reimpresa" ||
      etiqueta.estadoLogistica === "impresa",
    etiquetaGenerada: true,
    etiquetaId: etiqueta.id,
  }
}

function ordenToEtiquetaBase(orden: OrdenCocina, id: string): EtiquetaDieta {
  const codigo = `LBL-${9000 + parseInt(id.replace(/\D/g, "") || "0", 10)}-X`
  return {
    id,
    codigo,
    pacienteId: orden.pacienteId,
    paciente: orden.paciente,
    documento: "—",
    edad: orden.edad,
    aislamiento: orden.aislado,
    pabellon: orden.pabellon,
    habitacion: orden.habitacion,
    tipoDieta: orden.tipoDieta,
    consistencia: orden.consistencia,
    observaciones: orden.observaciones,
    comida: orden.comida,
    fechaHora: mockEtiquetas.fechaReferencia,
    estado: "generada",
    qrPayload: payloadQrEtiqueta(codigo),
  }
}

const estadoInicialSeed = crearEstadoInicialCicloBandejas(
  crearOrdenesIniciales(),
  crearEtiquetasEnfermeraIniciales(),
)

const persistidoSync = cargarCicloBandejas()
const estadoInicial = persistidoSync
  ? sincronizarSeedsCocinaEtiquetas(persistidoSync.ordenes, persistidoSync.etiquetas)
  : estadoInicialSeed

const repository = obtenerCicloBandejasRepository()

export function CicloBandejasProvider({ children }: { children: ReactNode }) {
  const [ordenes, setOrdenes] = useState<OrdenCocina[]>(estadoInicial.ordenes)
  const [etiquetas, setEtiquetas] = useState<EtiquetaEnfermera[]>(
    estadoInicial.etiquetas,
  )
  const [hidrato, setHidrato] = useState(Boolean(persistidoSync))

  useEffect(() => {
    if (hidrato) return
    void repository.cargar().then((persistido) => {
      if (persistido) {
        const sync = sincronizarSeedsCocinaEtiquetas(
          persistido.ordenes,
          persistido.etiquetas,
        )
        setOrdenes(sync.ordenes)
        setEtiquetas(sync.etiquetas)
      }
      setHidrato(true)
    })
  }, [hidrato])

  useEffect(() => {
    if (!hidrato) return
    void repository.guardar({ ordenes, etiquetas })
    guardarCicloBandejas({ ordenes, etiquetas })
  }, [ordenes, etiquetas, hidrato])

  const syncOrdenesFromEtiquetas = useCallback(
    (prevOrdenes: OrdenCocina[], nextEtiquetas: EtiquetaEnfermera[]) => {
      const map = new Map(nextEtiquetas.map((e) => [e.id, e]))
      return prevOrdenes.map((orden) => {
        if (!orden.etiquetaId) return orden
        const etq = map.get(orden.etiquetaId)
        return etq ? sincronizarOrdenConEtiqueta(orden, etq) : orden
      })
    },
    [],
  )

  const buscarPorCodigo = useCallback(
    (codigo: string) => repository.buscarEtiquetaPorCodigo(etiquetas, codigo),
    [etiquetas],
  )

  const getEtiquetaByOrdenId = useCallback(
    (ordenId: string) => {
      const orden = ordenes.find((o) => o.id === ordenId)
      if (!orden?.etiquetaId) return undefined
      return etiquetas.find((e) => e.id === orden.etiquetaId)
    },
    [ordenes, etiquetas],
  )

  const getOrdenByEtiquetaId = useCallback(
    (etiquetaId: string) => ordenes.find((o) => o.etiquetaId === etiquetaId),
    [ordenes],
  )

  const marcarEnPreparacion = useCallback((ids: string[]) => {
    setOrdenes((prev) =>
      prev.map((o) =>
        ids.includes(o.id) &&
        (o.estadoCocina === "por_iniciar" || o.estadoCocina === "en_preparacion")
          ? { ...o, estadoCocina: "en_preparacion" }
          : o,
      ),
    )
  }, [])

  const marcarComoLista = useCallback((ids: string[]) => {
    setOrdenes((prev) =>
      prev.map((o) =>
        ids.includes(o.id) && puedeMarcarLista(o)
          ? { ...o, estadoCocina: "lista" }
          : o,
      ),
    )
  }, [])

  const registrarDespacho = useCallback(
    (ids: string[]) => {
      const mapEtiquetas = new Map(etiquetas.map((e) => [e.id, e]))
      const idsDespachables = ordenes
        .filter((o) => {
          if (!ids.includes(o.id) || o.estadoCocina !== "lista") return false
          const etq = o.etiquetaId ? mapEtiquetas.get(o.etiquetaId) : undefined
          return puedeDespachar(o, etq)
        })
        .map((o) => o.id)

      if (idsDespachables.length === 0) return

      setOrdenes((prev) =>
        prev.map((o) =>
          idsDespachables.includes(o.id)
            ? { ...o, estadoCocina: "despachada" as const }
            : o,
        ),
      )
    },
    [ordenes, etiquetas],
  )

  const generarEtiquetas = useCallback(
    (ordenIds: string[]) => {
      const targetOrdenes = ordenes.filter(
        (o) =>
          ordenIds.includes(o.id) &&
          o.estadoCocina === "lista" &&
          !o.etiquetaGenerada,
      )
      const nuevosIds = targetOrdenes.map(
        (o) => o.etiquetaId ?? `etq-gen-${o.id}`,
      )
      const nuevasEtiquetas = targetOrdenes
        .filter((o) => !o.etiquetaId)
        .map((orden) => {
          const newId = `etq-gen-${orden.id}`
          return {
            ...ordenToEtiquetaBase(orden, newId),
            estadoLogistica: "generada" as const,
            alergias: orden.alergias,
            pabellonDetalle: orden.pabellon,
            cama: orden.cama,
          }
        })

      if (nuevasEtiquetas.length > 0) {
        setEtiquetas((prev) => [...prev, ...nuevasEtiquetas])
      }

      setOrdenes((prev) =>
        prev.map((o) => {
          if (
            !ordenIds.includes(o.id) ||
            o.estadoCocina !== "lista" ||
            o.etiquetaGenerada
          ) {
            return o
          }
          return {
            ...o,
            etiquetaId: o.etiquetaId ?? `etq-gen-${o.id}`,
            etiquetaGenerada: true,
          }
        }),
      )

      return nuevosIds
    },
    [ordenes],
  )

  const marcarEtiquetasImpresas = useCallback((etiquetaIds: string[]) => {
    setEtiquetas((prev) => {
      const next = prev.map((e) => {
        if (!etiquetaIds.includes(e.id)) return e
        if (e.estadoLogistica !== "generada" && e.estadoLogistica !== undefined) {
          return e
        }
        return {
          ...e,
          estado: "impresa" as EstadoEtiqueta,
          estadoLogistica: "impresa" as const,
          qrPayload: payloadQrEtiqueta(e.codigo),
        }
      })
      setOrdenes((prevOrdenes) => syncOrdenesFromEtiquetas(prevOrdenes, next))
      return next
    })
  }, [syncOrdenesFromEtiquetas])

  const reimprimirEtiquetas = useCallback((etiquetaIds: string[]) => {
    setEtiquetas((prev) => {
      const next = prev.map((e) =>
        etiquetaIds.includes(e.id) &&
        (e.estado === "impresa" ||
          e.estado === "reimpresa" ||
          e.estadoLogistica === "impresa")
          ? {
              ...e,
              estado: "reimpresa" as EstadoEtiqueta,
              qrPayload: payloadQrEtiqueta(e.codigo),
            }
          : e,
      )
      setOrdenes((prevOrdenes) => syncOrdenesFromEtiquetas(prevOrdenes, next))
      return next
    })
  }, [syncOrdenesFromEtiquetas])

  const crearOrdenDesdeDieta = useCallback((input: CrearOrdenDesdeDietaInput) => {
    const existente = ordenes.find(
      (o) =>
        o.pacienteId === input.pacienteId &&
        o.comida === input.comida &&
        o.estadoCocina !== "cancelada",
    )
    if (existente) return existente.id

    const id = `ord-diet-${Date.now()}`
    const nuevaOrden: OrdenCocina = {
      id,
      pacienteId: input.pacienteId,
      paciente: input.paciente,
      edad: input.edad,
      pabellon: input.pabellon,
      habitacion: input.habitacion,
      cama: input.cama,
      tipoDieta: input.tipoDieta,
      consistencia: input.consistencia,
      comida: input.comida,
      aislado: input.aislado ?? false,
      alergias: input.alergias ?? [],
      observaciones: input.observaciones ?? "",
      estadoCocina: "por_iniciar",
      etiquetaImpresa: false,
      etiquetaGenerada: false,
      checklist: [
        { id: "ck-1", label: "Receta revisada", obligatorio: false, completado: false },
        { id: "ck-2", label: "Alergias revisadas", obligatorio: true, completado: false },
        { id: "ck-3", label: "Aislamiento identificado", obligatorio: true, completado: false },
        { id: "ck-4", label: "Porción verificada", obligatorio: false, completado: false },
      ],
    }
    setOrdenes((prev) => [...prev, nuevaOrden])
    return id
  }, [ordenes])

  const cancelarOrdenCocina = useCallback((ordenId: string) => {
    const orden = ordenes.find((o) => o.id === ordenId)
    if (!orden || !puedeCancelarOrdenCocina(orden)) return false
    setOrdenes((prev) =>
      prev.map((o) =>
        o.id === ordenId ? { ...o, estadoCocina: "cancelada" as const } : o,
      ),
    )
    return true
  }, [ordenes])

  const confirmarPreEntrega = useCallback(
    (ids: string[], recibidoPor?: string) => {
      const hora = formatearHoraActual()
      const mapOrdenes = new Map(
        ordenes
          .filter((o) => o.etiquetaId)
          .map((o) => [o.etiquetaId!, o]),
      )
      setEtiquetas((prev) => {
        const next = prev.map((e) => {
          if (!ids.includes(e.id)) return e
          const orden = mapOrdenes.get(e.id)
          if (!puedeConfirmarPreEntrega(orden, e)) return e
          return {
            ...e,
            estadoLogistica: "pre_entregada" as const,
            horaPreEntrega: hora,
            recibidoPor: recibidoPor ?? "Enfermera",
          }
        })
        setOrdenes((prevOrdenes) => syncOrdenesFromEtiquetas(prevOrdenes, next))
        return next
      })
    },
    [syncOrdenesFromEtiquetas, ordenes],
  )

  const confirmarEntrega = useCallback(
    (id: string) => {
      const hora = formatearHoraActual()
      setEtiquetas((prev) => {
        const next = prev.map((e) =>
          e.id === id && puedeConfirmarEntrega(e)
            ? { ...e, estadoLogistica: "entregada" as const, horaEntrega: hora }
            : e,
        )
        setOrdenes((prevOrdenes) => syncOrdenesFromEtiquetas(prevOrdenes, next))
        return next
      })
    },
    [syncOrdenesFromEtiquetas],
  )

  const confirmarDevolucion = useCallback(
    (id: string, input: ConfirmarDevolucionInput) => {
      const hora = formatearHoraActual()
      setEtiquetas((prev) => {
        const next = prev.map((e) =>
          e.id === id && puedeConfirmarDevolucion(e)
            ? {
                ...e,
                estadoLogistica: "devuelta" as const,
                horaDevolucion: hora,
                motivoDevolucion: input.motivo,
                observacionesDevolucion: input.observaciones,
                fotoDevolucion: input.fotoDevolucion,
              }
            : e,
        )
        setOrdenes((prevOrdenes) => syncOrdenesFromEtiquetas(prevOrdenes, next))
        return next
      })
    },
    [syncOrdenesFromEtiquetas],
  )

  const contarRecibidasEnfermeria = useCallback(
    () =>
      etiquetas.filter(
        (e) =>
          e.estadoLogistica === "pre_entregada" ||
          e.estadoLogistica === "entregada" ||
          e.estadoLogistica === "devuelta",
      ).length,
    [etiquetas],
  )

  const actualizarChecklist = useCallback(
    (ordenId: string, checklistId: string, completado: boolean) => {
      setOrdenes((prev) =>
        prev.map((o) => {
          if (o.id !== ordenId || !puedeEditarChecklist(o)) return o
          return {
            ...o,
            checklist: o.checklist.map((c) =>
              c.id === checklistId ? { ...c, completado } : c,
            ),
          }
        }),
      )
    },
    [],
  )

  const rehidratarDesdeStorage = useCallback(() => {
    const persistido = cargarCicloBandejas()
    if (!persistido) return
    const sync = sincronizarSeedsCocinaEtiquetas(
      persistido.ordenes,
      persistido.etiquetas,
    )
    setOrdenes(sync.ordenes)
    setEtiquetas(sync.etiquetas)
  }, [])

  const value = useMemo(
    () => ({
      ordenes,
      etiquetas,
      buscarPorCodigo,
      getEtiquetaByOrdenId,
      getOrdenByEtiquetaId,
      marcarEnPreparacion,
      marcarComoLista,
      registrarDespacho,
      generarEtiquetas,
      marcarEtiquetasImpresas,
      reimprimirEtiquetas,
      crearOrdenDesdeDieta,
      cancelarOrdenCocina,
      confirmarPreEntrega,
      confirmarEntrega,
      confirmarDevolucion,
      contarRecibidasEnfermeria,
      actualizarChecklist,
      rehidratarDesdeStorage,
    }),
    [
      ordenes,
      etiquetas,
      buscarPorCodigo,
      getEtiquetaByOrdenId,
      getOrdenByEtiquetaId,
      marcarEnPreparacion,
      marcarComoLista,
      registrarDespacho,
      generarEtiquetas,
      marcarEtiquetasImpresas,
      reimprimirEtiquetas,
      crearOrdenDesdeDieta,
      cancelarOrdenCocina,
      confirmarPreEntrega,
      confirmarEntrega,
      confirmarDevolucion,
      contarRecibidasEnfermeria,
      actualizarChecklist,
      rehidratarDesdeStorage,
    ],
  )

  return (
    <CicloBandejasContext.Provider value={value}>
      {children}
    </CicloBandejasContext.Provider>
  )
}

export function useCicloBandejas() {
  const ctx = useContext(CicloBandejasContext)
  if (!ctx) {
    throw new Error(
      "useCicloBandejas debe usarse dentro de CicloBandejasProvider",
    )
  }
  return ctx
}

export function useCicloBandejasOpcional() {
  return useContext(CicloBandejasContext)
}
