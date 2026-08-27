import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"
import {
  descargarPdfEtiquetaPrueba,
  descargarPdfEtiquetas,
} from "@/modules/dietas-cocina/api/services/etiquetas.service"
import { crearEtiquetaPruebaImpresion } from "@/modules/dietas-cocina/etiquetas/lib/crearEtiquetaPruebaImpresion"
import { descargarBlob } from "@/modules/dietas-cocina/lib/descargarBlob"
import {
  generarPdfEtiquetaIndividual,
  generarPdfEtiquetas,
} from "@/modules/dietas-cocina/etiquetas/lib/generarPdfEtiquetas"

export function descargarBlobPdf(blob: Blob, nombreArchivo: string): void {
  descargarBlob(blob, nombreArchivo)
}

/** API cuando está activa; html2canvas + jsPDF en modo mock. */
export async function imprimirEtiquetasPdf(opciones: {
  etiquetas: EtiquetaDieta[]
  nombreArchivo: string
  usarApi: boolean
}): Promise<void> {
  if (opciones.etiquetas.length === 0) return

  if (opciones.usarApi) {
    const blob = await descargarPdfEtiquetas(opciones.etiquetas.map((etiqueta) => etiqueta.id))
    descargarBlobPdf(blob, opciones.nombreArchivo)
    return
  }

  await generarPdfEtiquetas(opciones.etiquetas, opciones.nombreArchivo)
}

export async function imprimirEtiquetaPruebaPdf(usarApi: boolean): Promise<void> {
  if (usarApi) {
    const blob = await descargarPdfEtiquetaPrueba()
    descargarBlobPdf(blob, "etiqueta-prueba-impresion.pdf")
    return
  }

  await generarPdfEtiquetaIndividual(crearEtiquetaPruebaImpresion())
}
