import type { ConfigTiempos, ParametrosTiempoComida } from "@/modules/dietas-cocina/types/parameters"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import {
  minutosDelDia,
  minutosDesdeHora24,
} from "@/modules/dietas-cocina/parametros/lib/horasOperativas"

export interface VistaPreviaEnfermeriaEstado {
  pabellon: string
  comidaCerrada: string
  proximaComida: string
  proximaHora: string
  botonSolicitar: string
  botonDeshabilitado: boolean
  ventanaAbierta?: boolean
  mensajeVentanaAbierta?: string
}

function horaConfig(
  config: ConfigTiempos,
  comidaId: TiempoComida,
  hitoId: string,
  fallback: string,
): string {
  return config.horasPorComida[comidaId]?.[hitoId] ?? fallback
}

function comidasActivas(
  comidas: ParametrosTiempoComida[],
  config: ConfigTiempos,
): ParametrosTiempoComida[] {
  const activos = config.activos ?? {}
  return comidas.filter((comida) => activos[comida.id] !== false)
}

function resolverComidaOperativa(
  comidas: ParametrosTiempoComida[],
  config: ConfigTiempos,
  fecha: Date,
): TiempoComida {
  const ahora = minutosDelDia(fecha)
  const activas = comidasActivas(comidas, config)

  const enCurso = activas.find((comida) => {
    const inicio = minutosDesdeHora24(horaConfig(config, comida.id, "solicitud", "00:00"))
    const fin = minutosDesdeHora24(horaConfig(config, comida.id, "fin-dist", "23:59"))
    return ahora >= inicio && ahora <= fin
  })
  if (enCurso) return enCurso.id

  const siguiente = activas.find((comida) => {
    const inicio = minutosDesdeHora24(horaConfig(config, comida.id, "solicitud", "00:00"))
    return ahora < inicio
  })
  if (siguiente) return siguiente.id

  return activas[activas.length - 1]?.id ?? "almuerzo"
}

function resolverProximaVentana(
  comidas: ParametrosTiempoComida[],
  config: ConfigTiempos,
  fecha: Date,
): { id: TiempoComida; hora: string } | null {
  const ahora = minutosDelDia(fecha)
  const activas = comidasActivas(comidas, config)

  let proxima: { id: TiempoComida; minutos: number; hora: string } | null = null

  for (const comida of activas) {
    const solicitud = horaConfig(config, comida.id, "solicitud", "07:00")
    const minutos = minutosDesdeHora24(solicitud)
    if (minutos <= ahora) continue
    if (!proxima || minutos < proxima.minutos) {
      proxima = { id: comida.id, minutos, hora: solicitud }
    }
  }

  if (proxima) return { id: proxima.id, hora: proxima.hora }

  const primera = activas[0]
  if (!primera) return null
  return {
    id: primera.id,
    hora: horaConfig(config, primera.id, "solicitud", "07:00"),
  }
}

function estaEnVentanaSolicitud(
  comidaId: TiempoComida,
  config: ConfigTiempos,
  ahora: number,
): boolean {
  const inicio = minutosDesdeHora24(horaConfig(config, comidaId, "solicitud", "00:00"))
  const fin = minutosDesdeHora24(horaConfig(config, comidaId, "novedades", "23:59"))
  return ahora >= inicio && ahora <= fin
}

export function resolverVistaPreviaEnfermeria(
  comidas: ParametrosTiempoComida[],
  config: ConfigTiempos,
  fecha = new Date(),
  pabellon = "Pabellón Central",
): VistaPreviaEnfermeriaEstado {
  const ahora = minutosDelDia(fecha)
  const activas = comidasActivas(comidas, config)
  const comidaOperativa = resolverComidaOperativa(comidas, config, fecha)
  const labelOperativa =
    comidas.find((item) => item.id === comidaOperativa)?.label ?? "Almuerzo"

  if (config.modoCarga === "todas-desde-manana") {
    const comidaAbierta = activas.find((comida) => {
      const inicio = minutosDesdeHora24(horaConfig(config, comida.id, "solicitud", "00:00"))
      const fin = minutosDesdeHora24(horaConfig(config, comida.id, "fin-dist", "23:59"))
      return ahora >= inicio && ahora <= fin
    })

    if (comidaAbierta) {
      return {
        pabellon,
        comidaCerrada: labelOperativa,
        proximaComida: comidaAbierta.label,
        proximaHora: horaConfig(config, comidaAbierta.id, "solicitud", "07:00"),
        botonSolicitar: "Solicitar Dieta",
        botonDeshabilitado: false,
        ventanaAbierta: true,
        mensajeVentanaAbierta: `Carga anticipada activa. Puedes solicitar ${comidaAbierta.label.toLowerCase()} en este turno.`,
      }
    }
  }

  if (estaEnVentanaSolicitud(comidaOperativa, config, ahora)) {
    return {
      pabellon,
      comidaCerrada: labelOperativa,
      proximaComida: labelOperativa,
      proximaHora: horaConfig(config, comidaOperativa, "solicitud", "07:00"),
      botonSolicitar: "Solicitar Dieta",
      botonDeshabilitado: false,
      ventanaAbierta: true,
      mensajeVentanaAbierta: `Ventana abierta para ${labelOperativa.toLowerCase()}.`,
    }
  }

  const proxima = resolverProximaVentana(comidas, config, fecha)
  const comidaCerrada = activas.find((comida) => {
    const fin = minutosDesdeHora24(horaConfig(config, comida.id, "novedades", "00:00"))
    return ahora > fin
  })

  return {
    pabellon,
    comidaCerrada: comidaCerrada?.label ?? labelOperativa,
    proximaComida:
      comidas.find((item) => item.id === proxima?.id)?.label ??
      activas[0]?.label ??
      "Desayuno",
    proximaHora: proxima?.hora ?? "07:00",
    botonSolicitar: "Solicitar Dieta",
    botonDeshabilitado: true,
  }
}
