import type { EstadoRegla } from "@/modules/encuestas/types/enums"

export interface ReglaActiva {
  id: string
  descripcion: string
  estado: EstadoRegla
  modificado: string
}
