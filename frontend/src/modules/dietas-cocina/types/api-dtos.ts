/** DTOs alineados a README-ENDPOINTS-DIETAS.md (ajustables tras pruebas locales). */

export interface CensoDietasDto {
  fechaOperativa?: string
  comida?: string
  filas?: FilaDietaDto[]
  totalPacientes?: number
  dietasSolicitadas?: number
  dietasPendientes?: number
  dietasConfirmadas?: number
}

export interface CensoResponseDto extends CensoDietasDto {
  ultimaSincronizacion?: string
}

export interface FilaDietaDto {
  id?: string
  pacienteId?: string
  idIngreso?: number
  cedula?: string
  tipoDocumento?: string
  paciente?: string
  edad?: number
  servicio?: string
  pabellon?: string
  habitacion?: string
  consistencia?: string | null
  tipoDietaId?: string | null
  tipoDieta?: string | null
  dieta?: string | null
  aislado?: boolean
  aislamiento?: string
  alergico?: boolean
  alergias?: string
  observacionAislamiento?: string
  observaciones?: string
  descripcionDieta?: string
  solicitadoPor?: string
  solicitadoEn?: string
  cancelacionTardia?: boolean
  estado?: string
  comida?: string
  ordenCocinaId?: string
}

export interface SolicitudDietaRequestDto {
  tipoDietaId?: string
  consistencia: string
  descripcionDieta?: string
  observaciones?: string
  aislado?: boolean
  aislamiento?: string
  observacionAislamiento?: string
  alergico?: boolean
  alergias?: string
  guardar?: boolean
}

export interface BulkConfirmarRequestDto {
  dietasIds: string[]
  usuario: string
}

export interface BuscarDietasRequestDto {
  fecha?: string
  comida?: string
  servicio?: string
  estado?: string
  paciente?: string
}

export interface EventoTrazabilidadDto {
  id?: string
  titulo?: string
  descripcion?: string
  fecha?: string
  activo?: boolean
}

export interface CatalogoDietaDto {
  id?: string
  codigo?: string
  nombre?: string
  descripcion?: string
  activa?: boolean
  tarifaActual?: number
  fechaInicio?: string
  fechaFin?: string | null
  usuario?: string
  modificadoEn?: string
  estado?: string
  historicoTarifas?: TarifaHistoricoDto[]
}

export interface TarifaHistoricoDto {
  id?: string
  anio?: number
  monto?: number
  vigenciaDesde?: string
  vigenciaHasta?: string
  vigente?: boolean
  registradoPor?: string
  motivoCambio?: string
  creadoEn?: string
}

export interface EtiquetaDto {
  id?: string
  codigo?: string
  pacienteId?: string
  paciente?: string
  documento?: string
  edad?: number
  aislamiento?: boolean
  aislado?: boolean
  pabellon?: string
  habitacion?: string
  cama?: string
  tipoDieta?: string
  consistencia?: string
  observaciones?: string
  comida?: string
  fechaHora?: string
  estado?: string
  estadoLogistica?: string
  qrPayload?: string
  alergias?: string | string[]
  horaPreEntrega?: string
  horaEntrega?: string
  horaDevolucion?: string
  recibidoPor?: string
  motivoDevolucion?: string
  observacionesDevolucion?: string
  fotoDevolucion?: string
  ordenCocinaId?: string
  filaDietaId?: string
  cedula?: string
  generadaEn?: string
  fechaOperativa?: string
  impresaEn?: string
  observacionAislamiento?: string
  alergico?: boolean
}

export interface GenerarEtiquetasRequestDto {
  ordenIds?: string[]
  comida?: string
  fecha?: string
}

export interface CrearOrdenCocinaRequestDto {
  fechaOperativa: string
  comida: string
  dietasIds: string[]
  observaciones?: string
}

export interface ActualizarEstadoOrdenRequestDto {
  estado: string
  observaciones?: string
}

export interface ChecklistItemApiDto {
  id: string
  label?: string
  obligatorio?: boolean
  completado: boolean
}

export interface ActualizarChecklistOrdenRequestDto {
  items: Array<{ id: string; completado: boolean }>
}

export interface CrearDietaCatalogoRequestDto {
  codigo: string
  nombre: string
  descripcion?: string
  fechaInicio?: string
  fechaFin?: string | null
  activa?: boolean
  tarifaInicial?: number
  vigenciaDesde?: string
  vigenciaHasta?: string
  motivoTarifa?: string
}

export interface ActualizarDietaCatalogoRequestDto {
  nombre?: string
  descripcion?: string
  fechaInicio?: string
  fechaFin?: string | null
}

export interface NuevaTarifaRequestDto {
  monto: number
  vigenciaDesde: string
  vigenciaHasta: string
  motivoCambio?: string
}

export interface TiemposComidaConfigApiDto {
  tiempos?: TiempoComidaParamDto[]
  modoCarga?: string
}

export interface OrdenCocinaApiDto {
  id: string
  numeroOrden?: number
  comida?: string
  fechaOperativa?: string
  totalDietas?: number
  estado?: string
  generadoPor?: string
  generadoEn?: string
  observaciones?: string
  dietas?: FilaDietaDto[]
  dietasIds?: string[]
  checklist?: ChecklistItemApiDto[]
}

export interface BulkEtiquetasRequestDto {
  etiquetaIds?: string[]
  ids?: string[]
}

export interface FilaConciliacionDto {
  id?: string
  tipo?: string
  tipoDieta?: string
  consistencia?: string
  tiempo?: string
  comida?: string
  tarifa?: string
  tarifaAlerta?: boolean
  cantSist?: number
  cantFact?: number
  difCant?: number
  diferencia?: number
  difEconomica?: string
  estado?: string
  cantidadSolicitada?: number
  cantidadFacturada?: number
  cantidadEntregada?: number
  valorUnitario?: number
  valorTotal?: number
  paciente?: string
  habitacion?: string
  fechaOperativa?: string
  numeroFactura?: string
  proveedor?: string
  periodo?: string
}

export interface DetalleConciliacionDto {
  linea?: FilaConciliacionDto
  Linea?: FilaConciliacionDto
  eventosDieta?: EventoTrazabilidadDto[]
  EventosDieta?: EventoTrazabilidadDto[]
  alertas?: string[]
  Alertas?: string[]
  recomendaciones?: string[]
  Recomendaciones?: string[]
}

export interface ConciliacionKpisDto {
  clave?: string
  etiqueta?: string
  label?: string
  valor?: number
  value?: number | string
  formato?: string
  variant?: string
  tendencia?: string | null
  comparacion?: string | null
}

export interface DashboardDto {
  kpis?: { id?: string; label?: string; value?: number; variant?: string }[]
  distribucion?: { label?: string; value?: number }[]
  actividad?: { paciente?: string; accion?: string; hora?: string; estado?: string }[]
  alertas?: { titulo?: string; descripcion?: string; tipo?: string }[]
  progreso?: { label?: string; value?: number; total?: number }[]
}

export interface ReporteDto {
  kpis?: { label?: string; value?: string | number }[]
  hitos?: unknown[]
  graficos?: unknown[]
  hallazgos?: unknown[]
}

export interface TiempoComidaParamDto {
  id?: string
  label?: string
  activo?: boolean
  hitos?: { id?: string; label?: string; hora?: string }[]
  ventanaCambios?: { inicio?: string; fin?: string; label?: string }
}

export interface CategoriaEdadDto {
  id?: string
  nombre?: string
  rangoMin?: number
  rangoMax?: number
  unidad?: string
  estado?: string
}

export interface ClasificarEdadRequestDto {
  edad: number
}

export interface ClasificarEdadResponseDto {
  categoriaId?: string
  nombre?: string
}

export interface FilaAuditoriaDto {
  id?: string
  codigoAuditoria?: string
  fechaHora?: string
  fechaEvento?: string
  usuario?: { nombre?: string; rol?: string; iniciales?: string; esSistema?: boolean } | string
  modulo?: string
  accion?: string
  registroId?: string
  entidadId?: string
  tipoEntidad?: string
  cambios?: unknown
  datosAntes?: string | null
  datosDespues?: string | null
  valorAnterior?: string
  valorNuevo?: string
  direccionIp?: string | null
  metadata?: string | null
  Metadata?: string | null
  resultado?: string
}

export interface DetalleAuditoriaDto extends FilaAuditoriaDto {
  entidad?: { etiqueta?: string; estado?: string }
  parametro?: string
  valorAnterior?: string
  valorNuevo?: string
  justificacion?: string
  metadatos?: { ip?: string; dispositivo?: string; sistema?: string }
  historial?: { titulo?: string; tiempo?: string; actual?: boolean }[]
  mensajeError?: string
}

export interface UsuarioModuloDto {
  id?: string
  nombre?: string
  usuario?: string
  correo?: string
  rol?: string
  servicioArea?: string
  orgProveedora?: string | null
  estado?: boolean | string
  ultimoAcceso?: string
  origen?: string
}

export interface MetaPaginacionDto {
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
}

export interface RolModuloDto {
  id?: string
  nombre?: string
  esSistema?: boolean
  activo?: boolean
  totalPermisos?: number
}

export interface PermisoRolDto {
  rolId?: string
  rol?: string
  permisos?: Record<string, boolean>
  rutas?: number[]
}
