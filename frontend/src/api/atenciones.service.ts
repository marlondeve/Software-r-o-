import { apiClient, BitalApiError } from "@/api/client"
import { repararTextoUtf8 } from "@/modules/dietas-cocina/api/utils/texto"
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
  return data.data.map((atencion) => ({
    ...atencion,
    nombreCompleto: repararTextoUtf8(atencion.nombreCompleto),
    pabellon: repararTextoUtf8(atencion.pabellon),
    cama: repararTextoUtf8(atencion.cama),
  }))
}
