import type { ModoFlujoEtiqueta } from "@/modules/dietas-cocina/types/enums"
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { CicloFinalizadoPanel } from "@/modules/dietas-cocina/etiquetas/components/CicloFinalizadoPanel"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { configDevolucionPorTipo, type TipoDevolucionEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/devolucionConfig"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"

interface ExitoLocationState {
  modo: ModoFlujoEtiqueta
  etiquetaId: string
  tipoDevolucion?: TipoDevolucionEtiqueta
}

const MODOS_VALIDOS: ModoFlujoEtiqueta[] = ["pre-entrega", "entrega", "devolucion"]

function esModoValido(valor: string | null): valor is ModoFlujoEtiqueta {
  return MODOS_VALIDOS.includes(valor as ModoFlujoEtiqueta)
}

export function CicloFinalizadoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { etiquetas } = useCicloBandejas()
  const state = location.state as ExitoLocationState | null

  const modoParam = searchParams.get("modo")
  const modo: ModoFlujoEtiqueta | null =
    state?.modo ?? (esModoValido(modoParam) ? modoParam : null)
  const etiquetaId = state?.etiquetaId ?? searchParams.get("etiquetaId")

  if (!modo || !etiquetaId) {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  const etiqueta = etiquetas.find((e) => e.id === etiquetaId)
  if (!etiqueta) {
    return <Navigate to="/dietas-cocina/etiquetas" replace />
  }

  const rutaSiguiente =
    modo === "devolucion"
      ? state?.tipoDevolucion
        ? configDevolucionPorTipo(state.tipoDevolucion).rutaExito
        : "/dietas-cocina/etiquetas/devolucion/paciente"
      : modo === "pre-entrega"
        ? "/dietas-cocina/etiquetas/pre-entrega"
        : "/dietas-cocina/etiquetas/entrega"

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo="Ciclo finalizado"
      paso={1}
      totalPasos={1}
    >
      <CicloFinalizadoPanel
        modo={modo}
        etiqueta={etiqueta}
        tipoDevolucion={state?.tipoDevolucion}
        onEscanearSiguiente={() => navigate(rutaSiguiente)}
      />
    </EtiquetasEnfermeraFlowLayout>
  )
}
