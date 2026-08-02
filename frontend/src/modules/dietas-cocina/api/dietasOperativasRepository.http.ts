import { normalizarTiempoComidaTarifa } from "@/modules/dietas-cocina/dietas-tarifas/lib/tarifasPorComida"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  cancelarDieta,
  confirmarDieta,
  confirmarDietasMasivo,
  guardarSolicitudDieta,
  obtenerCatalogoDietas,
  obtenerDetalleDieta,
  obtenerHistorialDieta,
  registrarNovedadDieta,
} from "@/modules/dietas-cocina/api/services/dietas.service"
import { sincronizarFilasDesdeCensoApi } from "@/modules/dietas-cocina/api/services/censo-dietas.service"
import type { DietasOperativasRepository } from "@/modules/dietas-cocina/types/repositories"
import { mapCancelarToRequest, type DatosSolicitudDietaInput } from "@/modules/dietas-cocina/api/mappers"

export const dietasOperativasRepositoryHttp: DietasOperativasRepository = {
  async obtenerCenso(_fecha, comida) {
    const { filas } = await sincronizarFilasDesdeCensoApi(comida, [])
    return { filas }
  },
  obtenerDetalle: obtenerDetalleDieta,
  obtenerHistorial: obtenerHistorialDieta,
  guardarSolicitud: guardarSolicitudDieta,
  confirmar: confirmarDieta,
  async confirmarMasivo(ids, usuario) {
    await confirmarDietasMasivo(ids, usuario)
  },
  async cancelar(id, payload) {
    return cancelarDieta(
      id,
      mapCancelarToRequest(
        payload.motivo,
        payload.justificacion,
        payload.aceptaFacturacion,
        payload.rolUsuario,
      ),
    )
  },
  async registrarNovedad(id, payload) {
    return registrarNovedadDieta(id, payload as unknown as Record<string, unknown>)
  },
  async obtenerCatalogo() {
    const items = await obtenerCatalogoDietas()
    return items
      .filter((item) => {
        const registro = item as Record<string, unknown>
        const activa = registro.activa ?? registro.Activa
        return activa !== false
      })
      .map((item) => {
        const registro = item as Record<string, unknown>
        const tarifasRaw =
          registro.tarifasVigentes ?? registro.TarifasVigentes
        const tarifasVigentes: Partial<Record<TiempoComida, number>> = {}

        if (tarifasRaw && typeof tarifasRaw === "object") {
          for (const [clave, monto] of Object.entries(
            tarifasRaw as Record<string, unknown>,
          )) {
            const valor = Number(monto)
            if (valor > 0) {
              tarifasVigentes[normalizarTiempoComidaTarifa(clave)] = valor
            }
          }
        }

        return {
          id: String(item.id ?? item.codigo ?? ""),
          nombre: String(item.nombre ?? item.codigo ?? ""),
          descripcion: item.descripcion,
          tarifasVigentes,
        }
      })
  },
}

export type { DatosSolicitudDietaInput }
