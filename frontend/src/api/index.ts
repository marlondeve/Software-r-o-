export { apiBaseUrl, healthUrl } from "@/api/config"
export { apiClient } from "@/api/client"
export type {
  ApiErrorBody,
  ApiResponse,
  Atencion,
  AtencionHospitalaria,
  HealthResponse,
  Paciente,
  PacienteAtencion,
} from "@/api/types"
export { searchPacientes, getPacientePorDocumento } from "@/api/pacientes.service"
export {
  getAtencionById,
  getAtenciones,
  getAtencionesByPaciente,
  getAtencionesHospitalarias,
} from "@/api/atenciones.service"
export { checkHealth } from "@/api/health.service"
