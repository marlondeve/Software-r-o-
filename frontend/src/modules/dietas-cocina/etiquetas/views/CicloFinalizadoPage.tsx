import type { ModoFlujoEtiqueta } from "@/modules/dietas-cocina/types/enums"
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { CicloFinalizadoPanel } from "@/modules/dietas-cocina/etiquetas/components/CicloFinalizadoPanel"
import { ETIQUETAS_TOTAL_PASOS_FLUJO } from "@/modules/dietas-cocina/etiquetas/lib/flujosEtiquetaSteps"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import {
  configDevolucionPorTipo,
  type TipoDevolucionEtiqueta,
} from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import {
  obtenerPrimeraRutaLogisticaPermitida,
  RUTAS_LOGISTICA,
} from "@/modules/dietas-cocina/lib/rutasLogistica"
import { useRolVistaEfectivo } from "@/modules/dietas-cocina/context/VistaRolAdminContext"

interface ExitoLocationState {
  modo: ModoFlujoEtiqueta
  etiquetaId: string
  tipoDevolucion?: TipoDevolucionEtiqueta
}

const MODOS_VALIDOS: ModoFlujoEtiqueta[] = ["pre-entrega", "entrega", "devolucion"]

function esModoValido(valor: string | null): valor is ModoFlujoEtiqueta {
  return MODOS_VALIDOS.includes(valor as ModoFlujoEtiqueta)
}

function tituloFlujoExito(
  modo: ModoFlujoEtiqueta,
  tipoDevolucion?: TipoDevolucionEtiqueta,
): string {
  if (modo === "pre-entrega") return "Recepción del proveedor"
  if (modo === "entrega") return "Entrega al paciente"
  if (modo === "devolucion" && tipoDevolucion) {
    return configDevolucionPorTipo(tipoDevolucion).titulo
  }
  return "Registro de bandeja"
}

export function CicloFinalizadoPage({
  origen,
}: {
  origen: "recepcion" | "piso"
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { etiquetas } = useCicloBandejas()
  const rol = useRolVistaEfectivo()
  const state = location.state as ExitoLocationState | null

  const modoParam = searchParams.get("modo")
  const modo: ModoFlujoEtiqueta | null =
    state?.modo ?? (esModoValido(modoParam) ? modoParam : null)
  const etiquetaId = state?.etiquetaId ?? searchParams.get("etiquetaId")

  const fallback =
    obtenerPrimeraRutaLogisticaPermitida(rol) ?? "/dietas-cocina/inicio"

  const rutaListado =
    origen === "recepcion" ? RUTAS_LOGISTICA.recepcion : RUTAS_LOGISTICA.piso

  if (!modo || !etiquetaId) {
    return <Navigate to={fallback} replace />
  }

  const etiqueta = etiquetas.find((e) => e.id === etiquetaId)
  if (!etiqueta) {
    return <Navigate to={fallback} replace />
  }

  const rutaSiguiente =
    modo === "devolucion"
      ? state?.tipoDevolucion
        ? configDevolucionPorTipo(state.tipoDevolucion).rutaExito
        : `${RUTAS_LOGISTICA.pisoDevolucion}/paciente`
      : modo === "pre-entrega"
        ? RUTAS_LOGISTICA.recepcionEscaneo
        : RUTAS_LOGISTICA.pisoEntrega

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo={tituloFlujoExito(modo, state?.tipoDevolucion)}
      paso={ETIQUETAS_TOTAL_PASOS_FLUJO}
      totalPasos={ETIQUETAS_TOTAL_PASOS_FLUJO}
      rutaVolver={rutaListado}
      etiquetaVolver="Volver al listado"
    >
      <CicloFinalizadoPanel
        modo={modo}
        etiqueta={etiqueta}
        tipoDevolucion={state?.tipoDevolucion}
        onEscanearSiguiente={() => navigate(rutaSiguiente)}
        onVolverListado={() => navigate(rutaListado)}
      />
    </EtiquetasEnfermeraFlowLayout>
  )
}
