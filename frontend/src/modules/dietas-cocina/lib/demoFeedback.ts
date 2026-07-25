import { sileo } from "sileo"

export type DemoToastVariant = "success" | "error" | "warning" | "info"

/** Notificación toast del módulo (Sileo). */
export function demoToast(mensaje: string, variant: DemoToastVariant = "info") {
  sileo[variant]({ title: mensaje })
}

export function descargarArchivoDemo(
  contenido: string,
  nombreArchivo: string,
  tipo = "text/plain;charset=utf-8",
) {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}
