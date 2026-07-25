export type SortOrder = "asc" | "desc"

export interface FiltrosPaginacion {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: SortOrder
}

export interface RespuestaPaginada<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
