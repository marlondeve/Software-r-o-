import { jsPDF } from "jspdf"

import type { EtiquetaDieta } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import { capturarEtiquetaCanvas } from "@/modules/dietas-cocina/etiquetas/lib/capturarEtiquetaCanvas"
import {
  ALTO_ETIQUETA_MM,
  ALTO_PAGINA_PDF_MM,
  ANCHO_ETIQUETA_MM,
  ANCHO_PAGINA_PDF_MM,
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

  const imgData = canvas.toDataURL("image/png", 1.0)

  doc.addImage(
    imgData,
    "PNG",
    0,
    0,
    ANCHO_PAGINA_PDF_MM,
    ALTO_PAGINA_PDF_MM,
    undefined,
    "NONE",
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
