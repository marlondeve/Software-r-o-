import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { BandejaResumenCard } from "@/modules/dietas-cocina/etiquetas/components/BandejaResumenCard"
import { EscannerEtiquetaPanel } from "@/modules/dietas-cocina/etiquetas/components/EscannerEtiquetaPanel"
import { IngresoManualEtiquetaDialog } from "@/modules/dietas-cocina/etiquetas/components/IngresoManualEtiquetaDialog"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { motivoNoConfirmarPreEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"

export function PreEntregaFlowPage() {
  const navigate = useNavigate()
  const { buscarPorCodigo, confirmarPreEntrega, getOrdenByEtiquetaId } =
    useCicloBandejas()
  const [paso, setPaso] = useState(1)
  const [etiqueta, setEtiqueta] = useState<EtiquetaEnfermera | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualAbierto, setManualAbierto] = useState(false)
  const [escaneando, setEscaneando] = useState(true)

  const procesarCodigo = useCallback(
    (codigo: string) => {
      const encontrada = buscarPorCodigo(codigo)
      if (!encontrada) {
        setError("No se encontró una etiqueta con ese código.")
        return
      }
      const orden = getOrdenByEtiquetaId(encontrada.id)
      const motivo = motivoNoConfirmarPreEntrega(orden, encontrada)
      if (motivo) {
        setError(motivo)
        return
      }
      setError(null)
      setEtiqueta(encontrada)
      setEscaneando(false)
      setPaso(2)
    },
    [buscarPorCodigo, getOrdenByEtiquetaId],
  )

  function confirmar() {
    if (!etiqueta) return
    confirmarPreEntrega([etiqueta.id], "Enfermera de turno")
    navigate("/dietas-cocina/etiquetas/exito", {
      state: { modo: "pre-entrega", etiquetaId: etiqueta.id },
    })
  }

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo="Recepción del proveedor"
      paso={paso}
      totalPasos={2}
      footer={
        paso === 2 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setPaso(1)
                setEtiqueta(null)
                setEscaneando(true)
              }}
            >
              Escanear otra
            </Button>
            <Button type="button" className="flex-1" onClick={confirmar}>
              Confirmar recepción
            </Button>
          </div>
        ) : undefined
      }
    >
      {paso === 1 && (
        <>
          <EscannerEtiquetaPanel
            modo="pre-entrega"
            activo={escaneando}
            onCodigoLeido={procesarCodigo}
            onIngresoManual={() => setManualAbierto(true)}
          />
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <IngresoManualEtiquetaDialog
            abierto={manualAbierto}
            onAbiertoChange={setManualAbierto}
            onConfirmar={procesarCodigo}
          />
        </>
      )}
      {paso === 2 && etiqueta && (
        <div className="mx-auto max-w-lg space-y-4">
          <BandejaResumenCard etiqueta={etiqueta} />
          <p className="text-sm text-muted-foreground">
            Verifica los datos y confirma que recibiste esta bandeja del proveedor.
          </p>
        </div>
      )}
    </EtiquetasEnfermeraFlowLayout>
  )
}
