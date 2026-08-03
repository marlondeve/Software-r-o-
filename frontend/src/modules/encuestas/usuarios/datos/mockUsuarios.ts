import type { UsuarioEncuestasModulo } from "@/modules/encuestas/types/users"

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
      origen: "RioSoft",
    },
  ] satisfies UsuarioEncuestasModulo[],
}
