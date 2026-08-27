import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  cargarConfigTiempos,
  type ConfigTiempos,
} from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import {
  estaEnRangoHorario,
  minutosDelDia,
  minutosDesdeHora24,
  minutosHastaHora,
} from "@/modules/dietas-cocina/parametros/lib/horasOperativas"

export interface EstadoVentanaComida {
  ventanaTexto: string
  mensajeCierre: string
  ventanaAbierta: boolean
  /**
   * Límite de novedades estricto: ignora la carga anticipada porque ese modo extiende
   * la solicitud, no el momento en que cocina empieza a producir.
   */
  ventanaNovedadesAbierta: boolean
  /** Hora del límite de novedades en formato 12 h. */
  horaLimiteNovedades: string
  variante: "destructive" | "muted" | "default"
}

function horaConfig(
  config: ConfigTiempos,
  comida: TiempoComida,
  hito: string,
  fallback: string,
): string {
  return config.horasPorComida[comida]?.[hito] ?? fallback
}

function formatearMinutosRestantes(minutos: number): string {
  const total = Math.max(0, Math.round(minutos))
  if (total >= 60) {
    const horas = Math.floor(total / 60)
    const mins = total % 60
    return mins > 0 ? `${horas}h ${mins} min` : `${horas}h`
  }
  return `${total} min`
}

export function resolverEstadoVentanaComida(
  comida: TiempoComida,
  fecha = new Date(),
  config: ConfigTiempos = cargarConfigTiempos(),
): EstadoVentanaComida {
  const ahora = minutosDelDia(fecha)
  const inicioHora = horaConfig(config, comida, "solicitud", "07:00")
  const finNovedadesHora = horaConfig(config, comida, "novedades", "08:00")
  const finDistHora = horaConfig(config, comida, "fin-dist", "23:59")

  const inicio = minutosDesdeHora24(inicioHora)
  const finNovedades = minutosDesdeHora24(finNovedadesHora)
  const finDist = minutosDesdeHora24(finDistHora)

  const ventanaTexto = `${formatearHora12(inicioHora)} - ${formatearHora12(finNovedadesHora)}`
  const horaLimiteNovedades = formatearHora12(finNovedadesHora)
  const turnoActivo = config.activos[comida] !== false
  const dentroVentanaCambios = estaEnRangoHorario(ahora, inicio, finNovedades)

  const armar = (
    mensajeCierre: string,
    ventanaAbierta: boolean,
    variante: EstadoVentanaComida["variante"],
  ): EstadoVentanaComida => ({
    ventanaTexto,
    mensajeCierre,
    ventanaAbierta,
    ventanaNovedadesAbierta: turnoActivo && dentroVentanaCambios,
    horaLimiteNovedades,
    variante,
  })

  if (!turnoActivo) {
    return armar("Turno inactivo", false, "muted")
  }

  const cargaAnticipada = config.modoCarga === "todas-desde-manana"
  const dentroPeriodoOperativo = estaEnRangoHorario(ahora, inicio, finDist)
  const ventanaAbierta = cargaAnticipada
    ? dentroPeriodoOperativo
    : dentroVentanaCambios

  if (ventanaAbierta) {
    const minutosHastaCierreCambios = minutosHastaHora(ahora, finNovedades)

    // Si fin < inicio (cruza medianoche) y estamos antes del fin, el cierre es hoy.
    // minutosHastaHora ya contempla el wrap al día siguiente.
    if (minutosHastaCierreCambios > 0 && minutosHastaCierreCambios < 24 * 60) {
      // Evitar mostrar "Cierre en: 23h…" cuando ya pasó el fin de novedades
      // en modo carga anticipada pero aún hay distribución.
      if (!cargaAnticipada || minutosHastaCierreCambios <= 12 * 60) {
        return armar(
          `Cierre en: ${formatearMinutosRestantes(minutosHastaCierreCambios)}`,
          true,
          minutosHastaCierreCambios <= 15 ? "destructive" : "default",
        )
      }
    }

    if (cargaAnticipada && dentroPeriodoOperativo) {
      return armar(
        `Solicitud abierta hasta ${formatearHora12(finDistHora)}`,
        true,
        "default",
      )
    }

    return armar("Ventana de cambios cerrada", false, "destructive")
  }

  if (!dentroVentanaCambios) {
    // Ventana normal (mismo día): distingue "aún no abre" vs "ya cerró hoy".
    if (inicio <= finNovedades) {
      if (ahora > finNovedades) {
        return armar(
          `Ventana cerrada (cerró a las ${horaLimiteNovedades})`,
          false,
          "destructive",
        )
      }

      return armar(
        `Abre en: ${formatearMinutosRestantes(inicio - ahora)}`,
        false,
        "muted",
      )
    }

    // Ventana que cruza medianoche: entre cierre matutino y apertura vespertina.
    if (ahora > finNovedades && ahora < inicio) {
      return armar(
        `Abre en: ${formatearMinutosRestantes(inicio - ahora)}`,
        false,
        "muted",
      )
    }

    return armar(
      `Abre en: ${formatearMinutosRestantes(minutosHastaHora(ahora, inicio))}`,
      false,
      "muted",
    )
  }

  return armar("Ventana cerrada", false, "destructive")
}

/** @deprecated Usar resolverEstadoVentanaComida().ventanaTexto */
export function obtenerVentanaComida(comida: TiempoComida): string {
  return resolverEstadoVentanaComida(comida).ventanaTexto
}
