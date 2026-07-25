import { apiClient, BitalApiError } from "@/api/client"
import type { ApiResponse, Atencion, AtencionHospitalaria } from "@/api/types"

export async function getAtenciones(servicioId?: string): Promise<Atencion[]> {
  const { data } = await apiClient.get<ApiResponse<Atencion[]>>("/atenciones", {
    params: servicioId ? { servicioId } : undefined,
  })
  return data.data
}

export async function getAtencionById(id: number): Promise<Atencion | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<Atencion>>(`/atenciones/${id}`)
    return data.data
  } catch (error) {
    if (error instanceof BitalApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function getAtencionesByPaciente(
  numeroDocumento: string,
  tipoDocumento: string,
): Promise<Atencion[]> {
  const { data } = await apiClient.get<ApiResponse<Atencion[]>>(
    "/atenciones/paciente",
    { params: { numeroDocumento, tipoDocumento } },
  )
  return data.data
}

export async function getAtencionesHospitalarias(): Promise<AtencionHospitalaria[]> {
  const { data } = await apiClient.get<ApiResponse<AtencionHospitalaria[]>>(
    "/atenciones/hospitalarias",
  )
  return data.data
}
