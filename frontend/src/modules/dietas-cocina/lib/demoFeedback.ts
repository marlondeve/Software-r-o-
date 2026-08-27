import { sileo } from "sileo"

import { descargarTexto } from "@/modules/dietas-cocina/lib/descargarBlob"

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
  descargarTexto(contenido, nombreArchivo, tipo)
}
