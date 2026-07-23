import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import type { EstadoLogisticaEtiqueta } from "@/modules/dietas-cocina/etiquetas/datos/mockEntregasEnfermera"

export type EstadoCocina =
  | "por_iniciar"
  | "en_preparacion"
  | "lista"
  | "despachada"
  | "cancelada"

export interface ChecklistItem {
  id: string
  label: string
  obligatorio: boolean
  completado: boolean
}

export interface OrdenCocina {
  id: string
  etiquetaId?: string
  pacienteId: string
  paciente: string
  edad: number
  pabellon: string
  habitacion: string
  cama?: string
  tipoDieta: string
  consistencia: string
  comida: TiempoComida
  aislado: boolean
  alergias: string[]
  observaciones: string
  estadoCocina: EstadoCocina
  estadoLogistica?: EstadoLogisticaEtiqueta
  etiquetaImpresa: boolean
  etiquetaGenerada: boolean
  checklist: ChecklistItem[]
}

export interface KpiCocina {
  id: string
  label: string
  value: number
  variant?: "default" | "info" | "success" | "destructive" | "warning" | "muted"
}

const checklistBase: ChecklistItem[] = [
  { id: "ck-1", label: "Receta revisada", obligatorio: false, completado: true },
  {
    id: "ck-2",
    label: "Alergias revisadas",
    obligatorio: true,
    completado: false,
  },
  {
    id: "ck-3",
    label: "Aislamiento identificado",
    obligatorio: true,
    completado: false,
  },
  { id: "ck-4", label: "Porción verificada", obligatorio: false, completado: false },
]

function checklistCompleto(): ChecklistItem[] {
  return checklistBase.map((item) => ({ ...item, completado: true }))
}

function checklistEnPreparacion(
  opts: { alergiasRevisadas?: boolean; aislamientoIdentificado?: boolean } = {},
): ChecklistItem[] {
  return checklistBase.map((item) => {
    if (item.id === "ck-2") {
      return { ...item, completado: opts.alergiasRevisadas ?? false }
    }
    if (item.id === "ck-3") {
      return { ...item, completado: opts.aislamientoIdentificado ?? false }
    }
    if (item.id === "ck-1") {
      return { ...item, completado: true }
    }
    return { ...item, completado: false }
  })
}

function crearOrden(
  id: string,
  overrides: Partial<OrdenCocina> & Pick<OrdenCocina, "paciente" | "pacienteId">,
): OrdenCocina {
  return {
    id,
    edad: 55,
    pabellon: "Pab Sur",
    habitacion: "204B",
    tipoDieta: "HIPOSÓDICA",
    consistencia: "Blanda",
    comida: "almuerzo",
    aislado: false,
    alergias: [],
    observaciones: "",
    estadoCocina: "por_iniciar",
    etiquetaImpresa: false,
    etiquetaGenerada: false,
    checklist: checklistBase.map((c) => ({ ...c })),
    ...overrides,
  }
}

export const mockCocina = {
  fechaReferencia: "Martes, 24 de Octubre 2023",
  horaActualizacion: "11:42 AM",
  comidaActiva: "almuerzo" as TiempoComida,
  pabellones: ["Todos", "Pab Sur", "Pab Central", "Pab Norte"],
  habitaciones: ["Todas", "204B", "301-A", "112-C", "402"],
  tiposDieta: ["Todos", "HIPOSÓDICA", "BLANDA", "DIABÉTICA", "PROTEICA", "NORMAL"],
  consistencias: ["Todas", "Blanda", "Normal", "Papilla"],
  estadosCocina: ["Todos", "por_iniciar", "en_preparacion", "lista", "despachada"],
  ordenes: [
    crearOrden("ord-1", {
      etiquetaId: "etq-1",
      paciente: "GARCÍA PÉREZ, MARÍA",
      pacienteId: "4892-A",
      edad: 64,
      habitacion: "204B",
      tipoDieta: "HIPOSÓDICA",
      consistencia: "Blanda",
      aislado: true,
      observaciones: "Sin sal añadida en la preparación.",
      estadoCocina: "lista",
      etiquetaGenerada: true,
      etiquetaImpresa: false,
      checklist: checklistCompleto(),
    }),
    crearOrden("ord-2", {
      paciente: "TORRES, ELENA",
      pacienteId: "4893-B",
      edad: 72,
      habitacion: "301-A",
      pabellon: "Pab Central",
      cama: "Cama A",
      tipoDieta: "DIABÉTICA",
      consistencia: "Normal",
      alergias: ["Frutos secos"],
      observaciones: "Sin azúcar añadida.",
      estadoCocina: "por_iniciar",
    }),
    crearOrden("ord-3", {
      etiquetaId: "etq-4",
      paciente: "LOPEZ, ANA",
      pacienteId: "4895-D",
      edad: 51,
      habitacion: "204B",
      tipoDieta: "HIPOSÓDICA",
      estadoCocina: "lista",
      etiquetaGenerada: true,
      etiquetaImpresa: true,
      estadoLogistica: "impresa",
      checklist: checklistCompleto(),
    }),
    crearOrden("ord-4", {
      etiquetaId: "etq-5",
      paciente: "MARTÍNEZ, CARLOS",
      pacienteId: "4894-C",
      edad: 58,
      habitacion: "112-C",
      pabellon: "Pab Norte",
      cama: "Cama B",
      tipoDieta: "BLANDA",
      consistencia: "Blanda",
      aislado: true,
      alergias: ["Mariscos", "Penicilina"],
      observaciones: "Evitar frutos secos por alergia cruzada.",
      estadoCocina: "despachada",
      etiquetaGenerada: true,
      etiquetaImpresa: true,
      estadoLogistica: "pre_entregada",
      checklist: checklistCompleto(),
    }),
    crearOrden("ord-5", {
      etiquetaId: "etq-6",
      paciente: "RUIZ, PEDRO",
      pacienteId: "4896-E",
      edad: 67,
      habitacion: "301-A",
      tipoDieta: "NORMAL",
      consistencia: "Normal",
      estadoCocina: "despachada",
      etiquetaGenerada: true,
      etiquetaImpresa: true,
      estadoLogistica: "entregada",
      checklist: checklistCompleto(),
    }),
    crearOrden("ord-6", {
      etiquetaId: "etq-3",
      paciente: "MARTÍNEZ, CARLOS",
      pacienteId: "4894-C",
      edad: 58,
      habitacion: "112-C",
      tipoDieta: "BLANDA",
      estadoCocina: "lista",
      etiquetaGenerada: true,
      checklist: checklistCompleto(),
    }),
    crearOrden("ord-7", {
      paciente: "SILVA, MERCEDES",
      pacienteId: "4890-A",
      edad: 68,
      pabellon: "Pab Norte",
      habitacion: "402",
      cama: "Cama 1",
      tipoDieta: "HIPOSÓDICA",
      consistencia: "Papilla",
      aislado: true,
      alergias: ["Lactosa"],
      observaciones: "ALERGIA: Lactosa. Usar sustitutos.",
      estadoCocina: "en_preparacion",
      checklist: checklistEnPreparacion({ alergiasRevisadas: true }),
    }),
    crearOrden("ord-8", {
      etiquetaId: "etq-12",
      paciente: "GÓMEZ, ANA",
      pacienteId: "4891-B",
      edad: 45,
      pabellon: "Pab Central",
      habitacion: "402",
      cama: "Cama 2",
      tipoDieta: "PROTEICA",
      consistencia: "Blanda",
      alergias: ["Lactosa"],
      observaciones: "ALERGIA: Lactosa.",
      estadoCocina: "lista",
      etiquetaGenerada: true,
      etiquetaImpresa: true,
      estadoLogistica: "impresa",
      checklist: checklistCompleto(),
    }),
    crearOrden("ord-9", {
      etiquetaId: "etq-11",
      paciente: "NAVARRO, ELISA",
      pacienteId: "4899-H",
      edad: 59,
      habitacion: "204B",
      tipoDieta: "BLANDA",
      estadoCocina: "despachada",
      etiquetaGenerada: true,
      etiquetaImpresa: true,
      estadoLogistica: "devuelta",
      checklist: checklistCompleto(),
    }),
    crearOrden("ord-10", {
      paciente: "VEGA, JORGE",
      pacienteId: "4898-G",
      edad: 70,
      comida: "cena",
      habitacion: "301-A",
      tipoDieta: "DIABÉTICA",
      estadoCocina: "por_iniciar",
    }),
  ] satisfies OrdenCocina[],
}

export function crearOrdenesIniciales(): OrdenCocina[] {
  return mockCocina.ordenes.map((o) => ({
    ...o,
    checklist: o.checklist.map((c) => ({ ...c })),
  }))
}
