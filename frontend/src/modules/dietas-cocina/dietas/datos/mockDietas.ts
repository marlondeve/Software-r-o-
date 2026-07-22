import type { EstadoDieta } from "@/modules/dietas-cocina/inicio/components/EstadoBadge"
import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"

export interface ComidaTab {
  id: TiempoComida
  label: string
}

export interface KpiDieta {
  id: string
  label: string
  value: number
  variant?: "default" | "destructive" | "warning" | "success" | "info" | "muted"
}

export interface FilaDieta {
  id: string
  pacienteId: string
  paciente: string
  edad: number
  servicio: string
  pabellon: string
  habitacion: string
  consistencia: string | null
  tipoDieta: string | null
  aislado?: boolean
  aislamiento: string
  alergico: boolean
  alergias: string
  observacionAislamiento: string
  observaciones: string
  estado: EstadoDieta
  comida: TiempoComida
}

export const COMIDAS_TABS: ComidaTab[] = [
  { id: "desayuno", label: "Desayuno" },
  { id: "merienda-manana", label: "Merienda de Media Mañana" },
  { id: "almuerzo", label: "Almuerzo" },
  { id: "merienda-tarde", label: "Merienda de Media Tarde" },
  { id: "cena", label: "Cena" },
  { id: "merienda-noche", label: "Merienda de Media Noche" },
]

const baseFila = {
  edad: 45,
  tipoDieta: null as string | null,
  aislamiento: "Ninguno",
  alergico: false,
  alergias: "",
  observacionAislamiento: "",
  observaciones: "",
}

const filasAlmuerzo: FilaDieta[] = [
  {
    ...baseFila,
    id: "die-1",
    pacienteId: "PAC-10482",
    paciente: "Torres, E.",
    edad: 62,
    servicio: "Medicina Interna",
    pabellon: "Pab. Central",
    habitacion: "301-A",
    consistencia: null,
    tipoDieta: null,
    estado: "no-solicitada",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-2",
    pacienteId: "PAC-10831",
    paciente: "García, M.",
    edad: 45,
    servicio: "Urgencias",
    pabellon: "Pabellón A",
    habitacion: "301-A",
    consistencia: "Sólida",
    tipoDieta: "Blanda",
    estado: "guardado",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-3",
    pacienteId: "PAC-10902",
    paciente: "Ruiz, P.",
    edad: 58,
    servicio: "UCI",
    pabellon: "Pab. Norte",
    habitacion: "312-A",
    consistencia: "Líquida",
    tipoDieta: "Líquida clara",
    aislado: true,
    aislamiento: "Contacto",
    observacionAislamiento: "Precauciones de contacto. Uso de EPP en habitación.",
    estado: "confirmada",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-4",
    pacienteId: "PAC-10715",
    paciente: "Martínez, R.",
    edad: 51,
    servicio: "Medicina Interna",
    pabellon: "Pab. Central",
    habitacion: "308-B",
    consistencia: "Sólida",
    tipoDieta: "General",
    estado: "confirmada",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-5",
    pacienteId: "PAC-10644",
    paciente: "López, A.",
    edad: 34,
    servicio: "Pediatría",
    pabellon: "Pab. Sur",
    habitacion: "210-C",
    consistencia: "Sólida",
    tipoDieta: "Hipocalórica",
    estado: "recibida",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-6",
    pacienteId: "PAC-10590",
    paciente: "Herrera, C.",
    edad: 47,
    servicio: "Cirugía General",
    pabellon: "Pab. Central",
    habitacion: "304-B",
    consistencia: "Blanda",
    tipoDieta: "Blanda / Sin sal",
    estado: "guardado",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-7",
    pacienteId: "PAC-10401",
    paciente: "Vargas, J.",
    edad: 70,
    servicio: "Medicina Interna",
    pabellon: "Pab. Norte",
    habitacion: "401-A",
    consistencia: null,
    tipoDieta: null,
    estado: "no-solicitada",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-8",
    pacienteId: "PAC-10388",
    paciente: "Mendoza, S.",
    edad: 55,
    servicio: "UCI",
    pabellon: "Pab. Norte",
    habitacion: "315-B",
    consistencia: "Líquida",
    tipoDieta: "Líquida completa",
    estado: "confirmada",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-9",
    pacienteId: "PAC-10277",
    paciente: "Castillo, D.",
    edad: 29,
    servicio: "Pediatría",
    pabellon: "Pab. Sur",
    habitacion: "212-A",
    consistencia: "Sólida",
    tipoDieta: "General",
    estado: "devuelta",
    comida: "almuerzo",
  },
  {
    ...baseFila,
    id: "die-10",
    pacienteId: "PAC-10156",
    paciente: "Ríos, F.",
    edad: 63,
    servicio: "Medicina Interna",
    pabellon: "Pab. Central",
    habitacion: "302-C",
    consistencia: "Blanda",
    tipoDieta: "Blanda",
    estado: "recibida",
    comida: "almuerzo",
  },
]

const filasDesayuno: FilaDieta[] = filasAlmuerzo.slice(0, 6).map((fila, index) => ({
  ...fila,
  id: `des-${index + 1}`,
  comida: "desayuno" as TiempoComida,
  estado:
    index % 3 === 0
      ? ("confirmada" as EstadoDieta)
      : index % 3 === 1
        ? ("guardado" as EstadoDieta)
        : ("no-solicitada" as EstadoDieta),
}))

export const mockDietas = {
  fecha: "Hoy, 24 de Octubre",
  ultimaSincronizacion: "08:30 AM",
  comidaActiva: "almuerzo" as TiempoComida,
  comidas: COMIDAS_TABS,
  avisoClinico:
    "Revise las condiciones clínicas de cada paciente antes de confirmar cambios masivos en las dietas asignadas.",
  kpis: [
    { id: "total", label: "Total", value: 142, variant: "default" },
    {
      id: "sin-solicitud",
      label: "Sin solicitud",
      value: 12,
      variant: "destructive",
    },
    { id: "guardado", label: "Guardado", value: 28, variant: "warning" },
    { id: "confirmadas", label: "Confirmadas", value: 85, variant: "success" },
    { id: "recibidas", label: "Recibidas", value: 15, variant: "info" },
    { id: "devueltas", label: "Devueltas", value: 2, variant: "muted" },
    { id: "canceladas", label: "Canceladas", value: 0, variant: "muted" },
  ] satisfies KpiDieta[],
  servicios: [
    "Medicina Interna",
    "Cirugía General",
    "UCI",
    "Pediatría",
    "Urgencias",
  ],
  tiposDieta: [
    "General",
    "Blanda",
    "Blanda / Sin sal",
    "Hipocalórica",
    "Líquida clara",
    "Líquida completa",
    "Diabética",
  ],
  consistencias: ["Sólida", "Blanda", "Líquida", "Puré"],
  cierreVentanaMinutos: 45,
  filas: [...filasAlmuerzo, ...filasDesayuno],
}
