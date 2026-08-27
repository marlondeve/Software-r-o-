/**
 * Dispara la descarga de un blob. El enlace se adjunta al documento porque
 * Firefox ignora el click en un nodo suelto.
 */
export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement("a")
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.rel = "noopener"
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

export function descargarTexto(
  contenido: string,
  nombreArchivo: string,
  tipo = "text/plain;charset=utf-8",
): void {
  descargarBlob(new Blob([contenido], { type: tipo }), nombreArchivo)
}
