import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import html2canvas from "html2canvas"
import QRCode from "qrcode"

import { EtiquetaLabelFaceImpresion } from "@/modules/dietas-cocina/etiquetas/components/EtiquetaLabelFaceImpresion"
import type { EtiquetaDieta } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import { ETIQUETA_QR_RESolucion } from "@/modules/dietas-cocina/etiquetas/lib/etiquetaLayout"
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"

async function generarQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    margin: 0,
    width: ETIQUETA_QR_RESolucion,
    color: { dark: "#000000", light: "#ffffff" },
  })
}

function esperarImagenes(contenedor: HTMLElement): Promise<void> {
  const imagenes = [...contenedor.querySelectorAll("img")]
  return Promise.all(
    imagenes.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        }),
    ),
  ).then(() => undefined)
}

function qrDesdeEtiquetaVisible(id: string): string | null {
  const img = document.querySelector(
    `[data-etiqueta-id="${id}"] img[alt=""]`,
  ) as HTMLImageElement | null
  return img?.src || null
}

/** Captura solo el componente de impresión (nunca la vista de pantalla). */
async function capturarNodoImpresion(nodo: HTMLElement): Promise<HTMLCanvasElement> {
  await esperarImagenes(nodo)

  const ancho = nodo.offsetWidth
  const alto = nodo.offsetHeight

  return html2canvas(nodo, {
    scale: 4,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: ancho,
    height: alto,
    windowWidth: ancho,
    windowHeight: alto,
  })
}

async function capturarEtiquetaImpresion(
  etiqueta: EtiquetaDieta,
  qrSrc: string,
): Promise<HTMLCanvasElement> {
  const contenedor = document.createElement("div")
  contenedor.setAttribute("aria-hidden", "true")
  contenedor.style.cssText =
    "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;"
  document.body.appendChild(contenedor)

  let root: Root | null = null

  try {
    root = createRoot(contenedor)
    flushSync(() => {
      root!.render(
        <EtiquetaLabelFaceImpresion etiqueta={etiqueta} qrSrc={qrSrc} />,
      )
    })

    await new Promise((resolve) => setTimeout(resolve, 80))

    const nodo = contenedor.querySelector(
      "[data-etiqueta-capture]",
    ) as HTMLElement | null
    if (!nodo) {
      throw new Error("No se pudo renderizar la etiqueta para PDF")
    }

    return await capturarNodoImpresion(nodo)
  } finally {
    root?.unmount()
    contenedor.remove()
  }
}

export async function capturarEtiquetaCanvas(
  etiqueta: EtiquetaDieta,
): Promise<HTMLCanvasElement> {
  const qrSrc =
    qrDesdeEtiquetaVisible(etiqueta.id) ??
    (await generarQrDataUrl(payloadQrEtiqueta(etiqueta.codigo)))

  return capturarEtiquetaImpresion(etiqueta, qrSrc)
}
