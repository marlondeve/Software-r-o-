import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"

import { EscannerEtiquetaPanel } from "@/modules/dietas-cocina/etiquetas/components/EscannerEtiquetaPanel"
import { IngresoManualEtiquetaDialog } from "@/modules/dietas-cocina/etiquetas/components/IngresoManualEtiquetaDialog"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { puedeConfirmarEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"

export function EntregaFlowPage() {
  const navigate = useNavigate()
  const { buscarPorCodigo } = useCicloBandejas()
  const [error, setError] = useState<string | null>(null)
  const [manualAbierto, setManualAbierto] = useState(false)

  const procesarCodigo = useCallback(
    (codigo: string) => {
      const encontrada = buscarPorCodigo(codigo)
      if (!encontrada) {
        setError("No se encontró una etiqueta con ese código.")
        return
      }
      if (!puedeConfirmarEntrega(encontrada)) {
        setError(
          "Esta bandeja debe estar recibida del proveedor antes de entregarla al paciente.",
        )
        return
      }
      setError(null)
      navigate(
        `/dietas-cocina/etiquetas/consulta/${encodeURIComponent(encontrada.codigo)}`,
      )
    },
    [buscarPorCodigo, navigate],
  )

  return (
    <EtiquetasEnfermeraFlowLayout titulo="Entrega al paciente" paso={1} totalPasos={1}>
      <EscannerEtiquetaPanel
        modo="entrega"
        activo
        onCodigoLeido={procesarCodigo}
        onIngresoManual={() => setManualAbierto(true)}
      />
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
      <IngresoManualEtiquetaDialog
        abierto={manualAbierto}
        onAbiertoChange={setManualAbierto}
        onConfirmar={procesarCodigo}
      />
    </EtiquetasEnfermeraFlowLayout>
  )
}
