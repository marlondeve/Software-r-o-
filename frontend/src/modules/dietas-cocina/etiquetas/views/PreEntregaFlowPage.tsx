import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { BandejaResumenCard } from "@/modules/dietas-cocina/etiquetas/components/BandejaResumenCard"
import { EscannerEtiquetaPanel } from "@/modules/dietas-cocina/etiquetas/components/EscannerEtiquetaPanel"
import { IngresoManualEtiquetaDialog } from "@/modules/dietas-cocina/etiquetas/components/IngresoManualEtiquetaDialog"
import { ETIQUETAS_TOTAL_PASOS_FLUJO } from "@/modules/dietas-cocina/etiquetas/lib/flujosEtiquetaSteps"
import { usarApiDietasCocina } from "@/modules/dietas-cocina/api"
import { useCicloBandejas } from "@/modules/dietas-cocina/context/CicloBandejasContext"
import { motivoNoConfirmarPreEntrega } from "@/modules/dietas-cocina/lib/cicloBandejasValidaciones"
import { EtiquetasEnfermeraFlowLayout } from "@/modules/dietas-cocina/etiquetas/views/EtiquetasEnfermeraFlowLayout"
import { RUTAS_LOGISTICA } from "@/modules/dietas-cocina/lib/rutasLogistica"
import { mensajeEtiquetaNoEncontrada } from "@/modules/dietas-cocina/etiquetas/lib/mensajesEtiquetasOffline"

export function PreEntregaFlowPage() {
  const apiActiva = usarApiDietasCocina()
  const navigate = useNavigate()
  const { buscarPorCodigoAsync, confirmarPreEntrega, getOrdenByEtiquetaId, estaOnline } =
    useCicloBandejas()
  const [paso, setPaso] = useState(1)
  const [etiqueta, setEtiqueta] = useState<EtiquetaEnfermera | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualAbierto, setManualAbierto] = useState(false)
  const [escaneando, setEscaneando] = useState(true)
  const [confirmando, setConfirmando] = useState(false)

  const procesarCodigo = useCallback(
    async (codigo: string) => {
      const encontrada = await buscarPorCodigoAsync(codigo)
      if (!encontrada) {
        setError(mensajeEtiquetaNoEncontrada(estaOnline))
        return
      }
      const orden = getOrdenByEtiquetaId(encontrada.id)
      const motivo = motivoNoConfirmarPreEntrega(orden, encontrada, { apiActiva })
      if (motivo) {
        setError(motivo)
        return
      }
      setError(null)
      setEtiqueta(encontrada)
      setEscaneando(false)
      setPaso(2)
    },
    [buscarPorCodigoAsync, getOrdenByEtiquetaId, apiActiva, estaOnline],
  )

  function volverAEscanear() {
    setPaso(1)
    setEtiqueta(null)
    setEscaneando(true)
    setError(null)
  }

  async function confirmar() {
    if (!etiqueta) return
    setConfirmando(true)
    try {
      await confirmarPreEntrega([etiqueta.id], "Enfermera de turno")
      navigate(RUTAS_LOGISTICA.recepcionExito, {
        state: { modo: "pre-entrega", etiquetaId: etiqueta.id },
      })
    } catch {
      setError("No se pudo confirmar la recepción. Intenta de nuevo.")
    } finally {
      setConfirmando(false)
    }
  }

  return (
    <EtiquetasEnfermeraFlowLayout
      titulo="Recepción del proveedor"
      paso={paso}
      totalPasos={ETIQUETAS_TOTAL_PASOS_FLUJO}
      rutaVolver={paso === 1 ? RUTAS_LOGISTICA.recepcion : undefined}
      onVolver={paso === 2 ? volverAEscanear : undefined}
      etiquetaVolver={paso === 2 ? "Escanear de nuevo" : "Recepción"}
      footer={
        paso === 2 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={volverAEscanear}
            >
              Escanear otra
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={confirmando}
              onClick={() => void confirmar()}
            >
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
        </>
      )}
      {paso === 2 && etiqueta && (
        <div className="space-y-4">
          <BandejaResumenCard etiqueta={etiqueta} />
          <p className="text-sm text-muted-foreground">
            Comprueba habitación, paciente y tipo de dieta antes de confirmar la
            recepción del proveedor.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </EtiquetasEnfermeraFlowLayout>
  )
}
