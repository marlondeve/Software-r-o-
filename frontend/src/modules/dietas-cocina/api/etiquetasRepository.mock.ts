import { mockEtiquetas } from "@/modules/dietas-cocina/etiquetas/datos/mockEtiquetas"
import { crearEtiquetasEnfermeraIniciales } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"
import { buscarEtiquetaPorCodigo } from "@/modules/dietas-cocina/etiquetas/lib/buscarEtiquetaPorCodigo"
import type { EtiquetasRepository } from "@/modules/dietas-cocina/types/repositories"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"

const etiquetasMock: EtiquetaEnfermera[] = [
  ...mockEtiquetas.etiquetas.map((e) => ({
    ...e,
    estadoLogistica: "generada" as const,
  })),
  ...crearEtiquetasEnfermeraIniciales(),
]

export const etiquetasRepositoryMock: EtiquetasRepository = {
  async listar() {
    return etiquetasMock.map((e) => ({ ...e }))
  },
  async buscarPorCodigo(codigo) {
    const encontrada = buscarEtiquetaPorCodigo(etiquetasMock, codigo)
    if (!encontrada) throw new Error(`Etiqueta ${codigo} no encontrada`)
    return encontrada
  },
  async generar() {
    return etiquetasMock.slice(0, 2).map((e) => ({ ...e }))
  },
  async marcarImpresas(ids) {
    for (const id of ids) {
      const e = etiquetasMock.find((x) => x.id === id)
      if (e) {
        e.estado = "impresa"
        e.estadoLogistica = "impresa"
      }
    }
  },
  async marcarReimpresas(ids) {
    for (const id of ids) {
      const e = etiquetasMock.find((x) => x.id === id)
      if (e) e.estado = "reimpresa"
    }
  },
  async confirmarPreEntrega(id, recibidoPor) {
    const e = etiquetasMock.find((x) => x.id === id)
    if (!e) throw new Error("Etiqueta no encontrada")
    e.estadoLogistica = "pre_entregada"
    if (recibidoPor) e.recibidoPor = recibidoPor
    return { ...e }
  },
  async confirmarEntrega(id) {
    const e = etiquetasMock.find((x) => x.id === id)
    if (!e) throw new Error("Etiqueta no encontrada")
    e.estadoLogistica = "entregada"
    return { ...e }
  },
  async registrarDevolucion(id) {
    const e = etiquetasMock.find((x) => x.id === id)
    if (!e) throw new Error("Etiqueta no encontrada")
    e.estadoLogistica = "devuelta"
    return { ...e }
  },
  async subirFotoDevolucion() {},
  async descargarPdf() {
    return new Blob(["PDF demo"], { type: "application/pdf" })
  },
  async descargarPdfPrueba() {
    return new Blob(["PDF demo"], { type: "application/pdf" })
  },
}
