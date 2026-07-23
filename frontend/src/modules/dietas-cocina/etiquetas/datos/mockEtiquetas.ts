import type { TiempoComida } from "@/modules/dietas-cocina/parametros/datos/mockTiempos"
import { COMIDAS_TABS } from "@/modules/dietas-cocina/dietas/datos/mockDietas"
import { payloadQrEtiqueta } from "@/modules/dietas-cocina/etiquetas/lib/qrPayloadEtiqueta"

export type EstadoEtiqueta = "pendiente" | "generada" | "impresa" | "reimpresa"

export interface KpiEtiqueta {
  id: string
  label: string
  value: number
  variant?: "default" | "info" | "success" | "destructive"
}

export interface EtiquetaDieta {
  id: string
  codigo: string
  pacienteId: string
  paciente: string
  documento: string
  edad: number
  aislamiento: boolean
  pabellon: string
  habitacion: string
  tipoDieta: string
  consistencia: string
  observaciones: string
  comida: TiempoComida
  fechaHora: string
  estado: EstadoEtiqueta
  qrPayload: string
}

export const COMIDAS_ETIQUETAS = COMIDAS_TABS

const etiquetaBase: Omit<EtiquetaDieta, "id" | "codigo" | "estado" | "qrPayload"> = {
  pacienteId: "4892-A",
  paciente: "GARCÍA PÉREZ, MARÍA",
  documento: "1.234.567.890",
  edad: 64,
  aislamiento: true,
  pabellon: "Pab Sur",
  habitacion: "204B",
  tipoDieta: "HIPOSÓDICA",
  consistencia: "Blanda",
  observaciones: "Sin tomate, intolerancia leve.",
  comida: "almuerzo",
  fechaHora: "24/10/2023 12:30",
}

function crearEtiqueta(
  id: string,
  codigo: string,
  estado: EstadoEtiqueta,
  overrides: Partial<EtiquetaDieta> = {},
): EtiquetaDieta {
  return {
    ...etiquetaBase,
    ...overrides,
    id,
    codigo,
    estado,
    qrPayload: payloadQrEtiqueta(codigo),
  }
}

export const mockEtiquetas = {
  fechaReferencia: "Martes, 24 de Octubre 2023",
  comidaActiva: "almuerzo" as TiempoComida,
  comidas: COMIDAS_ETIQUETAS,
  kpis: [
    { id: "pendientes", label: "PENDIENTES POR GENERAR", value: 42, variant: "default" },
    { id: "generadas", label: "GENERADAS", value: 128, variant: "info" },
    { id: "impresas", label: "IMPRESAS", value: 105, variant: "success" },
    { id: "reimpresas", label: "RE-IMPRESAS", value: 3, variant: "destructive" },
  ] satisfies KpiEtiqueta[],
  pabellones: ["Todos los Pabellones", "Pab Sur", "Pab Central", "Pab Norte"],
  habitaciones: ["Todas las Habitaciones", "204B", "301-A", "112-C"],
  tiposDieta: ["Todas", "HIPOSÓDICA", "BLANDA", "DIABÉTICA", "NORMAL"],
  etiquetas: [
    crearEtiqueta("etq-1", "LBL-9021-X", "generada"),
    crearEtiqueta("etq-2", "LBL-9022-X", "generada", {
      paciente: "TORRES, ELENA",
      pacienteId: "4893-B",
      documento: "987.654.321",
      edad: 72,
      habitacion: "301-A",
      tipoDieta: "DIABÉTICA",
      consistencia: "Normal",
      observaciones: "Sin azúcar añadida.",
    }),
    crearEtiqueta("etq-3", "LBL-9023-X", "pendiente", {
      paciente: "MARTÍNEZ, CARLOS",
      pacienteId: "4894-C",
      edad: 58,
      aislamiento: false,
      habitacion: "112-C",
      tipoDieta: "BLANDA",
      observaciones: "",
    }),
    crearEtiqueta("etq-4", "LBL-9024-X", "impresa", {
      paciente: "LOPEZ, ANA",
      pacienteId: "4895-D",
      edad: 51,
      habitacion: "204B",
      tipoDieta: "HIPOSÓDICA",
    }),
    crearEtiqueta("etq-5", "LBL-9025-X", "impresa", {
      paciente: "MARTÍNEZ, CARLOS",
      pacienteId: "4894-C",
      edad: 58,
      aislamiento: true,
      pabellon: "Pab Norte",
      habitacion: "112-C",
      tipoDieta: "BLANDA",
      consistencia: "Blanda",
      observaciones: "Evitar frutos secos por alergia cruzada.",
    }),
    crearEtiqueta("etq-6", "LBL-9026-X", "reimpresa", {
      paciente: "RUIZ, PEDRO",
      pacienteId: "4896-E",
      edad: 67,
      tipoDieta: "NORMAL",
      consistencia: "Normal",
    }),
    crearEtiqueta("etq-7", "LBL-9027-X", "generada", {
      paciente: "SANTOS, LUCIA",
      comida: "desayuno",
      fechaHora: "24/10/2023 07:00",
    }),
    crearEtiqueta("etq-8", "LBL-9028-X", "pendiente", {
      paciente: "VEGA, JORGE",
      comida: "cena",
      fechaHora: "24/10/2023 19:00",
    }),
    crearEtiqueta("etq-9", "LBL-9029-X", "generada", {
      paciente: "HERRERA, SOFIA",
      pacienteId: "4897-F",
      comida: "merienda-manana",
      fechaHora: "24/10/2023 10:00",
      tipoDieta: "HIPOSÓDICA",
      observaciones: "Yogurt sin azúcar.",
    }),
    crearEtiqueta("etq-10", "LBL-9030-X", "pendiente", {
      paciente: "CASTRO, DIEGO",
      pacienteId: "4898-G",
      comida: "merienda-tarde",
      fechaHora: "24/10/2023 16:00",
      tipoDieta: "DIABÉTICA",
      consistencia: "Normal",
    }),
    crearEtiqueta("etq-11", "LBL-9031-X", "generada", {
      paciente: "NAVARRO, ELISA",
      pacienteId: "4899-H",
      comida: "almuerzo",
      fechaHora: "24/10/2023 22:00",
      tipoDieta: "BLANDA",
    }),
    crearEtiqueta("etq-12", "LBL-9032-X", "impresa", {
      paciente: "GÓMEZ, ANA",
      pacienteId: "4891-B",
      edad: 45,
      pabellon: "Pab Central",
      habitacion: "402",
      tipoDieta: "PROTEICA",
      consistencia: "Blanda",
      observaciones: "ALERGIA: Lactosa.",
    }),
  ] satisfies EtiquetaDieta[],
}

export function etiquetaComidaLabel(comida: TiempoComida): string {
  return COMIDAS_TABS.find((c) => c.id === comida)?.label.toUpperCase() ?? comida.toUpperCase()
}
