import type { RolEncuestas } from "@/modules/encuestas/lib/roles"

export type EstadoUsuarioEncuestas = "activo" | "inactivo"
export type OrigenUsuarioEncuestas = "Vital API" | "Bital"

export interface UsuarioEncuestasModulo {
  id: string
  nombre: string
  usuario: string
  correo: string
  rol: RolEncuestas
  servicioArea: string
  orgProveedora: string | null
  estado: EstadoUsuarioEncuestas
  ultimoAcceso: string
  origen: OrigenUsuarioEncuestas
}

export const mockUsuariosEncuestas = {
  total: 124,
  pagina: { desde: 1, hasta: 10 },
  filtros: {
    rol: "Todos los roles",
    estado: "Todos los estados",
  },
  usuarios: [
    {
      id: "1",
      nombre: "Dra. Elena Ramos",
      usuario: "eramos",
      correo: "eramos@clinicadelrio.com",
      rol: "Encuestador",
      servicioArea: "Nutrición Clínica",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Hace 2 horas",
      origen: "Vital API",
    },
    {
      id: "2",
      nombre: "Carlos Méndez",
      usuario: "cmendez",
      correo: "cmendez@clinicadelrio.com",
      rol: "Administrador",
      servicioArea: "Sistemas",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Ayer, 14:30",
      origen: "Bital",
    },
  ] satisfies UsuarioEncuestasModulo[],
}
