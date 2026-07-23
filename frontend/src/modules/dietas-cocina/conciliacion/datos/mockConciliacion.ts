export type EstadoConciliacion =
  | "coincide"
  | "dif-cantidad"
  | "dif-tarifa"
  | "pendiente"
  | "conciliado-manual"

export interface FilaConciliacion {
  id: string
  tipo: string
  consistencia: string
  tiempo: string
  tarifa: string
  tarifaAlerta?: boolean
  cantSist: number
  cantFact: number
  difCant: number
  difEconomica: string
  estado: EstadoConciliacion
  /** Registros del sistema usados en el detalle (generados desde el ciclo). */
  registros?: RegistroSistema[]
}

export interface RegistroSistema {
  fecha: string
  paciente: string
  habitacion: string
  estado: string
}

export interface DetalleConciliacion {
  titulo: string
  codigo: string
  badge: string
  bital: { unidades: number; valor: string }
  proveedor: { unidades: number; valor: string }
  diferencia: string
  registros: RegistroSistema[]
  totalRegistros: number
}

export const mockConciliacion = {
  filtros: {
    periodo: "Últimos 30 días",
    proveedor: "Catering Salud S.A.",
    facturaPlaceholder: "Ej: F-2023-458",
  },
  kpis: [
    { label: "Dietas registradas", value: "4,280", variant: "default" as const },
    { label: "Dietas facturadas", value: "4,315", variant: "default" as const },
    { label: "Valor calculado", value: "$42,800", variant: "default" as const },
    { label: "Valor facturado", value: "$43,150", variant: "default" as const },
    {
      label: "Diferencia total",
      value: "+$350.00",
      variant: "warning" as const,
    },
    {
      label: "Inconsistencias",
      value: "35",
      variant: "destructive" as const,
    },
  ],
  filas: [
    {
      id: "1",
      tipo: "Dieta Normal",
      consistencia: "Sólida",
      tiempo: "Almuerzo",
      tarifa: "$10.00",
      cantSist: 120,
      cantFact: 120,
      difCant: 0,
      difEconomica: "$0.00",
      estado: "coincide" as EstadoConciliacion,
    },
    {
      id: "2",
      tipo: "Dieta Hiposódica",
      consistencia: "Líquida Clara",
      tiempo: "Desayuno",
      tarifa: "$10.00",
      cantSist: 50,
      cantFact: 100,
      difCant: 50,
      difEconomica: "+$500.00",
      estado: "dif-cantidad" as EstadoConciliacion,
    },
    {
      id: "3",
      tipo: "Dieta Diabética",
      consistencia: "Sólida",
      tiempo: "Cena",
      tarifa: "$8.50",
      tarifaAlerta: true,
      cantSist: 80,
      cantFact: 80,
      difCant: 0,
      difEconomica: "+$120.00",
      estado: "dif-tarifa" as EstadoConciliacion,
    },
    {
      id: "4",
      tipo: "Dieta Blanda",
      consistencia: "Sólida",
      tiempo: "Almuerzo",
      tarifa: "$9.00",
      cantSist: 45,
      cantFact: 0,
      difCant: -45,
      difEconomica: "-$405.00",
      estado: "pendiente" as EstadoConciliacion,
    },
    {
      id: "5",
      tipo: "Dieta Líquida",
      consistencia: "Líquida",
      tiempo: "Cena",
      tarifa: "$10.00",
      cantSist: 30,
      cantFact: 30,
      difCant: 0,
      difEconomica: "$0.00",
      estado: "conciliado-manual" as EstadoConciliacion,
    },
  ] satisfies FilaConciliacion[],
  detalles: {
    "2": {
      titulo: "Líquida Clara - Desayuno",
      codigo: "Cód. 502",
      badge: "Diferencia de cantidad",
      bital: { unidades: 50, valor: "$500.00" },
      proveedor: { unidades: 100, valor: "$1,000.00" },
      diferencia: "+50 unidades / +$500.00",
      totalRegistros: 50,
      registros: [
        {
          fecha: "12 oct, 07:30 a. m.",
          paciente: "García, J.",
          habitacion: "Hab. 304",
          estado: "Confirmada",
        },
        {
          fecha: "12 oct, 07:32 a. m.",
          paciente: "López, M.",
          habitacion: "Hab. 305",
          estado: "Confirmada",
        },
        {
          fecha: "12 oct, 07:35 a. m.",
          paciente: "Ruiz, P.",
          habitacion: "Hab. 308",
          estado: "Confirmada",
        },
      ],
    },
  } satisfies Record<string, DetalleConciliacion>,
}
