import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { cicloBandejasRepositoryHttp } from "@/modules/dietas-cocina/api/cicloBandejasRepository.http"
import { cicloBandejasRepositoryMock } from "@/modules/dietas-cocina/api/cicloBandejasRepository.mock"
import { etiquetasRepositoryHttp } from "@/modules/dietas-cocina/api/etiquetasRepository.http"
import { etiquetasRepositoryMock } from "@/modules/dietas-cocina/api/etiquetasRepository.mock"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api/flags"
import {
  fusionarOrdenesCocina,
  mapChecklistFromApi,
  checklistMasCompleto,
  mapFilasDietasToOrdenesCocina,
} from "@/modules/dietas-cocina/api/mappers/ordenCocina.mapper"
import { deduplicarEtiquetasPorFila } from "@/modules/dietas-cocina/api/mappers/etiqueta.mapper"
import { enriquecerEtiquetasConOrdenes } from "@/modules/dietas-cocina/etiquetas/lib/enriquecerEtiquetasConOrdenes"
import {
  actualizarEstadoOrdenCocina,
  actualizarChecklistOrdenCocina,
  cancelarOrdenCocinaApi,
} from "@/modules/dietas-cocina/api/services/ordenes-cocina-api.service"
import { CicloBandejasContext } from "@/modules/dietas-cocina/context/cicloBandejasContextStore"
import { crearOrdenesIniciales } from "@/modules/dietas-cocina/cocina/datos/mockCocina"
import { crearEtiquetasEnfermeraIniciales } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type {
  ConfirmarDevolucionInput,
  CrearOrdenDesdeDietaInput,
} from "@/modules/dietas-cocina/types/tray-cycle"
import type { EstadoEtiqueta } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaDieta, EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { formatearHoraActual } from "@/modules/dietas-cocina/etiquetas/lib/etiquetasEnfermeraEstilos"
import { generarCodigoEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/generarCodigoEtiqueta"
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"
import {
  contarOperacionesConConflicto,
  contarOperacionesPendientes,
  crearClientIdBandeja,
  descartarOperacionBandeja,
  encolarOperacionBandeja,
  listarOperacionesPendientes,
  reintentarOperacionBandeja,
  suscribirOutboxBandejas,
} from "@/modules/dietas-cocina/lib/bandejasOutbox"
import {
  limpiarAdjuntosOperacion,
  sincronizarOutboxBandejas,
} from "@/modules/dietas-cocina/lib/bandejasSyncService"
import { guardarFotoDevolucionOffline } from "@/modules/dietas-cocina/lib/bandejasFotosDb"
import {
  estaOnlineAhora,
  suscribirConectividadRed,
} from "@/hooks/useConectividadRed"
import { esErrorRed } from "@/lib/esErrorRed"
import {
  checklistObligatorioCompleto,
  motivoNoGenerarEtiqueta,
  puedeCancelarOrdenCocina,
  puedeConfirmarDevolucion,
  puedeConfirmarEntrega,
  puedeConfirmarPreEntrega,
  puedeDespachar,
  puedeEditarChecklist,
  puedeMarcarLista,
} from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { crearEstadoInicialCicloBandejas, sincronizarSeedsCocinaEtiquetas } from "@/modules/dietas-cocina/lib/sincronizarSeedsCocinaEtiquetas"
import {
  filtrarOrdenesVinculadasAFilas,
  resolverEtiquetaParaOrden,
} from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import {
  guardarChecklistOrden,
  cargarOrdenCocinaApiId,
  migrarOverridesCocinaLegacy,
} from "@/modules/dietas-cocina/lib/cocinaOverridesStorage"
import { solicitarRefreshCenso } from "@/modules/dietas-cocina/lib/cocinaSyncBus"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { cargarCicloBandejas, guardarCicloBandejas } from "@/modules/dietas-cocina/lib/cicloBandejasStorage"
import {
  aplicarVinculoOrdenesEnApi,
  vincularOrdenesCocinaEnApi,
} from "@/modules/dietas-cocina/lib/vincularOrdenCocinaApi"

export type { CrearOrdenDesdeDietaInput } from "@/modules/dietas-cocina/types/tray-cycle"

function vincularEtiquetasGeneradas(
  ordenes: OrdenCocina[],
  etiquetasNuevas: EtiquetaEnfermera[],
): OrdenCocina[] {
  if (etiquetasNuevas.length === 0) return ordenes
  return ordenes.map((orden) => {
    const etiqueta = resolverEtiquetaParaOrden(orden, etiquetasNuevas)
    if (!etiqueta) return orden
    return {
      ...orden,
      etiquetaId: etiqueta.id,
      etiquetaGenerada: true,
      estadoLogistica: etiqueta.estadoLogistica,
      etiquetaImpresa:
        etiqueta.estado === "impresa" ||
        etiqueta.estado === "reimpresa" ||
        etiqueta.estadoLogistica === "impresa",
    }
  })
}

function idsEtiquetasParaOrdenes(
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): string[] {
  const ids: string[] = []
  for (const orden of ordenes) {
    const etiqueta =
      resolverEtiquetaParaOrden(orden, etiquetas) ??
      etiquetas.find((e) => e.id === orden.etiquetaId) ??
      etiquetas.find((e) => e.filaDietaId === orden.id) ??
      (orden.ordenCocinaApiId
        ? etiquetas.find((e) => e.ordenCocinaId === orden.ordenCocinaApiId)
        : undefined)
    if (etiqueta) ids.push(etiqueta.id)
  }
  return [...new Set(ids)]
}

function resolverCicloBandejasRepository() {
  return usarApiDietasCocina() ? cicloBandejasRepositoryHttp : cicloBandejasRepositoryMock
}

function resolverEtiquetasRepository() {
  return usarApiDietasCocina() ? etiquetasRepositoryHttp : etiquetasRepositoryMock
}

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
  const codigo = generarCodigoEtiqueta()
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

function resolverOrdenPorEtiquetaId(
  etiquetaId: string,
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): OrdenCocina | undefined {
  const porEtiquetaId = ordenes.find((o) => o.etiquetaId === etiquetaId)
  if (porEtiquetaId) return porEtiquetaId

  const etiqueta = etiquetas.find((e) => e.id === etiquetaId)
  if (!etiqueta) return undefined

  if (etiqueta.filaDietaId) {
    const porFila = ordenes.find((o) => o.id === etiqueta.filaDietaId)
    if (porFila) return porFila
  }

  if (etiqueta.ordenCocinaId) {
    const porApi = ordenes.find((o) => o.ordenCocinaApiId === etiqueta.ordenCocinaId)
    if (porApi) return porApi
  }

  return undefined
}

function ordenConChecklistObligatorioForzado(orden: OrdenCocina): OrdenCocina {
  if (checklistObligatorioCompleto(orden)) return orden
  return {
    ...orden,
    checklist: orden.checklist.map((item) =>
      item.obligatorio ? { ...item, completado: true } : item,
    ),
  }
}

/** Sincroniza checklist y marca la orden como Completada en el API. */
async function completarOrdenesCocinaEnApi(
  ordenes: OrdenCocina[],
  opciones?: { forzarChecklistObligatorio?: boolean },
): Promise<{ completadas: string[]; fallidas: string[] }> {
  const porApiId = new Map<string, OrdenCocina>()
  for (const orden of ordenes) {
    const apiId = orden.ordenCocinaApiId ?? cargarOrdenCocinaApiId(orden.id)
    if (!apiId) continue
    const ordenSync = opciones?.forzarChecklistObligatorio
      ? ordenConChecklistObligatorioForzado(orden)
      : orden
    const previo = porApiId.get(apiId)
    porApiId.set(
      apiId,
      previo
        ? {
            ...previo,
            checklist: checklistMasCompleto(previo.checklist, ordenSync.checklist),
          }
        : ordenSync,
    )
  }

  const completadas: string[] = []
  const fallidas: string[] = []

  for (const [apiId, orden] of porApiId) {
    try {
      if (orden.checklist.length > 0) {
        await actualizarChecklistOrdenCocina(apiId, {
          items: orden.checklist.map((item) => ({
            id: item.id,
            completado: item.completado,
          })),
        })
      }
      await actualizarEstadoOrdenCocina(apiId, { estado: "Completada" })
      completadas.push(apiId)
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error al completar orden"
      // Si ya estaba completada, se puede generar etiqueta de todas formas.
      if (/completad/i.test(mensaje) || /ya está/i.test(mensaje)) {
        completadas.push(apiId)
      } else {
        fallidas.push(`${orden.paciente || apiId}: ${mensaje}`)
      }
    }
  }

  return { completadas, fallidas }
}

/** Marca Completada en el API usando el id de orden vinculado a la etiqueta. */
async function completarOrdenesPorEtiquetaIdsEnApi(
  etiquetaIds: string[],
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): Promise<void> {
  const ordenesVinculadas: OrdenCocina[] = []
  const apiIdsDirectos: string[] = []

  for (const etiquetaId of etiquetaIds) {
    const orden = resolverOrdenPorEtiquetaId(etiquetaId, ordenes, etiquetas)
    if (orden) {
      ordenesVinculadas.push(orden)
      continue
    }

    const etiqueta = etiquetas.find((e) => e.id === etiquetaId)
    if (etiqueta?.ordenCocinaId) {
      apiIdsDirectos.push(etiqueta.ordenCocinaId)
    }
  }

  if (ordenesVinculadas.length > 0) {
    await completarOrdenesCocinaEnApi(ordenesVinculadas, {
      forzarChecklistObligatorio: true,
    })
  }

  for (const apiId of apiIdsDirectos) {
    await actualizarEstadoOrdenCocina(apiId, { estado: "Completada" })
  }
}

const estadoInicialSeed = crearEstadoInicialCicloBandejas(
  crearOrdenesIniciales(),
  crearEtiquetasEnfermeraIniciales(),
)

function resolverEstadoInicialCicloBandejas(): {
  ordenes: OrdenCocina[]
  etiquetas: EtiquetaEnfermera[]
  hidrato: boolean
} {
  if (usarApiDietasCocina()) {
    const persistidoSync = cargarCicloBandejas()
    if (persistidoSync && !estaOnlineAhora()) {
      const sync = sincronizarSeedsCocinaEtiquetas(
        persistidoSync.ordenes,
        persistidoSync.etiquetas,
      )
      return { ...sync, hidrato: true }
    }
    return { ordenes: [], etiquetas: [], hidrato: false }
  }

  const persistidoSync = cargarCicloBandejas()
  if (persistidoSync) {
    const sync = sincronizarSeedsCocinaEtiquetas(
      persistidoSync.ordenes,
      persistidoSync.etiquetas,
    )
    return { ...sync, hidrato: true }
  }

  return { ...estadoInicialSeed, hidrato: false }
}

export function CicloBandejasProvider({ children }: { children: ReactNode }) {
  const apiActiva = usarApiDietasCocina()
  const repository = useMemo(() => resolverCicloBandejasRepository(), [])
  const etiquetasRepository = useMemo(() => resolverEtiquetasRepository(), [])
  const [ordenes, setOrdenes] = useState<OrdenCocina[]>(
    () => resolverEstadoInicialCicloBandejas().ordenes,
  )
  const [etiquetas, setEtiquetas] = useState<EtiquetaEnfermera[]>(
    () => resolverEstadoInicialCicloBandejas().etiquetas,
  )
  const [hidrato, setHidrato] = useState(
    () => resolverEstadoInicialCicloBandejas().hidrato,
  )
  const [estaOnline, setEstaOnline] = useState(estaOnlineAhora)
  const [cantidadPendientesSync, setCantidadPendientesSync] = useState(
    contarOperacionesPendientes,
  )
  const [cantidadConflictosSync, setCantidadConflictosSync] = useState(
    contarOperacionesConConflicto,
  )
  const [sincronizandoBandejas, setSincronizandoBandejas] = useState(false)
  const etiquetasRef = useRef(etiquetas)
  etiquetasRef.current = etiquetas
  const ordenesRef = useRef(ordenes)
  ordenesRef.current = ordenes
  const generandoEtiquetasRef = useRef(false)
  const estaOnlineRef = useRef(estaOnline)
  estaOnlineRef.current = estaOnline
  const sincronizandoRef = useRef(false)
  /** Órdenes con PATCH de checklist en vuelo: el poll/GET no pisa el estado local. */
  const checklistPendienteRef = useRef(new Map<string, number>())

  useEffect(() => {
    return suscribirConectividadRed(setEstaOnline)
  }, [])

  useEffect(() => {
    return suscribirOutboxBandejas(() => {
      setCantidadPendientesSync(contarOperacionesPendientes())
      setCantidadConflictosSync(contarOperacionesConConflicto())
    })
  }, [])

  useEffect(() => {
    if (apiActiva) {
      migrarOverridesCocinaLegacy()
    }
  }, [apiActiva])

  const syncOrdenesFromEtiquetas = useCallback(
    (prevOrdenes: OrdenCocina[], nextEtiquetas: EtiquetaEnfermera[]) => {
      return prevOrdenes.map((orden) => {
        const etq = resolverEtiquetaParaOrden(orden, nextEtiquetas)
        if (etq) return sincronizarOrdenConEtiqueta(orden, etq)

        // Fallback estable: no perder etiqueta recién generada por filtro de día/match estricto.
        const etqFallback =
          nextEtiquetas.find((e) => e.id === orden.etiquetaId) ??
          nextEtiquetas.find((e) => e.filaDietaId === orden.id) ??
          (orden.ordenCocinaApiId
            ? nextEtiquetas.find(
                (e) => e.ordenCocinaId === orden.ordenCocinaApiId,
              )
            : undefined)
        if (etqFallback) return sincronizarOrdenConEtiqueta(orden, etqFallback)

        if (orden.estadoLogistica || orden.etiquetaId) {
          return {
            ...orden,
            estadoLogistica: undefined,
            etiquetaImpresa: false,
            etiquetaGenerada: false,
            etiquetaId: undefined,
          }
        }
        return orden
      })
    },
    [],
  )

  const recargarEtiquetas = useCallback(async () => {
    const lista = deduplicarEtiquetasPorFila(await etiquetasRepository.listar())
    const enriquecidas = enriquecerEtiquetasConOrdenes(lista, ordenesRef.current)
    etiquetasRef.current = enriquecidas
    setEtiquetas(enriquecidas)
    setOrdenes((prev) => syncOrdenesFromEtiquetas(prev, enriquecidas))
    return enriquecidas
  }, [syncOrdenesFromEtiquetas, etiquetasRepository])

  const recargarDesdeApi = useCallback(async () => {
    const persistido = await repository.cargar()
    if (!persistido) return
    const etiquetasDedup = deduplicarEtiquetasPorFila(persistido.etiquetas)
    setOrdenes((prev) => {
      const fusionadas = fusionarOrdenesCocina(prev, persistido.ordenes)
      return syncOrdenesFromEtiquetas(fusionadas, etiquetasDedup)
    })
    setEtiquetas((prev) => {
      const map = new Map(prev.map((etiqueta) => [etiqueta.id, etiqueta]))
      for (const etiqueta of etiquetasDedup) {
        map.set(etiqueta.id, etiqueta)
      }
      const dedup = deduplicarEtiquetasPorFila(Array.from(map.values()))
      return enriquecerEtiquetasConOrdenes(
        dedup,
        fusionarOrdenesCocina(ordenesRef.current, persistido.ordenes),
      )
    })
  }, [repository, syncOrdenesFromEtiquetas])

  const sincronizarOrdenesDesdeFilas = useCallback((filas: FilaDieta[]) => {
    if (!apiActiva) return
    setOrdenes((prev) => {
      const mapped = mapFilasDietasToOrdenesCocina(filas, etiquetasRef.current)
      const merged = fusionarOrdenesCocina(prev, mapped)
      return filtrarOrdenesVinculadasAFilas(merged, filas)
    })
  }, [apiActiva])

  useEffect(() => {
    if (!apiActiva || !hidrato) return
    setEtiquetas((prev) => {
      const enriquecidas = enriquecerEtiquetasConOrdenes(prev, ordenes)
      const prevById = new Map(prev.map((etiqueta) => [etiqueta.id, etiqueta]))
      const cambio = enriquecidas.some((etiqueta) => {
        const anterior = prevById.get(etiqueta.id)
        return (
          !anterior ||
          etiqueta.aislamiento !== anterior.aislamiento ||
          etiqueta.observaciones !== anterior.observaciones
        )
      })
      return cambio ? enriquecidas : prev
    })
  }, [ordenes, apiActiva, hidrato])

  useEffect(() => {
    if (hidrato) return
    if (apiActiva) {
      void recargarDesdeApi().finally(() => setHidrato(true))
      return
    }
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
  }, [hidrato, apiActiva, recargarDesdeApi, repository])

  useEffect(() => {
    if (!hidrato) return
    guardarCicloBandejas({ ordenes, etiquetas })
    if (!apiActiva) {
      void repository.guardar({ ordenes, etiquetas })
    }
  }, [ordenes, etiquetas, hidrato, apiActiva, repository])

  const buscarPorCodigo = useCallback(
    (codigo: string) => repository.buscarEtiquetaPorCodigo(etiquetas, codigo),
    [etiquetas, repository],
  )

  const buscarPorCodigoAsync = useCallback(
    async (codigo: string): Promise<EtiquetaEnfermera | undefined> => {
      const buscarLocal = () =>
        repository.buscarEtiquetaPorCodigo(etiquetasRef.current, codigo)

      if (apiActiva && !estaOnlineRef.current) {
        return buscarLocal()
      }

      if (apiActiva) {
        try {
          const etq = await etiquetasRepository.buscarPorCodigo(codigo)
          setEtiquetas((prev) => {
            const existe = prev.some((e) => e.id === etq.id)
            return existe
              ? prev.map((e) => (e.id === etq.id ? etq : e))
              : [...prev, etq]
          })
          return etq
        } catch (error) {
          if (esErrorRed(error)) {
            return buscarLocal()
          }
          return undefined
        }
      }
      return buscarLocal()
    },
    [apiActiva, etiquetasRepository, repository],
  )

  const getEtiquetaByOrdenId = useCallback(
    (ordenId: string) => {
      const orden = ordenes.find((o) => o.id === ordenId)
      if (!orden) return undefined
      return resolverEtiquetaParaOrden(orden, etiquetas)
    },
    [ordenes, etiquetas],
  )

  const getOrdenByEtiquetaId = useCallback(
    (etiquetaId: string) => {
      const porEtiquetaId = ordenes.find((o) => o.etiquetaId === etiquetaId)
      if (porEtiquetaId) return porEtiquetaId
      const etiqueta = etiquetas.find((e) => e.id === etiquetaId)
      if (etiqueta?.filaDietaId) {
        return ordenes.find((o) => o.id === etiqueta.filaDietaId)
      }
      return undefined
    },
    [ordenes, etiquetas],
  )

  const marcarEnPreparacion = useCallback(
    (ids: string[]) => {
      const idsValidos = ids.filter((id) => {
        const orden = ordenesRef.current.find((item) => item.id === id)
        return (
          orden &&
          (orden.estadoCocina === "por_iniciar" ||
            orden.estadoCocina === "en_preparacion")
        )
      })
      if (idsValidos.length === 0) return

      setOrdenes((prev) =>
        prev.map((o) =>
          idsValidos.includes(o.id) &&
          (o.estadoCocina === "por_iniciar" || o.estadoCocina === "en_preparacion")
            ? { ...o, estadoCocina: "en_preparacion" }
            : o,
        ),
      )

      if (!apiActiva) return

      const seleccionadas = ordenesRef.current.filter((orden) =>
        idsValidos.includes(orden.id),
      )
      const pendientesApi = seleccionadas.filter((orden) => !orden.ordenCocinaApiId)
      const comidasAfectadas = new Set(seleccionadas.map((orden) => orden.comida))

      for (const comida of comidasAfectadas) {
        if (pendientesApi.length === 0) {
          solicitarRefreshCenso(comida)
        }
      }

      if (pendientesApi.length === 0) return

      const referencia = pendientesApi[0]
      void vincularOrdenesCocinaEnApi(pendientesApi)
        .then((vinculos) => {
          setOrdenes((prev) => aplicarVinculoOrdenesEnApi(prev, vinculos))
          ordenesRef.current = aplicarVinculoOrdenesEnApi(
            ordenesRef.current,
            vinculos,
          )
          solicitarRefreshCenso(referencia.comida)
        })
        .catch((error) => {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo registrar la preparación en cocina.",
            "error",
          )
        })
    },
    [apiActiva],
  )

  const marcarComoLista = useCallback(
    (ids: string[]) => {
      const idsValidos = ids.filter((id) => {
        const orden = ordenesRef.current.find((item) => item.id === id)
        return orden && puedeMarcarLista(orden)
      })
      if (idsValidos.length === 0) return

      setOrdenes((prev) =>
        prev.map((o) =>
          idsValidos.includes(o.id) && puedeMarcarLista(o)
            ? { ...o, estadoCocina: "lista" }
            : o,
        ),
      )

      if (!apiActiva) return

      const ordenesApiIds = [
        ...new Set(
          idsValidos
            .map((id) => {
              const orden = ordenesRef.current.find((item) => item.id === id)
              return orden?.ordenCocinaApiId ?? cargarOrdenCocinaApiId(id)
            })
            .filter((id): id is string => Boolean(id)),
        ),
      ]

      if (ordenesApiIds.length === 0) {
        const pendientesApi = idsValidos
          .map((id) => ordenesRef.current.find((orden) => orden.id === id))
          .filter((orden): orden is OrdenCocina => Boolean(orden))

        if (pendientesApi.length === 0) return

        void vincularOrdenesCocinaEnApi(pendientesApi)
          .then((vinculos) => {
            setOrdenes((prev) => aplicarVinculoOrdenesEnApi(prev, vinculos))
            ordenesRef.current = aplicarVinculoOrdenesEnApi(
              ordenesRef.current,
              vinculos,
            )
            const ordenesVinculadas = pendientesApi.map((orden) => {
              const vinculo = vinculos.find((item) => item.ordenId === orden.id)
              if (!vinculo) return orden
              return {
                ...orden,
                ordenCocinaApiId: vinculo.ordenApiId,
                checklist: checklistMasCompleto(orden.checklist, vinculo.checklist),
                estadoCocina: "lista" as const,
              }
            })
            return completarOrdenesCocinaEnApi(ordenesVinculadas)
          })
          .then(() => {
            const primera = ordenesRef.current.find((orden) =>
              idsValidos.includes(orden.id),
            )
            if (primera) solicitarRefreshCenso(primera.comida)
          })
          .catch((error) => {
            setOrdenes((prev) =>
              prev.map((orden) =>
                idsValidos.includes(orden.id)
                  ? { ...orden, estadoCocina: "en_preparacion" as const }
                  : orden,
              ),
            )
            void recargarDesdeApi()
            demoToast(
              error instanceof Error
                ? error.message
                : "No se pudo marcar la bandeja como lista.",
              "error",
            )
          })
        return
      }

      void completarOrdenesCocinaEnApi(
        ordenesRef.current.filter((orden) => idsValidos.includes(orden.id)),
      )
        .then(() => {
          const primera = ordenesRef.current.find((orden) => idsValidos.includes(orden.id))
          if (primera) solicitarRefreshCenso(primera.comida)
        })
        .catch((error) => {
          setOrdenes((prev) =>
            prev.map((orden) =>
              idsValidos.includes(orden.id)
                ? { ...orden, estadoCocina: "en_preparacion" as const }
                : orden,
            ),
          )
          void recargarDesdeApi()
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo marcar la bandeja como lista.",
            "error",
          )
        })
    },
    [apiActiva, recargarDesdeApi],
  )

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

      if (apiActiva) {
        const ordenesApiIds = [
          ...new Set(
            ordenes
              .filter((o) => idsDespachables.includes(o.id))
              .map((o) => o.ordenCocinaApiId ?? cargarOrdenCocinaApiId(o.id))
              .filter((id): id is string => Boolean(id)),
          ),
        ]

        if (ordenesApiIds.length === 0) {
          demoToast("No se encontró la orden de cocina asociada para despachar.", "error")
          return
        }

        void Promise.all(
          ordenesApiIds.map((ordenApiId) =>
            actualizarEstadoOrdenCocina(ordenApiId, { estado: "Despachada" }),
          ),
        )
          .then(() => {
            setOrdenes((prev) =>
              prev.map((o) =>
                idsDespachables.includes(o.id)
                  ? { ...o, estadoCocina: "despachada" as const }
                  : o,
              ),
            )
            const primera = ordenesRef.current.find((orden) =>
              idsDespachables.includes(orden.id),
            )
            if (primera) solicitarRefreshCenso(primera.comida)
            demoToast("Despacho registrado correctamente.", "success")
          })
          .catch((error) => {
            void recargarDesdeApi()
            demoToast(
              error instanceof Error ? error.message : "No se pudo registrar el despacho.",
              "error",
            )
          })
        return
      }

      setOrdenes((prev) =>
        prev.map((o) =>
          idsDespachables.includes(o.id)
            ? { ...o, estadoCocina: "despachada" as const }
            : o,
        ),
      )
    },
    [ordenes, etiquetas, apiActiva, recargarDesdeApi],
  )

  const generarEtiquetas = useCallback(
    async (ordenIds: string[]): Promise<string[]> => {
      if (generandoEtiquetasRef.current) {
        throw new Error("Ya hay una generación de etiquetas en curso.")
      }

      generandoEtiquetasRef.current = true
      try {
      if (apiActiva) {
        const etiquetasCargadas = await recargarEtiquetas()

        const targetOrdenes = ordenesRef.current.filter(
          (orden) =>
            ordenIds.includes(orden.id) && orden.estadoCocina === "lista",
        )

        if (targetOrdenes.length === 0) {
          throw new Error(
            "Marca las bandejas como listas antes de generar etiquetas.",
          )
        }

        const pendientes = targetOrdenes.filter(
          (orden) =>
            !orden.etiquetaGenerada &&
            !resolverEtiquetaParaOrden(orden, etiquetasCargadas) &&
            !etiquetasCargadas.some(
              (e) =>
                e.filaDietaId === orden.id ||
                (orden.ordenCocinaApiId &&
                  e.ordenCocinaId === orden.ordenCocinaApiId),
            ),
        )

        const yaEnApi = targetOrdenes.filter((orden) => !pendientes.includes(orden))

        if (pendientes.length === 0) {
          setOrdenes((prev) =>
            syncOrdenesFromEtiquetas(prev, etiquetasCargadas),
          )
          return idsEtiquetasParaOrdenes(targetOrdenes, etiquetasCargadas)
        }

        const sinChecklist = pendientes.filter(
          (orden) => !checklistObligatorioCompleto(orden),
        )
        if (sinChecklist.length > 0) {
          throw new Error(
            motivoNoGenerarEtiqueta(sinChecklist[0]) ??
              "Complete el checklist obligatorio antes de generar etiquetas.",
          )
        }

        const vinculos = await vincularOrdenesCocinaEnApi(pendientes)
        setOrdenes((prev) => aplicarVinculoOrdenesEnApi(prev, vinculos))
        ordenesRef.current = aplicarVinculoOrdenesEnApi(ordenesRef.current, vinculos)

        const pendientesVinculados = pendientes.flatMap<OrdenCocina>((orden) => {
          const vinculo = vinculos.find((item) => item.ordenId === orden.id)
          if (!vinculo) return []
          return [
            {
              ...orden,
              ordenCocinaApiId: vinculo.ordenApiId,
              checklist: checklistMasCompleto(orden.checklist, vinculo.checklist),
            },
          ]
        })

        if (pendientesVinculados.length === 0) {
          throw new Error(
            "No se pudo vincular ninguna bandeja con cocina en el servidor.",
          )
        }

        const { completadas, fallidas } = await completarOrdenesCocinaEnApi(
          pendientesVinculados,
        )

        const apiIdsParaGenerar =
          completadas.length > 0
            ? completadas
            : [
                ...new Set(
                  pendientesVinculados
                    .map((o) => o.ordenCocinaApiId)
                    .filter((id): id is string => Boolean(id)),
                ),
              ]

        if (apiIdsParaGenerar.length === 0) {
          throw new Error(
            fallidas[0] ??
              "No se pudo completar ninguna orden de cocina para generar etiquetas.",
          )
        }

        const nuevas = deduplicarEtiquetasPorFila(
          await etiquetasRepository.generar({ ordenIds: apiIdsParaGenerar }),
        )
        let etiquetasActualizadas = deduplicarEtiquetasPorFila([
          ...etiquetasRef.current,
          ...nuevas,
        ])
        etiquetasRef.current = etiquetasActualizadas
        setEtiquetas(etiquetasActualizadas)
        setOrdenes((prev) =>
          syncOrdenesFromEtiquetas(
            vincularEtiquetasGeneradas(prev, etiquetasActualizadas),
            etiquetasActualizadas,
          ),
        )

        // Segunda pasada: órdenes completadas que aún no tienen etiqueta.
        const sinEtiquetaTrasGenerar = pendientesVinculados.filter((orden) => {
          const apiId = orden.ordenCocinaApiId
          if (!apiId || !completadas.includes(apiId)) return false
          return !etiquetasActualizadas.some(
            (e) =>
              e.filaDietaId === orden.id ||
              e.ordenCocinaId === apiId ||
              e.id === orden.etiquetaId,
          )
        })

        if (sinEtiquetaTrasGenerar.length > 0) {
          const retryIds = [
            ...new Set(
              sinEtiquetaTrasGenerar
                .map((o) => o.ordenCocinaApiId)
                .filter((id): id is string => Boolean(id)),
            ),
          ]
          try {
            const reintento = deduplicarEtiquetasPorFila(
              await etiquetasRepository.generar({ ordenIds: retryIds }),
            )
            etiquetasActualizadas = deduplicarEtiquetasPorFila([
              ...etiquetasActualizadas,
              ...reintento,
            ])
            etiquetasRef.current = etiquetasActualizadas
            setEtiquetas(etiquetasActualizadas)
            setOrdenes((prev) =>
              syncOrdenesFromEtiquetas(
                vincularEtiquetasGeneradas(prev, etiquetasActualizadas),
                etiquetasActualizadas,
              ),
            )
          } catch {
            // Se valida cobertura abajo.
          }
        }

        const etiquetasFinales = await recargarEtiquetas()
        const ordenesObjetivo = [
          ...new Map(
            [...targetOrdenes, ...yaEnApi, ...pendientesVinculados].map(
              (orden) => [orden.id, orden],
            ),
          ).values(),
        ]
        const ids = idsEtiquetasParaOrdenes(ordenesObjetivo, etiquetasFinales)

        if (ids.length === 0) {
          throw new Error(
            fallidas[0] ??
              "No se generaron etiquetas para las bandejas seleccionadas.",
          )
        }

        // Adjunta metadatos en el error solo si faltan; si hay ids, se retornan
        // y la UI informa cobertura incompleta.
        if (ids.length < ordenesObjetivo.length) {
          const faltan = ordenesObjetivo.length - ids.length
          const detalle = fallidas[0] ? ` ${fallidas[0]}` : ""
          const error = new Error(
            `Se generaron ${ids.length} de ${ordenesObjetivo.length} etiquetas. Faltan ${faltan}.${detalle}`,
          ) as Error & { etiquetaIdsParciales?: string[] }
          error.etiquetaIdsParciales = ids
          throw error
        }

        return ids
      }

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
            estadoLogistica: "generada" as const,
          }
        }),
      )

      return nuevosIds
      } finally {
        generandoEtiquetasRef.current = false
      }
    },
    [ordenes, apiActiva, recargarEtiquetas, syncOrdenesFromEtiquetas, etiquetasRepository],
  )

  const marcarEtiquetasImpresas = useCallback((etiquetaIds: string[]) => {
    if (apiActiva) {
      void etiquetasRepository.marcarImpresas(etiquetaIds).then(() => recargarEtiquetas())
      return
    }
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
  }, [syncOrdenesFromEtiquetas, apiActiva, recargarEtiquetas])

  const reimprimirEtiquetas = useCallback((etiquetaIds: string[]) => {
    if (apiActiva) {
      void etiquetasRepository.marcarReimpresas(etiquetaIds).then(() => recargarEtiquetas())
      return
    }
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
  }, [syncOrdenesFromEtiquetas, apiActiva, recargarEtiquetas])

  const crearOrdenDesdeDieta = useCallback((input: CrearOrdenDesdeDietaInput) => {
    const actualizarOrden = (orden: OrdenCocina): OrdenCocina => ({
      ...orden,
      paciente: input.paciente,
      edad: input.edad,
      pabellon: input.pabellon,
      habitacion: input.habitacion,
      cama: input.cama ?? orden.cama,
      tipoDieta: input.tipoDieta,
      consistencia: input.consistencia,
      comida: input.comida,
      aislado: input.aislado ?? orden.aislado,
      alergias: input.alergias ?? orden.alergias,
      observaciones: input.observaciones ?? orden.observaciones,
      ordenCocinaApiId: input.ordenCocinaApiId ?? orden.ordenCocinaApiId,
      estadoCocina:
        orden.estadoCocina === "cancelada" ? orden.estadoCocina : "en_preparacion",
    })

    if (input.id) {
      const porId = ordenesRef.current.find((o) => o.id === input.id)
      if (porId) {
        setOrdenes((prev) =>
          prev.map((orden) => (orden.id === porId.id ? actualizarOrden(orden) : orden)),
        )
        return porId.id
      }
    }

    const existente = ordenesRef.current.find(
      (o) =>
        o.pacienteId === input.pacienteId &&
        o.comida === input.comida &&
        o.estadoCocina !== "cancelada",
    )
    if (existente) {
      setOrdenes((prev) =>
        prev.map((orden) =>
          orden.id === existente.id ? actualizarOrden(orden) : orden,
        ),
      )
      return existente.id
    }

    const id = input.id ?? `ord-diet-${Date.now()}`
    const nuevaOrden: OrdenCocina = {
      id,
      ordenCocinaApiId: input.ordenCocinaApiId,
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
      estadoCocina: "en_preparacion",
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
  }, [])

  const cancelarOrdenCocina = useCallback(
    async (ordenId: string, motivo = "Cancelada desde dietas-cocina"): Promise<boolean> => {
      const orden = ordenesRef.current.find(
        (item) => item.id === ordenId || item.ordenCocinaApiId === ordenId,
      )
      if (!orden || !puedeCancelarOrdenCocina(orden)) return false

      const ordenApiId = orden.ordenCocinaApiId ?? ordenId

      if (apiActiva && orden.ordenCocinaApiId) {
        try {
          await cancelarOrdenCocinaApi(ordenApiId, motivo)
          solicitarRefreshCenso(orden.comida)
        } catch (error) {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo cancelar la orden de cocina.",
            "error",
          )
          return false
        }
      }

      setOrdenes((prev) =>
        prev.map((item) =>
          item.id === orden.id ? { ...item, estadoCocina: "cancelada" as const } : item,
        ),
      )
      return true
    },
    [apiActiva],
  )

  const aplicarPreEntregaLocal = useCallback(
    (ids: string[], recibidoPor?: string) => {
      const hora = formatearHoraActual()
      const mapOrdenes = new Map(
        ordenesRef.current
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
    [syncOrdenesFromEtiquetas],
  )

  const aplicarEntregaLocal = useCallback(
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

  const aplicarDevolucionLocal = useCallback(
    (id: string, input: ConfirmarDevolucionInput) => {
      const hora = formatearHoraActual()
      setEtiquetas((prev) => {
        const next = prev.map((e) =>
          e.id === id && puedeConfirmarDevolucion(e)
            ? {
                ...e,
                estadoLogistica: "devuelta" as const,
                horaDevolucion: hora,
                motivoDevolucion: input.motivo as EtiquetaEnfermera["motivoDevolucion"],
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

  const encolarPreEntregaOffline = useCallback(
    (ids: string[], recibidoPor?: string) => {
      for (const id of ids) {
        encolarOperacionBandeja({
          tipo: "pre_entrega",
          etiquetaId: id,
          recibidoPor,
          clientId: crearClientIdBandeja(),
          creadoEn: new Date().toISOString(),
        })
      }
      setCantidadPendientesSync(contarOperacionesPendientes())
    },
    [],
  )

  const encolarEntregaOffline = useCallback((id: string) => {
    encolarOperacionBandeja({
      tipo: "entrega",
      etiquetaId: id,
      clientId: crearClientIdBandeja(),
      creadoEn: new Date().toISOString(),
    })
    setCantidadPendientesSync(contarOperacionesPendientes())
  }, [])

  const encolarDevolucionOffline = useCallback(
    async (id: string, input: ConfirmarDevolucionInput) => {
      const clientId = crearClientIdBandeja()
      let fotoRefId: string | undefined
      if (input.fotoArchivo) {
        fotoRefId = clientId
        await guardarFotoDevolucionOffline(clientId, input.fotoArchivo)
      }
      encolarOperacionBandeja({
        tipo: "devolucion",
        etiquetaId: id,
        payload: {
          motivo: input.motivo,
          observaciones: input.observaciones,
          estadoDieta: input.estadoDieta,
          tipoDevolucion: input.tipoDevolucion,
        },
        fotoRefId,
        clientId,
        creadoEn: new Date().toISOString(),
        estadoSync: "pendiente",
      })
      setCantidadPendientesSync(contarOperacionesPendientes())
    },
    [],
  )

  const descartarConflictoSync = useCallback(async (clientId: string) => {
    const operacion = listarOperacionesPendientes().find(
      (op) => op.clientId === clientId,
    )
    if (operacion) {
      await limpiarAdjuntosOperacion(operacion)
    }
    descartarOperacionBandeja(clientId)
    setCantidadPendientesSync(contarOperacionesPendientes())
    setCantidadConflictosSync(contarOperacionesConConflicto())
  }, [])

  const sincronizarBandejasPendientes = useCallback(async () => {
    if (!apiActiva || !estaOnlineRef.current || sincronizandoRef.current) return
    if (contarOperacionesPendientes() === 0) return

    sincronizandoRef.current = true
    setSincronizandoBandejas(true)
    try {
      const resultado = await sincronizarOutboxBandejas({
        ordenes: ordenesRef.current,
        etiquetas: etiquetasRef.current,
      })
      setCantidadPendientesSync(contarOperacionesPendientes())
      setCantidadConflictosSync(contarOperacionesConConflicto())
      if (resultado.sincronizadas > 0) {
        await recargarEtiquetas()
      }
      if (resultado.conflictos > 0) {
        demoToast(
          `${resultado.conflictos} registro(s) tienen conflicto con el servidor. Revíselos en la lista de pendientes.`,
          "warning",
        )
      }
      if (resultado.fallidas > 0) {
        demoToast(
          `${resultado.fallidas} registro(s) no se pudieron sincronizar. Revise la conexión e intente de nuevo.`,
          "warning",
        )
      }
    } finally {
      sincronizandoRef.current = false
      setSincronizandoBandejas(false)
    }
  }, [apiActiva, recargarEtiquetas])

  const reintentarConflictoSync = useCallback(
    (clientId: string) => {
      reintentarOperacionBandeja(clientId)
      setCantidadPendientesSync(contarOperacionesPendientes())
      setCantidadConflictosSync(contarOperacionesConConflicto())
      void sincronizarBandejasPendientes()
    },
    [sincronizarBandejasPendientes],
  )

  const confirmarPreEntrega = useCallback(
    async (ids: string[], recibidoPor?: string): Promise<void> => {
      const debeUsarOffline = !apiActiva || !estaOnlineRef.current

      if (apiActiva && estaOnlineRef.current) {
        try {
          await completarOrdenesPorEtiquetaIdsEnApi(
            ids,
            ordenesRef.current,
            etiquetasRef.current,
          )
          await Promise.all(
            ids.map((id) =>
              etiquetasRepository.confirmarPreEntrega(id, recibidoPor),
            ),
          )
          await recargarEtiquetas()
          return
        } catch (error) {
          if (!esErrorRed(error)) {
            demoToast(
              error instanceof Error
                ? error.message
                : "No se pudo confirmar la recepción.",
              "error",
            )
            throw error
          }
        }
      }

      if (debeUsarOffline || apiActiva) {
        aplicarPreEntregaLocal(ids, recibidoPor)
        if (apiActiva) {
          encolarPreEntregaOffline(ids, recibidoPor)
        }
        return
      }

      aplicarPreEntregaLocal(ids, recibidoPor)
    },
    [
      apiActiva,
      aplicarPreEntregaLocal,
      encolarPreEntregaOffline,
      recargarEtiquetas,
      etiquetasRepository,
    ],
  )

  const confirmarEntrega = useCallback(
    (id: string) => {
      if (apiActiva && estaOnlineRef.current) {
        aplicarEntregaLocal(id)
        void etiquetasRepository
          .confirmarEntrega(id)
          .then(() => recargarEtiquetas())
          .catch((error) => {
            if (esErrorRed(error)) {
              encolarEntregaOffline(id)
              return
            }
            void recargarEtiquetas()
            demoToast(
              error instanceof Error
                ? error.message
                : "No se pudo confirmar la entrega.",
              "error",
            )
          })
        return
      }

      aplicarEntregaLocal(id)
      if (apiActiva) {
        encolarEntregaOffline(id)
      }
    },
    [
      apiActiva,
      aplicarEntregaLocal,
      encolarEntregaOffline,
      recargarEtiquetas,
      etiquetasRepository,
    ],
  )

  const confirmarDevolucion = useCallback(
    async (id: string, input: ConfirmarDevolucionInput): Promise<void> => {
      if (apiActiva && estaOnlineRef.current) {
        try {
          await etiquetasRepository.registrarDevolucion(id, {
            motivo: input.motivo,
            estadoDieta: input.estadoDieta ?? "Devuelta",
            observaciones: input.observaciones,
          })
          if (input.fotoArchivo) {
            await etiquetasRepository.subirFotoDevolucion(id, input.fotoArchivo)
          }
          await recargarEtiquetas()
          return
        } catch (error) {
          if (!esErrorRed(error)) {
            demoToast(
              error instanceof Error
                ? error.message
                : "No se pudo registrar la devolución.",
              "error",
            )
            throw error
          }
        }
      }

      aplicarDevolucionLocal(id, input)
      if (apiActiva) {
        await encolarDevolucionOffline(id, input)
      }
    },
    [
      apiActiva,
      aplicarDevolucionLocal,
      encolarDevolucionOffline,
      recargarEtiquetas,
      etiquetasRepository,
    ],
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
          const checklist = o.checklist.map((c) =>
            c.id === checklistId ? { ...c, completado } : c,
          )
          guardarChecklistOrden(ordenId, checklist)
          const estadoCocina =
            o.estadoCocina === "por_iniciar" ? ("en_preparacion" as const) : o.estadoCocina

          if (apiActiva) {
            const ordenApiId = o.ordenCocinaApiId ?? cargarOrdenCocinaApiId(o.id)
            if (!ordenApiId) {
              demoToast(
                "Checklist guardado localmente. Al marcar como lista se registrará en cocina.",
                "warning",
              )
              return { ...o, checklist, estadoCocina }
            }

            const pendientes = checklistPendienteRef.current
            pendientes.set(ordenId, (pendientes.get(ordenId) ?? 0) + 1)

            void actualizarChecklistOrdenCocina(ordenApiId, {
              items: checklist.map((item) => ({
                id: item.id,
                completado: item.completado,
              })),
            })
              .then((ordenApi) => {
                const checklistApi = mapChecklistFromApi(ordenApi.checklist)
                // Conservar ticks locales marcados mientras el PATCH viajaba.
                setOrdenes((current) =>
                  current.map((orden) => {
                    if (orden.id !== ordenId) return orden
                    const merged = checklistMasCompleto(orden.checklist, checklistApi)
                    guardarChecklistOrden(ordenId, merged)
                    return {
                      ...orden,
                      checklist: merged,
                      ordenCocinaApiId: ordenApiId,
                    }
                  }),
                )
              })
              .catch((error) => {
                demoToast(
                  error instanceof Error
                    ? error.message
                    : "No se pudo guardar el checklist.",
                  "error",
                )
              })
              .finally(() => {
                const n = (pendientes.get(ordenId) ?? 1) - 1
                if (n <= 0) pendientes.delete(ordenId)
                else pendientes.set(ordenId, n)
              })
          }

          return { ...o, checklist, estadoCocina }
        }),
      )
    },
    [apiActiva],
  )

  const sincronizarChecklistOrden = useCallback(
    (ordenId: string, checklistRemoto: OrdenCocina["checklist"]) => {
      // No pisar mientras el usuario tiene mutaciones en vuelo.
      if ((checklistPendienteRef.current.get(ordenId) ?? 0) > 0) return

      setOrdenes((prev) =>
        prev.map((orden) => {
          if (orden.id !== ordenId) return orden
          const checklist = checklistMasCompleto(orden.checklist, checklistRemoto)
          guardarChecklistOrden(ordenId, checklist)
          return { ...orden, checklist }
        }),
      )
    },
    [],
  )

  const rehidratarDesdeStorage = useCallback(() => {
    if (apiActiva) {
      void recargarDesdeApi()
      return
    }
    const persistido = cargarCicloBandejas()
    if (!persistido) return
    const sync = sincronizarSeedsCocinaEtiquetas(
      persistido.ordenes,
      persistido.etiquetas,
    )
    setOrdenes(sync.ordenes)
    setEtiquetas(sync.etiquetas)
  }, [apiActiva, recargarDesdeApi])

  const value = useMemo(
    () => ({
      ordenes,
      etiquetas,
      buscarPorCodigo,
      buscarPorCodigoAsync,
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
      sincronizarChecklistOrden,
      rehidratarDesdeStorage,
      sincronizarOrdenesDesdeFilas,
      hidrato,
      estaOnline,
      cantidadPendientesSync,
      cantidadConflictosSync,
      sincronizandoBandejas,
      sincronizarBandejasPendientes,
      descartarConflictoSync,
      reintentarConflictoSync,
    }),
    [
      ordenes,
      etiquetas,
      buscarPorCodigo,
      buscarPorCodigoAsync,
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
      sincronizarChecklistOrden,
      rehidratarDesdeStorage,
      sincronizarOrdenesDesdeFilas,
      hidrato,
      estaOnline,
      cantidadPendientesSync,
      cantidadConflictosSync,
      sincronizandoBandejas,
      sincronizarBandejasPendientes,
      descartarConflictoSync,
      reintentarConflictoSync,
    ],
  )

  return (
    <CicloBandejasContext.Provider value={value}>
      {children}
    </CicloBandejasContext.Provider>
  )
}

export {
  useCicloBandejas,
  useCicloBandejasOpcional,
  type CicloBandejasContextValue,
} from "@/modules/dietas-cocina/context/cicloBandejasContextStore"
