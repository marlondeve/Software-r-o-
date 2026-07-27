import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import { fechaOperativaHoy } from "@/modules/dietas-cocina/api/utils"

function normalizarFechaOperativa(valor: string): string | undefined {
  const iso = valor.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]

  const latam = valor.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (latam) {
    const [, day, month, year] = latam
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const parsed = Date.parse(valor)
  if (!Number.isNaN(parsed)) {
    return fechaOperativaHoy(new Date(parsed))
  }

  return undefined
}

export function etiquetaEsDelDiaOperativo(
  etiqueta: Pick<EtiquetaEnfermera, "fechaHora">,
  fechaReferencia = fechaOperativaHoy(),
): boolean {
  const ref = etiqueta.fechaHora?.trim()
  if (!ref) return false
  const fechaEtiqueta = normalizarFechaOperativa(ref)
  return fechaEtiqueta === fechaReferencia
}

export function ordenPerteneceAFila(
  fila: FilaDieta,
  orden: OrdenCocina,
): boolean {
  if (orden.comida !== fila.comida) return false
  if (orden.id === fila.id) return true
  if (fila.ordenCocinaId && orden.ordenCocinaApiId === fila.ordenCocinaId) {
    return true
  }
  if (fila.ordenCocinaId && orden.id === fila.ordenCocinaId) return true
  return false
}

export function etiquetaPerteneceAFila(
  fila: FilaDieta,
  etiqueta: EtiquetaEnfermera,
  orden?: OrdenCocina,
): boolean {
  if (etiqueta.comida !== fila.comida) return false
  if (!etiquetaEsDelDiaOperativo(etiqueta)) return false

  if (etiqueta.filaDietaId) {
    return etiqueta.filaDietaId === fila.id
  }

  if (orden && orden.etiquetaId === etiqueta.id) {
    return ordenPerteneceAFila(fila, orden)
  }

  if (fila.ordenCocinaId && etiqueta.ordenCocinaId === fila.ordenCocinaId) {
    return true
  }

  return false
}

export function etiquetaPerteneceAOrden(
  orden: OrdenCocina,
  etiqueta: EtiquetaEnfermera,
): boolean {
  if (etiqueta.comida !== orden.comida) return false
  if (!etiquetaEsDelDiaOperativo(etiqueta)) return false

  if (etiqueta.filaDietaId && etiqueta.filaDietaId !== orden.id) return false

  if (orden.etiquetaId) {
    return etiqueta.id === orden.etiquetaId
  }

  if (orden.ordenCocinaApiId && etiqueta.ordenCocinaId) {
    return etiqueta.ordenCocinaId === orden.ordenCocinaApiId
  }

  return etiqueta.filaDietaId === orden.id
}

export function resolverEtiquetaParaOrden(
  orden: OrdenCocina,
  etiquetas: EtiquetaEnfermera[],
): EtiquetaEnfermera | undefined {
  const candidatas = etiquetas.filter(
    (etiqueta) => etiqueta.comida === orden.comida,
  )

  if (orden.etiquetaId) {
    const porId = candidatas.find((etiqueta) => etiqueta.id === orden.etiquetaId)
    if (porId && etiquetaPerteneceAOrden(orden, porId)) return porId
  }

  const porFila = candidatas.find((etiqueta) => etiqueta.filaDietaId === orden.id)
  if (porFila && etiquetaPerteneceAOrden(orden, porFila)) return porFila

  if (orden.ordenCocinaApiId) {
    const porApi = candidatas.find(
      (etiqueta) => etiqueta.ordenCocinaId === orden.ordenCocinaApiId,
    )
    if (porApi && etiquetaPerteneceAOrden(orden, porApi)) return porApi
  }

  return undefined
}

export function filtrarEtiquetasDelPeriodoOperativo(
  etiquetas: EtiquetaEnfermera[],
  opciones?: { comida?: TiempoComida; fecha?: string },
): EtiquetaEnfermera[] {
  const fecha = opciones?.fecha ?? fechaOperativaHoy()
  return etiquetas.filter((etiqueta) => {
    if (opciones?.comida && etiqueta.comida !== opciones.comida) return false
    return etiquetaEsDelDiaOperativo(etiqueta, fecha)
  })
}

export function filtrarOrdenesVinculadasAFilas(
  ordenes: OrdenCocina[],
  filas: FilaDieta[],
): OrdenCocina[] {
  if (filas.length === 0) return ordenes

  return ordenes.filter((orden) => {
    const fila = filas.find((item) => ordenPerteneceAFila(item, orden))
    // Conservar órdenes recién cargadas del API hasta que el censo local alcance.
    if (!fila) return true
    if (fila.comida !== orden.comida) return false
    if (fila.estado === "cancelada") return orden.estadoCocina === "cancelada"
    if (fila.estado === "no-solicitada" || fila.estado === "guardado") {
      return false
    }
    return true
  })
}

export function resolverOrdenParaFila(
  fila: FilaDieta,
  ordenes: OrdenCocina[],
): OrdenCocina | undefined {
  const ordenesComida = ordenes.filter((orden) => orden.comida === fila.comida)
  const porId = new Map(ordenesComida.map((orden) => [orden.id, orden]))
  const porApiId = new Map(
    ordenesComida
      .filter((orden) => orden.ordenCocinaApiId)
      .map((orden) => [orden.ordenCocinaApiId!, orden]),
  )

  if (fila.ordenCocinaId) {
    const candidata =
      porId.get(fila.ordenCocinaId) ?? porApiId.get(fila.ordenCocinaId)
    if (candidata && ordenPerteneceAFila(fila, candidata)) return candidata
  }

  const porFila = porId.get(fila.id)
  return porFila && ordenPerteneceAFila(fila, porFila) ? porFila : undefined
}

export function resolverEtiquetaParaFila(
  fila: FilaDieta,
  orden: OrdenCocina | undefined,
  etiquetas: EtiquetaEnfermera[],
): EtiquetaEnfermera | undefined {
  const etiquetasComida = etiquetas.filter(
    (etiqueta) => etiqueta.comida === fila.comida,
  )

  if (orden?.etiquetaId) {
    const porOrden = etiquetasComida.find(
      (etiqueta) => etiqueta.id === orden.etiquetaId,
    )
    if (porOrden && etiquetaPerteneceAFila(fila, porOrden, orden)) {
      return porOrden
    }
  }

  const porFila = etiquetasComida.find(
    (etiqueta) => etiqueta.filaDietaId === fila.id,
  )
  if (porFila && etiquetaPerteneceAFila(fila, porFila, orden)) return porFila

  if (orden?.ordenCocinaApiId) {
    const porApi = etiquetasComida.find(
      (etiqueta) => etiqueta.ordenCocinaId === orden.ordenCocinaApiId,
    )
    if (porApi && etiquetaPerteneceAFila(fila, porApi, orden)) return porApi
  }

  if (fila.ordenCocinaId) {
    const porOrdenCocina = etiquetasComida.find(
      (etiqueta) => etiqueta.ordenCocinaId === fila.ordenCocinaId,
    )
    if (
      porOrdenCocina &&
      etiquetaPerteneceAFila(fila, porOrdenCocina, orden)
    ) {
      return porOrdenCocina
    }
  }

  return undefined
}

export function resolverContextoFilaDieta(
  fila: FilaDieta,
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
): { orden?: OrdenCocina; etiqueta?: EtiquetaEnfermera } {
  const orden = resolverOrdenParaFila(fila, ordenes)
  const etiqueta = resolverEtiquetaParaFila(fila, orden, etiquetas)
  return { orden, etiqueta }
}
