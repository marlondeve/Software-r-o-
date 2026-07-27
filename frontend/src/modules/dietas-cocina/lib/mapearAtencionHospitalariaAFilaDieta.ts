import type { FilaDieta } from "@/modules/dietas-cocina/types/diets"
import type { TiempoComida } from "@/modules/dietas-cocina/types/enums"
import type { AtencionHospitalaria } from "@/api/types"
import { repararTextoUtf8 } from "@/modules/dietas-cocina/api/utils/texto"
const DEFAULTS_OPERATIVOS = {
  consistencia: null as string | null,
  tipoDieta: null as string | null,
  aislamiento: "Ninguno",
  alergico: false,
  alergias: "",
  observacionAislamiento: "",
  observaciones: "",
  estado: "no-solicitada" as const,
}

function inferirServicioClinico(pabellon: string): string {
  const normalizado = pabellon.toUpperCase()
  if (normalizado.includes("UCI")) return "UCI"
  if (normalizado.includes("URGENCI")) return "Urgencias"
  if (normalizado.includes("NEONATAL")) return "Neonatal"
  if (normalizado.includes("HOSPITALIZ") || normalizado.includes("PISO")) {
    return "Hospitalización"
  }
  return pabellon
    .toLowerCase()
    .split(" ")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ")
}

export function formatearDocumentoPaciente(fila: FilaDieta): string {
  if (fila.cedula && fila.tipoDocumento) {
    return `${fila.tipoDocumento} ${fila.cedula}`
  }
  return fila.pacienteId.replace(/^PAC-/, "")
}

export function formatearEdadPaciente(fila: FilaDieta): string | null {
  if (fila.edad > 0) return `${fila.edad} años`
  return null
}

export function formatearUbicacionPaciente(fila: FilaDieta): string {
  return `${fila.pabellon} · Cama ${fila.habitacion}`
}

export function formatearReferenciaIngreso(fila: FilaDieta): string | null {
  if (fila.idIngreso == null) return null
  return `Ingreso ${fila.idIngreso}`
}

export function formatearIdentificacionPaciente(fila: FilaDieta): string {
  const documento = formatearDocumentoPaciente(fila)
  const edad = formatearEdadPaciente(fila)
  return edad ? `${documento} · ${edad}` : documento
}

interface OpcionesMapeoCenso {
  edad?: number
}

export function mapearAtencionHospitalariaAFilaDieta(
  atencion: AtencionHospitalaria,
  comida: TiempoComida = "almuerzo",
  opciones: OpcionesMapeoCenso = {},
): Omit<FilaDieta, "id"> {
  return {
    ...DEFAULTS_OPERATIVOS,
    pacienteId: `${atencion.tipoDocumento}-${atencion.cedula}`,
    idIngreso: atencion.idIngreso,
    cedula: atencion.cedula,
    tipoDocumento: atencion.tipoDocumento,
    paciente: repararTextoUtf8(atencion.nombreCompleto),
    edad: opciones.edad ?? 0,
    servicio: inferirServicioClinico(repararTextoUtf8(atencion.pabellon)),
    pabellon: repararTextoUtf8(atencion.pabellon),
    habitacion: repararTextoUtf8(atencion.cama),
    comida,
  }
}
