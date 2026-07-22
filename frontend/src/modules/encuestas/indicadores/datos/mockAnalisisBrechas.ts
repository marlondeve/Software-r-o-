export type ContactoBrecha = "valido" | "na" | "invalido"
export type EstadoBrecha = "en_gestion" | "pendiente" | "justificado"

export type TonoMotivoBrecha = "neutro" | "negativo"

export interface FilaBrecha {
  id: string
  iniciales: string
  nombre: string
  documento: string
  fecha: string
  servicio: string
  convenio: string
  contacto: ContactoBrecha
  gestionNombre: string | null
  intentos: number
  motivo: string
  motivoTono: TonoMotivoBrecha
  estado: EstadoBrecha
}

export const mockAnalisisBrechas = {
  mes: "Octubre 2023",
  fuente: "Hosvital / SISMA",
  ultimaReconciliacion: "Hace 2 horas",
  kpis: {
    totalElegibles: 1240,
    encuestasRegistradas: 558,
    tendenciaEncuestas: "+12% vs mes anterior",
    sinEncuesta: 682,
    cobertura: 45,
    excluidos: 42,
    inconsistencias: 12,
  },
  totalRegistros: 682,
  filas: [
    {
      id: "1",
      iniciales: "MG",
      nombre: "Maria Gomez Fernandez",
      documento: "43.521.890",
      fecha: "12 Oct 2023",
      servicio: "Urgencias",
      convenio: "Sura EPS / PGP",
      contacto: "valido",
      gestionNombre: "Ana Lopez",
      intentos: 2,
      motivo: "Paciente no contactado",
      motivoTono: "neutro",
      estado: "en_gestion",
    },
    {
      id: "2",
      iniciales: "JP",
      nombre: "Juan Perez Castaño",
      documento: "1.023.456.789",
      fecha: "11 Oct 2023",
      servicio: "Consulta Externa",
      convenio: "Nueva EPS",
      contacto: "na",
      gestionNombre: null,
      intentos: 0,
      motivo: "Sin encuesta asociada",
      motivoTono: "negativo",
      estado: "pendiente",
    },
    {
      id: "3",
      iniciales: "CR",
      nombre: "Carlos Ramirez",
      documento: "71.234.567",
      fecha: "10 Oct 2023",
      servicio: "Hospitalización",
      convenio: "Coomeva EPS",
      contacto: "invalido",
      gestionNombre: "David Silva",
      intentos: 3,
      motivo: "Teléfono erróneo",
      motivoTono: "neutro",
      estado: "justificado",
    },
  ] satisfies FilaBrecha[],
}
