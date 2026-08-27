import type { EstadoDieta, TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { ComidaTab, FilaDieta, KpiDieta } from "@/modules/dietas-cocina/types/diets"
import type { CatalogoDietaItem } from "@/modules/dietas-cocina/types/repositories"

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
    pabellon: "Pab. Sur",
    habitacion: "112-C",
    consistencia: "Normal",
    tipoDieta: "Blanda",
    descripcionDieta: "Sin restricciones adicionales de sodio o azúcar.",
    solicitadoPor: "Nutricionista A. Pérez",
    solicitadoEn: "Hoy, 09:15 AM",
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
    consistencia: "Blanda mecánica",
    tipoDieta: "Líquida clara",
    descripcionDieta: "Solo líquidos transparentes. Ayuno parcial.",
    solicitadoPor: "Enfermera J. López",
    solicitadoEn: "Hoy, 08:00 AM",
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
    consistencia: "Normal",
    tipoDieta: "General",
    descripcionDieta: "Dieta estándar hospitalaria sin modificaciones especiales.",
    solicitadoPor: "Enfermera M. Ruiz",
    solicitadoEn: "Hoy, 07:45 AM",
    estado: "confirmada",
    cancelacionTardia: true,
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
    consistencia: "Normal",
    tipoDieta: "Hipocalórica",
    descripcionDieta: "Control calórico para manejo de peso.",
    solicitadoPor: "Nutricionista A. Pérez",
    solicitadoEn: "Hoy, 11:00 AM",
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
    consistencia: "Blanda mecánica",
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
    consistencia: "Normal",
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
    solicitadoPor: "Enfermera M. Ruiz",
    solicitadoEn: "Hoy, 12:45 PM",
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

const COMIDAS_PRINCIPALES: TiempoComida[] = ["desayuno", "almuerzo", "cena"]

function tarifasMock(comidas: TiempoComida[]): Partial<Record<TiempoComida, number>> {
  return Object.fromEntries(comidas.map((comida) => [comida, 6080]))
}

/** Catálogo demo alineado con reglas FCR (Renal y niños 6–10 m sin desayuno). */
export const MOCK_CATALOGO_DIETAS: CatalogoDietaItem[] = [
  { id: "general", nombre: "General", tarifasVigentes: tarifasMock(COMIDAS_PRINCIPALES) },
  { id: "blanda", nombre: "Blanda", tarifasVigentes: tarifasMock(COMIDAS_PRINCIPALES) },
  {
    id: "blanda-sin-sal",
    nombre: "Blanda / Sin sal",
    tarifasVigentes: tarifasMock(COMIDAS_PRINCIPALES),
  },
  {
    id: "hipocalorica",
    nombre: "Hipocalórica",
    tarifasVigentes: tarifasMock(COMIDAS_PRINCIPALES),
  },
  {
    id: "liquida-clara",
    nombre: "Líquida clara",
    tarifasVigentes: tarifasMock(COMIDAS_PRINCIPALES),
  },
  {
    id: "liquida-completa",
    nombre: "Líquida completa",
    tarifasVigentes: tarifasMock(COMIDAS_PRINCIPALES),
  },
  {
    id: "diabetica",
    nombre: "Diabética",
    tarifasVigentes: tarifasMock(COMIDAS_PRINCIPALES),
  },
  {
    id: "merienda-manana",
    nombre: "Merienda mañana",
    tarifasVigentes: { "merienda-manana": 6080 },
  },
  {
    id: "merienda-tarde",
    nombre: "Merienda tarde",
    tarifasVigentes: { "merienda-tarde": 6080 },
  },
  {
    id: "merienda-noche",
    nombre: "Merienda noche",
    tarifasVigentes: { "merienda-noche": 6080 },
  },
]

export const configDietasOperativas = {
  comidaActiva: "almuerzo" as TiempoComida,
  comidas: COMIDAS_TABS,
  avisoClinico:
    "Revise las condiciones clínicas de cada paciente antes de confirmar cambios masivos en las dietas asignadas.",
  tiposDieta: [
    "General",
    "Blanda",
    "Blanda / Sin sal",
    "Hipocalórica",
    "Líquida clara",
    "Líquida completa",
    "Diabética",
    "Merienda mañana",
    "Merienda tarde",
    "Merienda noche",
  ],
  consistencias: ["Normal", "Blanda", "Blanda mecánica", "Líquido"],
  cierreVentanaMinutos: 45,
  servicios: [
    "Medicina Interna",
    "Cirugía General",
    "UCI",
    "Pediatría",
    "Urgencias",
  ],
}

export function formatearFechaReferenciaDietas(): string {
  const hoy = new Date()
  const fecha = hoy.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  })
  return `Hoy, ${fecha}`
}

export const mockDietas = {
  fecha: "Hoy, 24 de Octubre",
  ultimaSincronizacion: "08:30 AM",
  ...configDietasOperativas,
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
    { id: "salidas-clinicas", label: "Salidas clínicas", value: 0, variant: "muted" },
    { id: "canceladas", label: "Canceladas", value: 0, variant: "muted" },
  ] satisfies KpiDieta[],
  filas: [...filasAlmuerzo, ...filasDesayuno],
}
