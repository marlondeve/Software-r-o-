import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { EtiquetaLabelFace } from "@/modules/dietas-cocina/etiquetas/components/EtiquetaLabelFace"
import type { EtiquetaDieta } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import { ETIQUETA_QR_RESolucion, dimensionesEtiquetaPantalla } from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"

interface EtiquetaCardProps {
  etiqueta: EtiquetaDieta
  seleccionada: boolean
  onSeleccionChange: (checked: boolean) => void
}

export function EtiquetaCard({
  etiqueta,
  seleccionada,
  onSeleccionChange,
}: EtiquetaCardProps) {
  const [qrSrc, setQrSrc] = useState<string>("")

  useEffect(() => {
    let activo = true
    const payload = payloadQrEtiqueta(etiqueta.codigo)
    QRCode.toDataURL(payload, {
      margin: 0,
      width: ETIQUETA_QR_RESolucion,
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
      )}
      style={{ maxWidth: anchoPantalla }}
    >
      {seleccionada && (
        <span className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-1 rounded-t-lg bg-primary py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          <Check className="size-3" aria-hidden />
          Seleccionada
        </span>
      )}

      <div
        className={cn(
          "rounded-lg transition-all",
          seleccionada
            ? "pt-5 shadow-md ring-2 ring-primary/25"
            : "group-hover:shadow-md",
        )}
      >
        <EtiquetaLabelFace etiqueta={etiqueta} qrSrc={qrSrc} />
      </div>
    </button>
  )
}
