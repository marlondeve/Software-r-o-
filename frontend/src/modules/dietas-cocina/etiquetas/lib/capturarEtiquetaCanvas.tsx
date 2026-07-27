import type { EtiquetaDieta } from "@/modules/dietas-cocina/types/labels"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import html2canvas from "html2canvas"
import QRCode from "qrcode"

import { EtiquetaLabelFace } from "@/modules/dietas-cocina/etiquetas/components/EtiquetaLabelFace"
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

/** Captura el nodo de la etiqueta (115×66 mm) para html2canvas. */
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
    "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;background:#ffffff;"
  document.body.appendChild(contenedor)

  let root: Root | null = null

  try {
    root = createRoot(contenedor)
    flushSync(() => {
      root!.render(
        <EtiquetaLabelFace etiqueta={etiqueta} qrSrc={qrSrc} modo="impresion" />,
      )
    })

    await new Promise((resolve) => setTimeout(resolve, 80))

    const nodo = contenedor.querySelector(
      "[data-etiqueta-print]",
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
  const qrImg = document.querySelector(
    `[data-etiqueta-id="${CSS.escape(etiqueta.id)}"] img[alt=""]`,
  ) as HTMLImageElement | null
  const qrSrc =
    qrImg?.src ?? (await generarQrDataUrl(payloadQrEtiqueta(etiqueta.codigo)))

  return capturarEtiquetaImpresion(etiqueta, qrSrc)
}
