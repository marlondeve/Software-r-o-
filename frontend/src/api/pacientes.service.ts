import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse, Paciente } from "@/api/types"

export async function getPacientePorDocumento(
  numeroDocumento: string,
  tipoDocumento: string,
): Promise<Paciente | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<Paciente>>("/pacientes/buscar", {
      params: { numeroDocumento, tipoDocumento },
    })
    return data.data
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function searchPacientes(termino: string): Promise<Paciente[]> {
  const { data } = await apiClient.get<ApiResponse<Paciente[]>>(
    "/pacientes/search",
    { params: { search: termino } },
  )
  return data.data
}
