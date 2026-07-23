export interface DietaCatalogoFormValues {
  codigo: string
  nombre: string
  descripcion: string
  tarifaInicial: string
  fechaInicio: string
  fechaFin: string
  activa: boolean
}

export const DIETA_CATALOGO_FORM_VACIO: DietaCatalogoFormValues = {
  codigo: "",
  nombre: "",
  descripcion: "",
  tarifaInicial: "",
  fechaInicio: "",
  fechaFin: "",
  activa: true,
}
