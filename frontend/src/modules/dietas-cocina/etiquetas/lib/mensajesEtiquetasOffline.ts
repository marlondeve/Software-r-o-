/** Mensaje cuando no se encuentra una etiqueta al escanear. */
export function mensajeEtiquetaNoEncontrada(estaOnline: boolean): string {
  if (!estaOnline) {
    return "Sin conexión: esta etiqueta no está cargada en el dispositivo. Conecte a la red para buscarla en el servidor."
  }
  return "No se encontró una etiqueta con ese código."
}
