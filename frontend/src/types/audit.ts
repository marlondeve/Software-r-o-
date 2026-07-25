/** Campos base sugeridos para entidades con auditoría transversal. */
export interface CamposAuditoriaBase {
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  deletedAt?: string
  deletedBy?: string
  isActive?: boolean
}

export interface UsuarioAuditoriaResumen {
  nombre: string
  rol: string
  iniciales: string
  esSistema?: boolean
}
