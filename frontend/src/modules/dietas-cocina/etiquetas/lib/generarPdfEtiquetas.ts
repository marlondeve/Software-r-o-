import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"
import { jsPDF } from "jspdf"

import { capturarEtiquetaCanvas } from "@/modules/dietas-cocina/etiquetas/lib/capturarEtiquetaCanvas"
import {
  ALTO_ETIQUETA_MM,
  ALTO_PAGINA_PDF_MM,
  ANCHO_ETIQUETA_MM,
  ANCHO_PAGINA_PDF_MM,
  MARGEN_PDF_MM,
  PDF_JPEG_CALIDAD,
} from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"

export { ANCHO_ETIQUETA_MM, ALTO_ETIQUETA_MM }

function crearDocumentoEtiqueta(): jsPDF {
  return new jsPDF({
    orientation: "l",
    unit: "mm",
    format: [ANCHO_PAGINA_PDF_MM, ALTO_PAGINA_PDF_MM],
    compress: true,
  })
}

function agregarCanvasComoPagina(
  doc: jsPDF,
  canvas: HTMLCanvasElement,
  esPrimera: boolean,
): void {
  if (!esPrimera) {
    doc.addPage([ANCHO_PAGINA_PDF_MM, ALTO_PAGINA_PDF_MM], "l")
  }

  const imgData = canvas.toDataURL("image/jpeg", PDF_JPEG_CALIDAD)

  doc.addImage(
    imgData,
    "JPEG",
    MARGEN_PDF_MM,
    MARGEN_PDF_MM,
    ANCHO_ETIQUETA_MM,
    ALTO_ETIQUETA_MM,
    undefined,
    "SLOW",
  )
}

export async function generarPdfEtiquetas(
  etiquetas: EtiquetaDieta[],
  nombreArchivo = "etiquetas-dietas.pdf",
): Promise<void> {
  if (etiquetas.length === 0) return

  const doc = crearDocumentoEtiqueta()

  for (let i = 0; i < etiquetas.length; i++) {
    const canvas = await capturarEtiquetaCanvas(etiquetas[i])
    agregarCanvasComoPagina(doc, canvas, i === 0)
  }

  doc.save(nombreArchivo)
}

export async function generarPdfEtiquetaIndividual(
  etiqueta: EtiquetaDieta,
): Promise<void> {
  await generarPdfEtiquetas([etiqueta], `etiqueta-${etiqueta.codigo}.pdf`)
}
