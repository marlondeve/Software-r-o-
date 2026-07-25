import type { CanalPaciente, EstadoPaciente } from "@/modules/encuestas/types/enums"

export interface PacienteEncontrado {
  nombre: string
  documento: string
  edad: number
  sexo: string
  elegible: boolean
  canal: CanalPaciente
  entidadEps: string
  contrato: string
  servicio: string
  puntoAtencion: string
  fechaAtencion: string
  fechaRelativa: string
}

export interface PacientePresencial {
  id: string
  nombre: string
  documento: string
  servicio: string
  ubicacion: string
  aseguradora?: string
  estado: EstadoPaciente
  guardadoHace?: string
  motivoNoDisponible?: string
  horaReporte?: string
}

export interface PacienteContextoEncuesta {
  nombre: string
  documento: string
  eps: string
  contrato?: string
  servicio: string
  canal: "presencial" | "telefonica"
}
