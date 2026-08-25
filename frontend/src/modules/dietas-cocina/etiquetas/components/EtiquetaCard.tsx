import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"
import type { MotivoFueraFlujoEtiqueta } from "@/modules/dietas-cocina/lib/clasificarEtiquetaCenso"
import { etiquetaFueraFlujoCensoLabel } from "@/modules/dietas-cocina/lib/clasificarEtiquetaCenso"
import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { EtiquetaLabelFace } from "@/modules/dietas-cocina/etiquetas/components/EtiquetaLabelFace"
import { ETIQUETA_QR_RESOLUCION_PANTALLA, dimensionesEtiquetaPantalla } from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"

interface EtiquetaCardProps {
  etiqueta: EtiquetaDieta
  seleccionada: boolean
  onSeleccionChange: (checked: boolean) => void
  /** Presente cuando la etiqueta ya no cuenta en el flujo operativo (sigue visible). */
  motivoFueraFlujo?: MotivoFueraFlujoEtiqueta
}

export function EtiquetaCard({
  etiqueta,
  seleccionada,
  onSeleccionChange,
  motivoFueraFlujo,
}: EtiquetaCardProps) {
  const [qrSrc, setQrSrc] = useState<string>("")

  useEffect(() => {
    let activo = true
    const payload = payloadQrEtiqueta(etiqueta.codigo)
    QRCode.toDataURL(payload, {
      margin: 1,
      width: ETIQUETA_QR_RESOLUCION_PANTALLA,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    }).then((url) => {
      if (activo) setQrSrc(url)
    })
    return () => {
      activo = false
    }
  }, [etiqueta.codigo])

  function alternarSeleccion() {
    onSeleccionChange(!seleccionada)
  }

  const { ancho: anchoPantalla } = dimensionesEtiquetaPantalla()
  const fueraFlujo = Boolean(motivoFueraFlujo)

  return (
    <button
      type="button"
      onClick={alternarSeleccion}
      aria-pressed={seleccionada}
      aria-label={`${seleccionada ? "Deseleccionar" : "Seleccionar"} etiqueta ${etiqueta.codigo}`}
      className={cn(
        "group relative mx-auto block w-full text-left",
        "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        seleccionada ? "scale-[1.01]" : "hover:scale-[1.005]",
        fueraFlujo && "opacity-90",
      )}
      style={{ maxWidth: anchoPantalla }}
    >
      {seleccionada && (
        <span className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-1 rounded-t-lg bg-primary py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          <Check className="size-3" aria-hidden />
          Seleccionada
        </span>
      )}

      {fueraFlujo && (
        <span
          className={cn(
            "absolute right-2 z-10 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 shadow-sm",
            seleccionada ? "top-6" : "top-2",
          )}
        >
          {etiquetaFueraFlujoCensoLabel(motivoFueraFlujo)}
        </span>
      )}

      <div
        className={cn(
          "rounded-lg transition-all",
          seleccionada
            ? "pt-5 shadow-md ring-2 ring-primary/25"
            : "group-hover:shadow-md",
          fueraFlujo && "ring-1 ring-amber-200/80",
        )}
      >
        <EtiquetaLabelFace etiqueta={etiqueta} qrSrc={qrSrc} />
      </div>
    </button>
  )
}
