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
  mapFilasDietasToOrdenesCocina,
} from "@/modules/dietas-cocina/api/mappers/ordenCocina.mapper"
import { deduplicarEtiquetasPorFila } from "@/modules/dietas-cocina/api/mappers/etiqueta.mapper"
import { enriquecerEtiquetasConOrdenes } from "@/modules/dietas-cocina/etiquetas/lib/enriquecerEtiquetasConOrdenes"
import {
  actualizarEstadoOrdenCocina,
  actualizarChecklistOrdenCocina,
  cancelarOrdenCocinaApi,
  crearOrdenCocina,
} from "@/modules/dietas-cocina/api/services/ordenes-cocina-api.service"
import { fechaOperativaHoy, mapearComidaApi } from "@/modules/dietas-cocina/api/utils"
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
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"
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
  guardarOrdenCocinaApiId,
  cargarOrdenCocinaApiId,
  migrarOverridesCocinaLegacy,
} from "@/modules/dietas-cocina/lib/cocinaOverridesStorage"
import { solicitarRefreshCenso } from "@/modules/dietas-cocina/lib/cocinaSyncBus"
import { demoToast } from "@/modules/dietas-cocina/lib/demoFeedback"
import { cargarCicloBandejas, guardarCicloBandejas } from "@/modules/dietas-cocina/lib/cicloBandejasStorage"

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
    const etiqueta = resolverEtiquetaParaOrden(orden, etiquetas)
    if (etiqueta) ids.push(etiqueta.id)
  }
  return ids
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
): Promise<void> {
  const porApiId = new Map<string, OrdenCocina>()
  for (const orden of ordenes) {
    const apiId = orden.ordenCocinaApiId ?? cargarOrdenCocinaApiId(orden.id)
    if (!apiId) continue
    const ordenSync = opciones?.forzarChecklistObligatorio
      ? ordenConChecklistObligatorioForzado(orden)
      : orden
    porApiId.set(apiId, ordenSync)
  }

  for (const [apiId, orden] of porApiId) {
    if (orden.checklist.length > 0) {
      await actualizarChecklistOrdenCocina(apiId, {
        items: orden.checklist.map((item) => ({
          id: item.id,
          completado: item.completado,
        })),
      })
    }
    await actualizarEstadoOrdenCocina(apiId, { estado: "Completada" })
  }
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
  const etiquetasRef = useRef(etiquetas)
  etiquetasRef.current = etiquetas
  const ordenesRef = useRef(ordenes)
  ordenesRef.current = ordenes
  const generandoEtiquetasRef = useRef(false)

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
    if (!hidrato || apiActiva) return
    void repository.guardar({ ordenes, etiquetas })
    guardarCicloBandejas({ ordenes, etiquetas })
  }, [ordenes, etiquetas, hidrato, apiActiva])

  const buscarPorCodigo = useCallback(
    (codigo: string) => repository.buscarEtiquetaPorCodigo(etiquetas, codigo),
    [etiquetas, repository],
  )

  const buscarPorCodigoAsync = useCallback(
    async (codigo: string): Promise<EtiquetaEnfermera | undefined> => {
      if (apiActiva) {
        try {
          const etq = await etiquetasRepository.buscarPorCodigo(codigo)
          setEtiquetas((prev) => {
            const existe = prev.some((e) => e.id === etq.id)
            return existe ? prev.map((e) => (e.id === etq.id ? etq : e)) : [...prev, etq]
          })
          return etq
        } catch {
          return undefined
        }
      }
      return repository.buscarEtiquetaPorCodigo(etiquetasRef.current, codigo)
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
      void crearOrdenCocina({
        fechaOperativa: fechaOperativaHoy(),
        comida: mapearComidaApi(referencia.comida),
        dietasIds: pendientesApi.map((orden) => orden.id),
      })
        .then((ordenApi) => {
          const ordenApiId = String(ordenApi.id)
          for (const orden of pendientesApi) {
            guardarOrdenCocinaApiId(orden.id, ordenApiId)
          }
          setOrdenes((prev) =>
            prev.map((orden) =>
              pendientesApi.some((item) => item.id === orden.id)
                ? {
                    ...orden,
                    estadoCocina: "en_preparacion",
                    ordenCocinaApiId: ordenApiId,
                  }
                : orden,
            ),
          )
          solicitarRefreshCenso(referencia.comida)
        })
        .catch((error) => {
          setOrdenes((prev) =>
            prev.map((orden) =>
              pendientesApi.some((item) => item.id === orden.id) &&
              !orden.ordenCocinaApiId
                ? { ...orden, estadoCocina: "por_iniciar" }
                : orden,
            ),
          )
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
        setOrdenes((prev) =>
          prev.map((orden) =>
            idsValidos.includes(orden.id) && orden.estadoCocina === "lista"
              ? { ...orden, estadoCocina: "en_preparacion" }
              : orden,
          ),
        )
        demoToast(
          "No hay orden de cocina vinculada. Marca la bandeja en preparación primero.",
          "error",
        )
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
        await recargarEtiquetas()

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
            !resolverEtiquetaParaOrden(orden, etiquetasRef.current),
        )

        const yaEnApi = targetOrdenes.filter((orden) =>
          Boolean(resolverEtiquetaParaOrden(orden, etiquetasRef.current)),
        )

        if (pendientes.length === 0) {
          setOrdenes((prev) =>
            syncOrdenesFromEtiquetas(prev, etiquetasRef.current),
          )
          return idsEtiquetasParaOrdenes(targetOrdenes, etiquetasRef.current)
        }

        const apiIds = [
          ...new Set(
            pendientes
              .map(
                (orden) =>
                  orden.ordenCocinaApiId ?? cargarOrdenCocinaApiId(orden.id),
              )
              .filter((id): id is string => Boolean(id)),
          ),
        ]

        if (apiIds.length === 0) {
          throw new Error(
            "Marca las bandejas como listas antes de generar etiquetas.",
          )
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

        await completarOrdenesCocinaEnApi(pendientes)

        const nuevas = deduplicarEtiquetasPorFila(
          await etiquetasRepository.generar({ ordenIds: apiIds }),
        )
        const etiquetasActualizadas = deduplicarEtiquetasPorFila([
          ...etiquetasRef.current,
          ...nuevas,
        ])
        setEtiquetas(etiquetasActualizadas)
        setOrdenes((prev) =>
          syncOrdenesFromEtiquetas(
            vincularEtiquetasGeneradas(prev, etiquetasActualizadas),
            etiquetasActualizadas,
          ),
        )
        await recargarEtiquetas()
        const ordenesFinales = [...targetOrdenes, ...yaEnApi]
        return idsEtiquetasParaOrdenes(
          ordenesFinales,
          etiquetasRef.current,
        )
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
    if (input.id) {
      const porId = ordenes.find((o) => o.id === input.id)
      if (porId) return porId.id
    }

    const existente = ordenes.find(
      (o) =>
        o.pacienteId === input.pacienteId &&
        o.comida === input.comida &&
        o.estadoCocina !== "cancelada",
    )
    if (existente) return existente.id

    const id = input.id ?? `ord-diet-${Date.now()}`
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

  const confirmarPreEntrega = useCallback(
    async (ids: string[], recibidoPor?: string): Promise<void> => {
      if (apiActiva) {
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
        } catch (error) {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo confirmar la recepción.",
            "error",
          )
          throw error
        }
        return
      }
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
    [syncOrdenesFromEtiquetas, ordenes, apiActiva, recargarEtiquetas, etiquetasRepository],
  )

  const confirmarEntrega = useCallback(
    (id: string) => {
      if (apiActiva) {
        void etiquetasRepository.confirmarEntrega(id).then(() => recargarEtiquetas())
        return
      }
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
    [syncOrdenesFromEtiquetas, apiActiva, recargarEtiquetas],
  )

  const confirmarDevolucion = useCallback(
    async (id: string, input: ConfirmarDevolucionInput): Promise<void> => {
      if (apiActiva) {
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
        } catch (error) {
          demoToast(
            error instanceof Error
              ? error.message
              : "No se pudo registrar la devolución.",
            "error",
          )
          throw error
        }
        return
      }
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
    [syncOrdenesFromEtiquetas, apiActiva, recargarEtiquetas, etiquetasRepository],
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
          if (apiActiva) {
            const ordenApiId = o.ordenCocinaApiId ?? cargarOrdenCocinaApiId(o.id)
            if (ordenApiId) {
              void actualizarChecklistOrdenCocina(ordenApiId, {
                items: checklist.map((item) => ({
                  id: item.id,
                  completado: item.completado,
                })),
              }).catch((error) => {
                demoToast(
                  error instanceof Error
                    ? error.message
                    : "No se pudo guardar el checklist.",
                  "error",
                )
              })
            }
          }
          return { ...o, checklist }
        }),
      )
    },
    [apiActiva],
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
      rehidratarDesdeStorage,
      sincronizarOrdenesDesdeFilas,
      hidrato,
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
      rehidratarDesdeStorage,
      sincronizarOrdenesDesdeFilas,
      hidrato,
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
