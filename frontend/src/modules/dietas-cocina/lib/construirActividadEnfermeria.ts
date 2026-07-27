import type { OrdenCocina } from "@/modules/dietas-cocina/types/kitchen"
import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { EtiquetaEnfermera } from "@/modules/dietas-cocina/types/labels"
import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import { estadoDietaDesdeCiclo } from "@/modules/dietas-cocina/lib/mapearEstadoDietaOrden"
import {
  filtrarEtiquetasDelPeriodoOperativo,
  resolverContextoFilaDieta,
} from "@/modules/dietas-cocina/lib/resolverOrdenEtiquetaFila"
import { formatearHoraDesdeFecha } from "@/modules/dietas-cocina/parametros/lib/formatoHora"

export interface ActividadEnfermeriaFila {
  paciente: string
  accion: string
  hora: string
  estado: EstadoDieta
}

function parseSolicitadoEnMs(valor?: string): number {
  if (!valor?.trim()) return 0
  const parsed = Date.parse(valor.trim())
  return Number.isNaN(parsed) ? 0 : parsed
}

function horaActividadDesdeTexto(valor?: string): string {
  if (!valor?.trim()) return "—"
  const parsed = Date.parse(valor.trim())
  if (!Number.isNaN(parsed)) {
    return formatearHoraDesdeFecha(new Date(parsed))
  }
  const match = valor.match(/(\d{1,2}:\d{2}\s*(?:a\.\s*m\.|p\.\s*m\.)?)/i)
  return match?.[1] ?? "—"
}

export function accionDesdeEstadoEnfermeria(estado: EstadoDieta): string {
  switch (estado) {
    case "no-solicitada":
      return "Sin solicitud"
    case "guardado":
      return "Solicitud nueva"
    case "confirmada":
      return "Confirmación de dieta"
    case "cancelada":
      return "Cancelación"
    case "recibida":
      return "Entrega confirmada"
    case "devuelta":
      return "Devolución registrada"
    case "recogida":
      return "Recogida de bandeja"
    default:
      return "Actualización clínica"
  }
}

export function etiquetaAccionDesdeTipoEvento(
  tipo: string,
  descripcion?: string,
): string {
  const texto = descripcion?.trim()
  if (texto) return texto

  const mapa: Record<string, string> = {
    pre_entrega_confirmada: "Etiqueta recibida en pabellón",
    entrega_confirmada: "Dieta entregada al paciente",
    devolucion_registrada: "Dieta devuelta",
    solicitud_guardada: "Solicitud guardada",
    dieta_confirmada: "Dieta confirmada",
    novedad: "Novedad clínica",
    cancelacion: "Cancelación de dieta",
  }
  return mapa[tipo.toLowerCase()] ?? tipo.replace(/_/g, " ")
}

export function actividadApiPareceEnfermeria(
  items: ActividadEnfermeriaFila[],
): boolean {
  if (items.length === 0) return false
  return !items.some(
    (item) =>
      /orden\s*#|etiqueta\s+ETQ|orden_/i.test(item.accion) ||
      /^orden /i.test(item.accion),
  )
}

export function construirActividadRecienteEnfermeria(
  filas: FilaDieta[],
  ordenes: OrdenCocina[],
  etiquetas: EtiquetaEnfermera[],
  comida: TiempoComida,
  limite = 8,
): ActividadEnfermeriaFila[] {
  const etiquetasPeriodo = filtrarEtiquetasDelPeriodoOperativo(etiquetas, {
    comida,
  })

  let filasComida = filas.filter((f) => f.comida === comida)
  if (filasComida.length === 0 && filas.length > 0) {
    filasComida = filas
  }

  return filasComida
    .map((fila) => {
      const { orden, etiqueta } = resolverContextoFilaDieta(
        fila,
        ordenes,
        etiquetasPeriodo,
      )
      const estado = estadoDietaDesdeCiclo(fila, orden, etiqueta)
      return {
        paciente: `${fila.habitacion} / ${fila.paciente}`,
        accion: accionDesdeEstadoEnfermeria(estado),
        hora: horaActividadDesdeTexto(fila.solicitadoEn),
        estado,
        _ms: parseSolicitadoEnMs(fila.solicitadoEn),
      }
    })
    .filter((item) => item.estado !== "no-solicitada" || item._ms > 0)
    .sort((a, b) => b._ms - a._ms)
    .slice(0, limite)
    .map(({ _ms: _omitido, ...resto }) => resto)
}
