import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"
import { EtiquetaLabelFace } from "@/modules/dietas-cocina/etiquetas/components/EtiquetaLabelFace"

interface EtiquetaLabelFaceImpresionProps {
  etiqueta: EtiquetaDieta
  qrSrc: string
}

/** Alias de compatibilidad — misma maquetación que la vista en pantalla. */
export function EtiquetaLabelFaceImpresion({
  etiqueta,
  qrSrc,
}: EtiquetaLabelFaceImpresionProps) {
  return <EtiquetaLabelFace etiqueta={etiqueta} qrSrc={qrSrc} modo="impresion" />
}
