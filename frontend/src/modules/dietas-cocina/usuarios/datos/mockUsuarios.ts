import type { RolDietas } from "@/modules/dietas-cocina/lib/roles"

export type EstadoUsuario = "activo" | "inactivo"

export type OrigenUsuario = "Vital API" | "Bital"

export interface UsuarioModulo {
  id: string
  nombre: string
  usuario: string
  correo: string
  rol: RolDietas
  servicioArea: string
  orgProveedora: string | null
  estado: EstadoUsuario
  ultimoAcceso: string
  origen: OrigenUsuario
}

export const mockUsuariosDietas = {
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
      rol: "Nutricionista",
      servicioArea: "Nutrición Clínica",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Hace 2 horas",
      origen: "Vital API",
    },
    {
      id: "2",
      nombre: "Admin Sistema",
      usuario: "admin.sys",
      correo: "admin.sys@clinicadelrio.com",
      rol: "Administrador",
      servicioArea: "Sistemas",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Ayer, 14:30",
      origen: "Bital",
    },
    {
      id: "3",
      nombre: "Operador Logística",
      usuario: "op_logistica",
      correo: "logistica@cateringhospitalario.com",
      rol: "Proveedor",
      servicioArea: "Cocina Externa",
      orgProveedora: "Catering Hospitalario SL",
      estado: "activo",
      ultimoAcceso: "Hace 5 min",
      origen: "Bital",
    },
    {
      id: "4",
      nombre: "Dr. Ramírez",
      usuario: "dramirez",
      correo: "dramirez@clinicadelrio.com",
      rol: "Doctor",
      servicioArea: "Medicina Interna",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Hace 1 hora",
      origen: "Vital API",
    },
    {
      id: "5",
      nombre: "Enf. Laura Méndez",
      usuario: "lmendez",
      correo: "lmendez@clinicadelrio.com",
      rol: "Enfermera",
      servicioArea: "Piso 3",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Hace 30 min",
      origen: "Bital",
    },
    {
      id: "6",
      nombre: "Carlos Mendoza",
      usuario: "cmendoza",
      correo: "cmendoza@clinicadelrio.com",
      rol: "Nutricionista",
      servicioArea: "Nutrición Clínica",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Hace 3 días",
      origen: "Vital API",
    },
    {
      id: "7",
      nombre: "María Gómez",
      usuario: "mgomez",
      correo: "mgomez@cateringhospitalario.com",
      rol: "Proveedor",
      servicioArea: "Despacho",
      orgProveedora: "Catering Hospitalario SL",
      estado: "inactivo",
      ultimoAcceso: "Hace 2 semanas",
      origen: "Bital",
    },
    {
      id: "8",
      nombre: "Jorge Pérez",
      usuario: "jperez",
      correo: "jperez@clinicadelrio.com",
      rol: "Enfermera",
      servicioArea: "Piso 5",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Hace 4 horas",
      origen: "Vital API",
    },
    {
      id: "9",
      nombre: "Sofía Torres",
      usuario: "storres",
      correo: "storres@clinicadelrio.com",
      rol: "Administrador",
      servicioArea: "Dirección Médica",
      orgProveedora: null,
      estado: "activo",
      ultimoAcceso: "Hace 15 min",
      origen: "Bital",
    },
    {
      id: "10",
      nombre: "Operador Principal",
      usuario: "op_dietas",
      correo: "dietas@clinicadelrio.com",
      rol: "Proveedor",
      servicioArea: "Producción",
      orgProveedora: "Catering Hospitalario SL",
      estado: "activo",
      ultimoAcceso: "Hace 10 min",
      origen: "Bital",
    },
  ] satisfies UsuarioModulo[],
}
