export type ResultadoAuditoria = "exito" | "denegado"

export type DetalleAuditoria =
  | { tipo: "texto"; texto: string }
  | { tipo: "diff"; antes: string; despues: string }

export interface FilaAuditoriaEncuesta {
  id: string
  idEvento: string
  fecha: string
  relativo: string
  usuarioNombre: string
  usuarioRol: string
  modulo: string
  accion: string
  accionAlerta?: boolean
  idRegistro: string
  idSecundario: string
  detalle: DetalleAuditoria
  resultado: ResultadoAuditoria
  origenIp: string
  origenDispositivo: string
}

export interface ContextoRelacionado {
  tipo: "encuesta" | "paciente"
  titulo: string
  subtitulo: string
}

export interface ModificacionRegla {
  valorAnterior: string
  valorNuevo: string
}

export interface DetalleAuditoriaExtendido {
  contexto: ContextoRelacionado[]
  modificacion?: ModificacionRegla
  motivo?: string
}

export const RANGOS_FECHA_AUDITORIA = [
  "Hoy (Últimas 24h)",
  "Últimos 7 días",
  "Últimos 30 días",
]

export const MODULOS_AUDITORIA = [
  "Encuestas",
  "Plantillas",
  "Seguridad",
  "Reportes",
  "Lógica",
]

export const ACCIONES_AUDITORIA = [
  "Creación",
  "Edición",
  "Eliminación",
  "Acceso denegado",
  "Exportación",
]

const detallesAuditoria: Record<string, DetalleAuditoriaExtendido> = {
  "1": {
    contexto: [
      {
        tipo: "encuesta",
        titulo: "Satisfacción - Urgencias",
        subtitulo: "ID: ENC-4402",
      },
      { tipo: "paciente", titulo: "Roberto Gómez", subtitulo: "Paciente" },
    ],
    motivo: "Anulación por error en recolección de datos.",
  },
  "2": {
    contexto: [
      {
        tipo: "encuesta",
        titulo: "Satisfacción - Hospitalización",
        subtitulo: "ID: PLT-889",
      },
    ],
    modificacion: { valorAnterior: "Requerido: No", valorNuevo: "Requerido: Sí" },
  },
  "3": {
    contexto: [
      { tipo: "paciente", titulo: "C. Ruiz", subtitulo: "Objetivo — Usuario USR-102" },
    ],
    motivo: "Intento de escalar privilegios a 'Admin' sin token válido.",
  },
  "4": {
    contexto: [],
    motivo: "Generación batch reporte diario nutrición (PDF, 2.4MB).",
  },
  "5": {
    contexto: [
      {
        tipo: "encuesta",
        titulo: "Encuesta de Adherencia (V2)",
        subtitulo: "ID: ENC-842",
      },
      { tipo: "paciente", titulo: "Carlos R. Gómez", subtitulo: "Habitación 302-A" },
    ],
    modificacion: {
      valorAnterior:
        'IF (paciente.dieta == "Líquida") {\n  allow_solid_supplements = true;\n}',
      valorNuevo:
        'IF (paciente.dieta == "Líquida") {\n  allow_solid_supplements = false;\n}',
    },
    motivo:
      "Corrección de regla clínica según nuevo protocolo de post-operatorio. Los pacientes con dieta líquida estricta no deben recibir suplementos sólidos bajo ninguna condición.",
  },
}

export const mockAuditoriaEncuestas = {
  totalRegistros: 1248,
  filas: [
    {
      id: "1",
      idEvento: "AUD-2023-1020",
      fecha: "14 Nov, 10:42:05",
      relativo: "hace 5 min",
      usuarioNombre: "Dr. M. Silva",
      usuarioRol: "Jefe Médico",
      modulo: "Encuestas",
      accion: "Encuesta Anulada",
      accionAlerta: true,
      idRegistro: "#ENC-4402",
      idSecundario: "Pac: Roberto Gómez",
      detalle: { tipo: "texto", texto: "Anulación por error en recolección de datos." },
      resultado: "exito",
      origenIp: "192.168.1.45",
      origenDispositivo: "iPad / Safari",
    },
    {
      id: "2",
      idEvento: "AUD-2023-1021",
      fecha: "14 Nov, 10:15:22",
      relativo: "hace 32 min",
      usuarioNombre: "A. Jiménez",
      usuarioRol: "Nutricionista",
      modulo: "Plantillas",
      accion: "Pregunta Editada",
      idRegistro: "#PLT-889",
      idSecundario: "-",
      detalle: { tipo: "diff", antes: "Requerido: No", despues: "Requerido: Sí" },
      resultado: "exito",
      origenIp: "10.0.4.22",
      origenDispositivo: "PC / Chrome",
    },
    {
      id: "3",
      idEvento: "AUD-2023-1022",
      fecha: "14 Nov, 09:44:10",
      relativo: "hace 1 hora",
      usuarioNombre: "E. Castro",
      usuarioRol: "Enfermería",
      modulo: "Seguridad",
      accion: "Modificación de Accesos",
      idRegistro: "#USR-102",
      idSecundario: "Objetivo: C. Ruiz",
      detalle: {
        tipo: "texto",
        texto: "Intento de escalar privilegios a 'Admin' sin token válido.",
      },
      resultado: "denegado",
      origenIp: "192.168.2.11",
      origenDispositivo: "Mobile / App",
    },
    {
      id: "4",
      idEvento: "AUD-2023-1023",
      fecha: "14 Nov, 08:30:00",
      relativo: "hace 2 horas",
      usuarioNombre: "Sistema",
      usuarioRol: "Automático",
      modulo: "Reportes",
      accion: "Exportación de Indicadores",
      idRegistro: "-",
      idSecundario: "-",
      detalle: {
        tipo: "texto",
        texto: "Generación batch reporte diario nutrición (PDF, 2.4MB)",
      },
      resultado: "exito",
      origenIp: "Localhost",
      origenDispositivo: "Cron Job",
    },
    {
      id: "5",
      idEvento: "AUD-2023-1024",
      fecha: "13 Nov, 16:20:15",
      relativo: "ayer",
      usuarioNombre: "Dr. M. Silva",
      usuarioRol: "Jefe Médico",
      modulo: "Lógica",
      accion: "Regla Condicional Modificada",
      idRegistro: "#RGL-005",
      idSecundario: "Plantilla Pediátrica",
      detalle: { tipo: "diff", antes: "If age < 12 show Q4", despues: "If age < 14 show Q4" },
      resultado: "exito",
      origenIp: "192.168.1.45",
      origenDispositivo: "PC / Firefox",
    },
  ] satisfies FilaAuditoriaEncuesta[],
  detalles: detallesAuditoria,
}
