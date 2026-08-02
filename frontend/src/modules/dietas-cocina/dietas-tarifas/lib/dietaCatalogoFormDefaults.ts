import {
  TARIFAS_POR_COMIDA_VACIAS,
  type TarifasPorComidaForm,
} from "@/modules/dietas-cocina/dietas-tarifas/lib/tarifasPorComida"

export interface DietaCatalogoFormValues {
  codigo: string
  nombre: string
  descripcion: string
  tarifasPorComida: TarifasPorComidaForm
  fechaInicio: string
  fechaFin: string
  activa: boolean
}

export const DIETA_CATALOGO_FORM_VACIO: DietaCatalogoFormValues = {
  codigo: "",
  nombre: "",
  descripcion: "",
  tarifasPorComida: { ...TARIFAS_POR_COMIDA_VACIAS },
  fechaInicio: "",
  fechaFin: "",
  activa: true,
}
