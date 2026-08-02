import { mockDietas, MOCK_CATALOGO_DIETAS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { obtenerTrazabilidad } from "@/modules/dietas-cocina/dietas/datos/mockDetalleDieta"
import type { DatosSolicitudDietaInput } from "@/modules/dietas-cocina/api/mappers"
import type { DietasOperativasRepository } from "@/modules/dietas-cocina/types/repositories"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { censoRepositoryMock } from "@/modules/dietas-cocina/api/censoRepository.mock"

function filasMock(comida?: TiempoComida): FilaDieta[] {
  const base = mockDietas.filas.map((f) => ({ ...f }))
  return comida ? base.filter((f) => f.comida === comida) : base
}

export const dietasOperativasRepositoryMock: DietasOperativasRepository = {
  async obtenerCenso(_fecha, comida) {
    const candidatos = await censoRepositoryMock.obtenerPacientesHospitalizados(comida)
    const existentes = filasMock(comida)
    const nuevos = candidatos.map((c, i) => ({
      ...c,
      id: `censo-mock-${Date.now()}-${i}`,
    }))
    return { filas: [...existentes, ...nuevos] }
  },
  async obtenerDetalle(id) {
    const fila = mockDietas.filas.find((f) => f.id === id)
    if (!fila) throw new Error("Dieta no encontrada")
    return { ...fila }
  },
  async obtenerHistorial(id) {
    return obtenerTrazabilidad(id)
  },
  async guardarSolicitud(id, datos: DatosSolicitudDietaInput) {
    const fila = mockDietas.filas.find((f) => f.id === id)
    if (!fila) throw new Error("Dieta no encontrada")
    return {
      ...fila,
      tipoDieta: datos.tipoDieta,
      consistencia: datos.consistencia,
      observaciones: datos.observaciones ?? fila.observaciones,
      aislado: datos.pacienteAislado ?? false,
      aislamiento: datos.pacienteAislado ? "Contacto" : "Ninguno",
      alergico: datos.alergico ?? false,
      alergias: datos.alergico ? (datos.alergias ?? "") : "",
      observacionAislamiento: datos.observacionAislamiento ?? fila.observacionAislamiento,
      estado: "guardado" as const,
    }
  },
  async confirmar(id) {
    const fila = mockDietas.filas.find((f) => f.id === id)
    if (!fila) throw new Error("Dieta no encontrada")
    return { ...fila, estado: "confirmada" as const, ordenCocinaId: `ord-mock-${id}` }
  },
  async confirmarMasivo() {},
  async cancelar(id, payload) {
    const fila = mockDietas.filas.find((f) => f.id === id)
    if (!fila) throw new Error("Dieta no encontrada")
    return {
      ...fila,
      estado: "cancelada" as const,
      observaciones: `[${payload.motivo}] ${payload.justificacion}`,
    }
  },
  async registrarNovedad(id, payload) {
    const fila = mockDietas.filas.find((f) => f.id === id)
    if (!fila) throw new Error("Dieta no encontrada")
    return { ...fila, ...payload, estado: "confirmada" as const }
  },
  async obtenerCatalogo() {
    return MOCK_CATALOGO_DIETAS.map((item) => ({ ...item }))
  },
}
