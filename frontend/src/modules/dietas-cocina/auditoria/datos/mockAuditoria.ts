export type ResultadoAuditoria = "exitoso" | "fallido"

export type ModuloAuditoria =
  | "dietas"
  | "cocina"
  | "etiquetas"
  | "reportes"
  | "conciliacion"
  | "parametros"
  | "usuarios"
  | "inicio"

export interface CambioAuditoria {
  tipo: "diff" | "texto"
  lineas?: { prefijo: "-" | "+"; texto: string }[]
  texto?: string
}

export interface FilaAuditoria {
  id: string
  codigoAuditoria: string
  fechaHora: string
  usuario: {
    nombre: string
    rol: string
    iniciales: string
    esSistema?: boolean
  }
  modulo: ModuloAuditoria
  accion: string
  registroId: string
  cambios: CambioAuditoria
  resultado: ResultadoAuditoria
}

export interface EventoHistorialAuditoria {
  titulo: string
  tiempo: string
  actual?: boolean
}

export interface DetalleAuditoria {
  codigoAuditoria: string
  usuario: {
    nombre: string
    area: string
    iniciales: string
    esSistema?: boolean
  }
  fechaHora: string
  entidad: {
    etiqueta: string
    estado?: string
  }
  parametro?: string
  valorAnterior?: string
  valorNuevo?: string
  justificacion?: string
  impacto?: {
    riesgoClinico: string
    riesgoClinicoNivel: "alto" | "medio" | "bajo" | "ninguno"
    impactoTarifa: string
    impactoTarifaNivel: "ninguno" | "medio" | "alto"
  }
  metadatos: {
    ip: string
    dispositivo: string
    sistema: string
  }
  historial: EventoHistorialAuditoria[]
  mensajeError?: string
}

export const mockAuditoria = {
  total: 1245,
  pagina: { desde: 1, hasta: 3 },
  periodo: "Últimos 7 días",
  filtros: {
    modulo: "Todos",
    accion: "Todas",
    rol: "Todos",
    resultado: "Todos",
  },
  filas: [
    {
      id: "aud-1",
      codigoAuditoria: "AUD-2024-8842",
      fechaHora: "12 Oct 2023 14:32:45",
      usuario: {
        nombre: "Dra. María Rodríguez",
        rol: "Nutricionista Clínica",
        iniciales: "MR",
      },
      modulo: "dietas",
      accion: "Editar Prescripción",
      registroId: "DIET-8429",
      cambios: {
        tipo: "diff",
        lineas: [
          { prefijo: "-", texto: "Tipo: Basal" },
          { prefijo: "+", texto: "Tipo: Hiposódica Estricta" },
        ],
      },
      resultado: "exitoso",
    },
    {
      id: "aud-2",
      codigoAuditoria: "AUD-2024-8831",
      fechaHora: "12 Oct 2023 11:15:02",
      usuario: {
        nombre: "Admin Sistemas",
        rol: "Administrador TI",
        iniciales: "AS",
      },
      modulo: "usuarios",
      accion: "Desactivar usuario",
      registroId: "USR-1044",
      cambios: {
        tipo: "texto",
        texto:
          "Intento de desactivar usuario con dietas activas vinculadas en el módulo.",
      },
      resultado: "fallido",
    },
    {
      id: "aud-3",
      codigoAuditoria: "AUD-2024-8820",
      fechaHora: "11 Oct 2023 23:59:59",
      usuario: {
        nombre: "Sistema",
        rol: "Cron Job",
        iniciales: "SYS",
        esSistema: true,
      },
      modulo: "cocina",
      accion: "Generar Comandas",
      registroId: "BATCH-9921",
      cambios: {
        tipo: "diff",
        lineas: [{ prefijo: "+", texto: "Generadas: 142 comandas (Almuerzo)" }],
      },
      resultado: "exitoso",
    },
    {
      id: "aud-4",
      codigoAuditoria: "AUD-2024-8815",
      fechaHora: "11 Oct 2023 16:20:11",
      usuario: {
        nombre: "Operador Logística",
        rol: "Proveedor",
        iniciales: "OL",
      },
      modulo: "conciliacion",
      accion: "Marcar conciliado",
      registroId: "CONC-2201",
      cambios: {
        tipo: "texto",
        texto: "Conciliación manual validada para Líquida Clara - Desayuno.",
      },
      resultado: "exitoso",
    },
    {
      id: "aud-5",
      codigoAuditoria: "AUD-2024-8802",
      fechaHora: "11 Oct 2023 09:05:33",
      usuario: {
        nombre: "Enf. Laura Méndez",
        rol: "Enfermera",
        iniciales: "LM",
      },
      modulo: "dietas",
      accion: "Confirmar dieta",
      registroId: "DIET-8390",
      cambios: {
        tipo: "diff",
        lineas: [
          { prefijo: "-", texto: "Estado: Borrador" },
          { prefijo: "+", texto: "Estado: Confirmada" },
        ],
      },
      resultado: "exitoso",
    },
  ] satisfies FilaAuditoria[],
  detalles: {
    "aud-1": {
      codigoAuditoria: "AUD-2024-8842",
      usuario: {
        nombre: "Dra. María Rodríguez",
        area: "Nutrición Clínica",
        iniciales: "MR",
      },
      fechaHora: "12 Oct 2023 14:32:45",
      entidad: {
        etiqueta: "Dieta Paciente #1042-B",
        estado: "Confirmada",
      },
      parametro: "Tipo de Dieta Base",
      valorAnterior: "Dieta Basal Estándar",
      valorNuevo: "Hiposódica Estricta",
      justificacion:
        "Paciente presentó pico de presión arterial (160/95) en control matutino. Se requiere restricción de sodio inmediata según protocolo de guardia.",
      impacto: {
        riesgoClinico: "Alto",
        riesgoClinicoNivel: "alto",
        impactoTarifa: "Sin cambio",
        impactoTarifaNivel: "ninguno",
      },
      metadatos: {
        ip: "192.168.14.82",
        dispositivo: "Desktop / Chrome 114",
        sistema: "Módulo Dietas y Cocina v2.1",
      },
      historial: [
        {
          titulo: "Modificación de Dieta",
          tiempo: "Hace unos segundos",
          actual: true,
        },
        {
          titulo: "Lectura de signos vitales",
          tiempo: "Hace 3 horas",
        },
        {
          titulo: "Ingreso y asignación basal",
          tiempo: "Ayer",
        },
      ],
    },
    "aud-2": {
      codigoAuditoria: "AUD-2024-8831",
      usuario: {
        nombre: "Admin Sistemas",
        area: "Administración TI",
        iniciales: "AS",
      },
      fechaHora: "12 Oct 2023 11:15:02",
      entidad: {
        etiqueta: "Usuario USR-1044 — Operador Logística",
      },
      justificacion:
        "Solicitud de desactivación por rotación de personal del proveedor.",
      metadatos: {
        ip: "192.168.10.15",
        dispositivo: "Desktop / Edge 118",
        sistema: "Módulo Dietas y Cocina v2.1",
      },
      historial: [
        {
          titulo: "Intento de desactivación",
          tiempo: "Hace unos segundos",
          actual: true,
        },
        {
          titulo: "Consulta de permisos",
          tiempo: "Hace 2 minutos",
        },
      ],
      mensajeError:
        "No se puede desactivar el usuario porque tiene 3 dietas activas asignadas en el servicio de Cocina Externa.",
    },
    "aud-3": {
      codigoAuditoria: "AUD-2024-8820",
      usuario: {
        nombre: "Sistema",
        area: "Proceso automático",
        iniciales: "SYS",
        esSistema: true,
      },
      fechaHora: "11 Oct 2023 23:59:59",
      entidad: {
        etiqueta: "Lote de comandas — Almuerzo",
        estado: "Completado",
      },
      parametro: "Generación batch",
      valorAnterior: "0 comandas",
      valorNuevo: "142 comandas generadas",
      metadatos: {
        ip: "127.0.0.1",
        dispositivo: "Servidor / Cron",
        sistema: "Módulo Dietas y Cocina v2.1",
      },
      historial: [
        {
          titulo: "Generación de comandas",
          tiempo: "23:59:59",
          actual: true,
        },
        {
          titulo: "Cierre de periodo Almuerzo",
          tiempo: "23:55:00",
        },
      ],
    },
    "aud-4": {
      codigoAuditoria: "AUD-2024-8815",
      usuario: {
        nombre: "Operador Logística",
        area: "Proveedor — Cocina Externa",
        iniciales: "OL",
      },
      fechaHora: "11 Oct 2023 16:20:11",
      entidad: {
        etiqueta: "Conciliación CONC-2201 — Líquida Clara",
        estado: "Conciliado",
      },
      justificacion:
        "Diferencia validada con el proveedor; se ajustó cantidad facturada según registro del sistema.",
      impacto: {
        riesgoClinico: "Ninguno",
        riesgoClinicoNivel: "ninguno",
        impactoTarifa: "Medio",
        impactoTarifaNivel: "medio",
      },
      metadatos: {
        ip: "192.168.20.44",
        dispositivo: "Desktop / Chrome 114",
        sistema: "Módulo Dietas y Cocina v2.1",
      },
      historial: [
        {
          titulo: "Marcar como conciliado",
          tiempo: "Hace unos segundos",
          actual: true,
        },
        {
          titulo: "Revisión de diferencia",
          tiempo: "Hace 15 minutos",
        },
      ],
    },
    "aud-5": {
      codigoAuditoria: "AUD-2024-8802",
      usuario: {
        nombre: "Enf. Laura Méndez",
        area: "Enfermera — Piso 3",
        iniciales: "LM",
      },
      fechaHora: "11 Oct 2023 09:05:33",
      entidad: {
        etiqueta: "Dieta Paciente #8390-A",
        estado: "Confirmada",
      },
      parametro: "Estado de la dieta",
      valorAnterior: "Borrador",
      valorNuevo: "Confirmada",
      justificacion:
        "Dieta revisada en piso y confirmada para el servicio de almuerzo.",
      impacto: {
        riesgoClinico: "Bajo",
        riesgoClinicoNivel: "bajo",
        impactoTarifa: "Sin cambio",
        impactoTarifaNivel: "ninguno",
      },
      metadatos: {
        ip: "192.168.18.21",
        dispositivo: "Tablet / Safari 16",
        sistema: "Módulo Dietas y Cocina v2.1",
      },
      historial: [
        {
          titulo: "Confirmación de dieta",
          tiempo: "Hace unos segundos",
          actual: true,
        },
        {
          titulo: "Solicitud desde piso",
          tiempo: "Hace 20 minutos",
        },
      ],
    },
  } satisfies Record<string, DetalleAuditoria>,
}
