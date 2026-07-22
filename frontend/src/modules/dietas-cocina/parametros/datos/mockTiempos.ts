export type TiempoComida =
  | "desayuno"
  | "merienda-manana"
  | "almuerzo"
  | "merienda-tarde"
  | "cena"
  | "merienda-noche"

export interface HitoTiempo {
  id: string
  label: string
  /** Hora en formato 24 h (HH:mm) para inputs nativos */
  hora: string
}

export interface ParametrosTiempoComida {
  id: TiempoComida
  label: string
  activo: boolean
  hitos: HitoTiempo[]
  ventanaCambios: { inicio: string; fin: string; label: string }
}

export type ModoCargaAnticipada =
  | "todas-desde-manana"
  | "ventana-por-comida"

const hitosComidaPrincipal = (
  solicitud: string,
  novedades: string,
  llegada: string,
  inicioDist: string,
  finDist: string,
): HitoTiempo[] => [
  { id: "solicitud", label: "SOLICITUD ORDINARIA", hora: solicitud },
  { id: "novedades", label: "LÍMITE NOVEDADES", hora: novedades },
  { id: "llegada", label: "LLEGADA ESPERADA", hora: llegada },
  { id: "inicio-dist", label: "INICIO DISTRIBUCIÓN", hora: inicioDist },
  { id: "fin-dist", label: "FIN DISTRIBUCIÓN", hora: finDist },
]

export const mockParametrosTiempos = {
  zonaHoraria: "GMT-5 Bogotá",
  comidas: [
    {
      id: "desayuno" as TiempoComida,
      label: "Desayuno",
      activo: true,
      hitos: hitosComidaPrincipal("07:00", "07:30", "08:00", "08:15", "09:30"),
      ventanaCambios: {
        inicio: "07:00",
        fin: "07:30",
        label: "Ventana de cambios clínicos",
      },
    },
    {
      id: "merienda-manana" as TiempoComida,
      label: "Merienda de Media Mañana",
      activo: true,
      hitos: hitosComidaPrincipal("09:45", "10:00", "10:15", "10:30", "11:00"),
      ventanaCambios: {
        inicio: "09:45",
        fin: "10:00",
        label: "Ventana de cambios clínicos",
      },
    },
    {
      id: "almuerzo" as TiempoComida,
      label: "Almuerzo",
      activo: true,
      hitos: hitosComidaPrincipal("10:00", "10:30", "11:30", "12:00", "13:30"),
      ventanaCambios: {
        inicio: "10:00",
        fin: "10:30",
        label: "Ventana de cambios clínicos",
      },
    },
    {
      id: "merienda-tarde" as TiempoComida,
      label: "Merienda de Media Tarde",
      activo: true,
      hitos: hitosComidaPrincipal("14:00", "14:15", "14:30", "14:45", "15:15"),
      ventanaCambios: {
        inicio: "14:00",
        fin: "14:15",
        label: "Ventana de cambios clínicos",
      },
    },
    {
      id: "cena" as TiempoComida,
      label: "Cena",
      activo: true,
      hitos: hitosComidaPrincipal("15:00", "15:30", "17:00", "17:30", "19:00"),
      ventanaCambios: {
        inicio: "15:00",
        fin: "15:30",
        label: "Ventana de cambios clínicos",
      },
    },
    {
      id: "merienda-noche" as TiempoComida,
      label: "Merienda de Media Noche",
      activo: true,
      hitos: hitosComidaPrincipal("20:00", "20:15", "20:30", "20:45", "21:15"),
      ventanaCambios: {
        inicio: "20:00",
        fin: "20:15",
        label: "Ventana de cambios clínicos",
      },
    },
  ] satisfies ParametrosTiempoComida[],
  cargaAnticipada: {
    modo: "todas-desde-manana" as ModoCargaAnticipada,
    opciones: [
      {
        id: "todas-desde-manana" as ModoCargaAnticipada,
        titulo: "Permitir cargar todas las comidas del día desde la mañana",
        descripcion:
          "Las enfermeras podrán solicitar almuerzo y cena durante el desayuno.",
      },
      {
        id: "ventana-por-comida" as ModoCargaAnticipada,
        titulo: "Restringir cada comida a su ventana horaria",
        descripcion:
          "El sistema bloqueará solicitudes futuras hasta que inicie la ventana correspondiente.",
      },
    ],
    notaInformativa:
      "Restringir las solicitudes por tiempo puede reducir errores por altas médicas o cambios clínicos de último minuto.",
  },
  vistaPreviaEnfermeria: {
    pabellon: "Pabellón Central",
    comidaCerrada: "Almuerzo",
    proximaComida: "Cena",
    proximaHora: "15:00",
    botonSolicitar: "Solicitar Dieta",
    botonDeshabilitado: true,
  },
}
