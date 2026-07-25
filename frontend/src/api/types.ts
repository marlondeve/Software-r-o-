export interface ApiResponse<T> {
  success: boolean
  data: T
  errors: string[] | null
  timestamp: string
}

export interface ApiErrorBody {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  traceId?: string
}

export interface Paciente {
  cedula: string
  tipoDocumento: string
  nombreCompleto: string
  primerNombre?: string
  segundoNombre?: string
  primerApellido?: string
  segundoApellido?: string
  fechaNacimiento?: string
  edad: number
  sexo: string
  telefono?: string | null
  direccion?: string | null
  email?: string | null
}

export interface PacienteAtencion {
  cedula: string
  tipoDocumento: string
  nombreCompleto: string
  primerNombre?: string
  segundoNombre?: string
  primerApellido?: string
  segundoApellido?: string
  fechaNacimiento?: string
  edad: number
  sexo: string
}

export interface Atencion {
  cedula: string
  tipoDocumento: string
  consecutivo: number
  paciente: PacienteAtencion
  claseProcedimiento?: string
  fechaAdmision?: string
  fechaEgreso?: string | null
  estaActivo?: boolean
  estadoActual?: string
  diagnosticoEntrada?: string
  diagnosticoSalida?: string
  tipoHospitalizacion?: string
  numeroFactura?: string
}

export interface AtencionHospitalaria {
  idIngreso: number
  tipoDocumento: string
  cedula: string
  nombreCompleto: string
  pabellon: string
  cama: string
}

export interface HealthResponse {
  status: string
}
