/** Feedback demo sin backend — toast visual mínimo vía alert nativo. */
export function demoToast(mensaje: string) {
  window.alert(mensaje)
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
