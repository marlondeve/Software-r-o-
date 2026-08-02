import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { EscannerEtiquetaPanel } from "@/modules/dietas-cocina/etiquetas/components/EscannerEtiquetaPanel"
import { IngresoManualEtiquetaDialog } from "@/modules/dietas-cocina/etiquetas/components/IngresoManualEtiquetaDialog"
import { ETIQUETAS_TOTAL_PASOS_FLUJO } from "@/modules/dietas-cocina/etiquetas/lib/flujosEtiquetaSteps"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { puedeConfirmarEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { RUTAS_LOGISTICA, rutaLogisticaConsulta } from "@/modules/dietas-cocina/lib/rutasLogistica"
import { mensajeEtiquetaNoEncontrada } from "@/modules/dietas-cocina/etiquetas/lib/mensajesEtiquetasOffline"

export function EntregaFlowPage() {
  const navigate = useNavigate()
  const { buscarPorCodigoAsync, estaOnline } = useCicloBandejas()
  const [error, setError] = useState<string | null>(null)
  const [manualAbierto, setManualAbierto] = useState(false)

  const procesarCodigo = useCallback(
    async (codigo: string) => {
      const encontrada = await buscarPorCodigoAsync(codigo)
      if (!encontrada) {
        setError(mensajeEtiquetaNoEncontrada(estaOnline))
        return
      }
      if (!puedeConfirmarEntrega(encontrada)) {
        setError(
          "Esta bandeja debe estar recibida del proveedor antes de entregarla al paciente.",
        )
        return
      }
      setError(null)
      navigate(rutaLogisticaConsulta(encontrada.codigo))
    },
    [buscarPorCodigoAsync, navigate, estaOnline],
  )

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo="Entrega al paciente"
      paso={1}
      totalPasos={ETIQUETAS_TOTAL_PASOS_FLUJO}
      rutaVolver={RUTAS_LOGISTICA.piso}
      etiquetaVolver="Bandejas en piso"
    >
      <EscannerEtiquetaPanel
        modo="entrega"
        activo
        mostrarEncabezado={false}
        onCodigoLeido={procesarCodigo}
        onIngresoManual={() => setManualAbierto(true)}
      />
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <IngresoManualEtiquetaDialog
        abierto={manualAbierto}
        onAbiertoChange={setManualAbierto}
        onConfirmar={procesarCodigo}
      />
    </EtiquetasEnfermeraFlowLayout>
  )
}
