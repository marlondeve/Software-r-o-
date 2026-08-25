import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"

import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { useDietasOperativas } from "@/modules/dietas-cocina/context/DietasOperativasContext"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import {
  COMIDAS_OPERATIVAS,
  obtenerComidaActivaOperativa,
} from "@/modules/dietas-cocina/config/operativa-defaults"
import { calcularKpisEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import {
  puedeCapacidadEtiquetas,
  puedeRecepcionProveedor,
  tieneOperacionBandejasPiso,
} from "@/modules/dietas-cocina/etiquetas/lib/permisosEtiquetas"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"
import {
  clasificarEtiquetaRespectoCenso,
  etiquetaEnFlujoCenso,
} from "@/modules/dietas-cocina/lib/clasificarEtiquetaCenso"
import { filtrarEtiquetasDelPeriodoOperativo } from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"

export function useEtiquetasOperativas() {
  const apiActiva = usarApiDietasCocina()
  const rol = useRolVistaEfectivo()
  const location = useLocation()
  const { etiquetas, confirmarPreEntrega, getOrdenByEtiquetaId } =
    useCicloBandejas()
  const { filas } = useDietasOperativas()
  const [comidaActiva, setComidaActiva] = useState<TiempoComida>(() =>
    apiActiva ? obtenerComidaActivaOperativa() : mockEtiquetas.comidaActiva,
  )
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [mostrarFueraFlujo, setMostrarFueraFlujo] = useState(false)

  const puedeRecepcion = puedeRecepcionProveedor(rol)
  const operacionPiso = tieneOperacionBandejasPiso(rol)

  useEffect(() => {
    const state = location.state as { mensaje?: string } | null
    if (state?.mensaje) {
      setMensaje(state.mensaje)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const etiquetasOperativas = useMemo(
    () => filtrarEtiquetasDelPeriodoOperativo(etiquetas),
    [etiquetas],
  )

  const filtradasComida = useMemo(
    () => etiquetasOperativas.filter((e) => e.comida === comidaActiva),
    [etiquetasOperativas, comidaActiva],
  )

  const clasificacionPorId = useMemo(() => {
    const mapa = new Map<
      string,
      ReturnType<typeof clasificarEtiquetaRespectoCenso>
    >()
    for (const etiqueta of filtradasComida) {
      mapa.set(etiqueta.id, clasificarEtiquetaRespectoCenso(etiqueta, filas))
    }
    return mapa
  }, [filtradasComida, filas])

  const kpis = useMemo(() => {
    const todos = calcularKpisEnfermera(etiquetasOperativas, comidaActiva, {
      esEnFlujoCenso: (etiqueta) => etiquetaEnFlujoCenso(etiqueta, filas),
    })
    return todos.filter((kpi) => {
      if (kpi.id === "pendientes-recepcion") return puedeRecepcion
      if (kpi.id === "pendientes-entrega") return puedeRecepcion || operacionPiso
      if (kpi.id === "recogidas") {
        return puedeCapacidadEtiquetas(rol, "recogida_bandeja")
      }
      if (kpi.id === "fuera-flujo") return true
      return true
    })
  }, [etiquetasOperativas, comidaActiva, puedeRecepcion, operacionPiso, rol, filas])

  /** Pendientes accionables: solo en flujo (alineado con Cocina). */
  const pendientesRecepcion = useMemo(
    () =>
      filtradasComida.filter(
        (e) =>
          e.estadoLogistica === "impresa" && etiquetaEnFlujoCenso(e, filas),
      ),
    [filtradasComida, filas],
  )

  /** Historial del turno: impresas fuera de censo/canceladas (visibles, no accionables). */
  const pendientesRecepcionFueraFlujo = useMemo(
    () =>
      filtradasComida.filter(
        (e) =>
          e.estadoLogistica === "impresa" && !etiquetaEnFlujoCenso(e, filas),
      ),
    [filtradasComida, filas],
  )

  const pendientesEntrega = useMemo(
    () =>
      filtradasComida.filter(
        (e) =>
          e.estadoLogistica === "pre_entregada" &&
          etiquetaEnFlujoCenso(e, filas),
      ),
    [filtradasComida, filas],
  )

  const pendientesEntregaFueraFlujo = useMemo(
    () =>
      filtradasComida.filter(
        (e) =>
          e.estadoLogistica === "pre_entregada" &&
          !etiquetaEnFlujoCenso(e, filas),
      ),
    [filtradasComida, filas],
  )

  function cambiarComida(id: TiempoComida) {
    setComidaActiva(id)
    setSeleccionados(new Set())
    setMensaje(null)
    setMostrarFueraFlujo(false)
  }

  function toggleSeleccion(id: string, checked: boolean) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleTodas(checked: boolean) {
    if (checked) {
      setSeleccionados(new Set(pendientesRecepcion.map((e) => e.id)))
    } else {
      setSeleccionados(new Set())
    }
  }

  return {
    apiActiva,
    rol,
    comidas: apiActiva ? COMIDAS_OPERATIVAS : mockEtiquetas.comidas,
    comidaActiva,
    cambiarComida,
    mensaje,
    confirmando,
    setConfirmando,
    seleccionados,
    kpis,
    pendientesRecepcion,
    pendientesRecepcionFueraFlujo,
    pendientesEntrega,
    pendientesEntregaFueraFlujo,
    clasificacionPorId,
    mostrarFueraFlujo,
    setMostrarFueraFlujo,
    toggleSeleccion,
    toggleTodas,
    confirmarPreEntrega,
    getOrdenByEtiquetaId,
  }
}
