import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  cargarConfigTiempos,
  type ConfigTiempos,
} from "@/modules/dietas-cocina/parametros/lib/configTiemposStorage"
import { formatearHora12 } from "@/modules/dietas-cocina/parametros/lib/formatoHora"
import {
  minutosDelDia,
  minutosDesdeHora24,
} from "@/modules/dietas-cocina/parametros/lib/horasOperativas"

export interface EstadoVentanaComida {
  ventanaTexto: string
  mensajeCierre: string
  ventanaAbierta: boolean
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

  if (config.activos[comida] === false) {
    return {
      ventanaTexto,
      mensajeCierre: "Turno inactivo",
      ventanaAbierta: false,
      variante: "muted",
    }
  }

  const cargaAnticipada = config.modoCarga === "todas-desde-manana"
  const dentroPeriodoOperativo = ahora >= inicio && ahora <= finDist
  const dentroVentanaCambios = ahora >= inicio && ahora <= finNovedades
  const ventanaAbierta = cargaAnticipada
    ? dentroPeriodoOperativo
    : dentroVentanaCambios

  if (ventanaAbierta) {
    const minutosHastaCierreCambios = finNovedades - ahora

    if (minutosHastaCierreCambios > 0) {
      return {
        ventanaTexto,
        mensajeCierre: `Cierre en: ${formatearMinutosRestantes(minutosHastaCierreCambios)}`,
        ventanaAbierta: true,
        variante: minutosHastaCierreCambios <= 15 ? "destructive" : "default",
      }
    }

    if (cargaAnticipada && ahora <= finDist) {
      return {
        ventanaTexto,
        mensajeCierre: `Solicitud abierta hasta ${formatearHora12(finDistHora)}`,
        ventanaAbierta: true,
        variante: "default",
      }
    }

    return {
      ventanaTexto,
      mensajeCierre: "Ventana de cambios cerrada",
      ventanaAbierta: false,
      variante: "destructive",
    }
  }

  if (ahora < inicio) {
    return {
      ventanaTexto,
      mensajeCierre: `Abre en: ${formatearMinutosRestantes(inicio - ahora)}`,
      ventanaAbierta: false,
      variante: "muted",
    }
  }

  return {
    ventanaTexto,
    mensajeCierre: "Ventana cerrada",
    ventanaAbierta: false,
    variante: "destructive",
  }
}

/** @deprecated Usar resolverEstadoVentanaComida().ventanaTexto */
export function obtenerVentanaComida(comida: TiempoComida): string {
  return resolverEstadoVentanaComida(comida).ventanaTexto
}
