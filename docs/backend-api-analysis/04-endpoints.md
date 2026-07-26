# 04 — Matriz de endpoints (ApiConsultas vs ApiNegocio)

> **Alcance:** Derivado del análisis de `frontend/src/modules/dietas-cocina/`, `frontend/src/modules/encuestas/` y `backend/FRONTEND-API-GUIDE.md`.  
> **Convención:** El frontend **no debe consumir ApiConsultas directamente**; ApiNegocio actúa como fachada y agrega reglas de negocio, persistencia y permisos.

---

## Resumen ejecutivo

| API | Endpoints documentados | Estado |
|-----|------------------------|--------|
| **ApiConsultas** (read-only Vital HIS) | 8 | Implementados (puerto 5013) |
| **ApiNegocio** (sugeridos) | 112 | Pendientes — inferidos del frontend |

---

## ApiConsultas — Endpoints existentes

> Referencia: `backend/FRONTEND-API-GUIDE.md`  
> Base URL dev: `http://localhost:5013`

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/v1/pacientes/buscar` | ApiConsultas | Paciente | Buscar por documento | Query: `numeroDocumento`, `tipoDocumento` | Envelope `{ data: Paciente }` | Documento + tipo (requeridos) | Público (dev) | `frontend/src/api/pacientes.service.ts` vía `cargarCensoHospitalario.ts` → `getPacientePorDocumento` |
| GET | `/api/v1/pacientes/{id}` | ApiConsultas | Paciente | Obtener por ID compuesto | Path: `id` = `{doc}-{tipo}` | Envelope `{ data: Paciente }` | — | Público (dev) | Disponible en guía; no referenciado directamente en módulos analizados |
| GET | `/api/v1/pacientes/search` | ApiConsultas | Paciente | Buscar por nombre | Query: `termino` (≥3 chars), `maxResults?` | Envelope `{ data: Paciente[] }` | Término, límite | Público (dev) | `encuestas/api/pacientesRepository.http.ts` → `searchPacientes` |
| GET | `/api/v1/atenciones` | ApiConsultas | Atención | Listar activas | Query: `servicioId?` | Envelope `{ data: Atencion[] }` | Servicio, solo activos (egreso NULL) | Público (dev) | Guía backend |
| GET | `/api/v1/atenciones/{id}` | ApiConsultas | Atención | Obtener por consecutivo | Path: `id` (int) | Envelope `{ data: Atencion }` | — | Público (dev) | Guía backend |
| GET | `/api/v1/atenciones/paciente` | ApiConsultas | Atención | Historial por paciente | Query: `numeroDocumento`, `tipoDocumento` | Envelope `{ data: Atencion[] }` | Documento + tipo | Público (dev) | `encuestas/api/pacientesRepository.http.ts` → `getAtencionesByPaciente` |
| GET | `/api/v1/atenciones/hospitalarias` | ApiConsultas | Atención hospitalaria | Censo dietas (pabellones 3–7) | — | Envelope `{ data: AtencionHospitalaria[] }` | Pabellón, activos | Público (dev) | `cargarCensoHospitalario.ts` → `getAtencionesHospitalarias`; `censoRepository.http.ts` |
| GET | `/health` | ApiConsultas | — | Health check | — | `Healthy` / `503` | — | Público | Guía backend |

### Proxy sugerido en ApiNegocio

ApiNegocio debería exponer equivalentes bajo `/api/dietas-cocina/censo/*` y `/api/encuestas/pacientes/*` que deleguen a ApiConsultas, aplicando caché, auditoría y permisos por rol.

---

## ApiNegocio — Endpoints sugeridos (112)

> **Nota:** Rutas inferidas de interfaces en `types/repositories.ts`, stubs HTTP con `TODO`, mutaciones en `CicloBandejasContext.tsx`, `DietasOperativasContext.tsx` y flujos de página. Los permisos siguen `dietas-cocina/lib/permisos.ts` y `encuestas/lib/permisos.ts`.

### A. Censo y sincronización (Dietas)

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/censo` | ApiNegocio | FilaDieta | Listar censo operativo fusionado | Query: `comida`, `servicio?`, `busqueda?` | `{ data: FilaDieta[], ultimaSincronizacion }` | Tiempo comida, servicio | Nutricionista, Doctor, Enfermera, Admin | `DietasOperativasContext.tsx`, `DietasPage.tsx` |
| POST | `/api/dietas-cocina/censo/sincronizar` | ApiNegocio | FilaDieta | Sincronizar con HIS | Body: `{ comida: TiempoComida }` | `{ data: { totalEnCenso, filas } }` | Comida activa | Nutricionista, Doctor, Admin | `sincronizarCenso()` en contexto; botón "Actualizar censo" en `DietasPage.tsx` |
| GET | `/api/dietas-cocina/censo/pacientes-hospitalizados` | ApiNegocio | Atención | Proxy censo HIS | Query: `comida?` | `{ data: Omit<FilaDieta,"id">[] }` | Comida | Nutricionista, Doctor, Admin | `CensoRepository.obtenerPacientesHospitalizados` en `types/repositories.ts` |

### B. Dietas operativas (solicitudes)

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/dietas` | ApiNegocio | FilaDieta | Listar dietas del día | Query: `comida`, `servicio?`, `estado?`, `busqueda?`, `soloPendientes?` | `{ data: FilaDieta[] }` | Comida, servicio, estado, búsqueda | Nutricionista, Doctor, Enfermera, Admin | `DietasPage.tsx` filtros L72–83 |
| GET | `/api/dietas-cocina/dietas/{id}` | ApiNegocio | FilaDieta | Detalle + trazabilidad | Path: `id` | `{ data: FilaDieta, eventos: EventoTrazabilidad[] }` | — | Nutricionista, Doctor, Enfermera, Admin | `DietasDetalleSheet.tsx`, tipo `EventoTrazabilidad` |
| PUT | `/api/dietas-cocina/dietas/{id}/solicitud` | ApiNegocio | FilaDieta | Crear/actualizar solicitud (guardado) | Body: `DatosSolicitudDieta` | `{ data: FilaDieta }` | — | Nutricionista, Doctor, Enfermera | `DietasSolicitudSheet.tsx` → `onGuardar`; estado `guardado` |
| POST | `/api/dietas-cocina/dietas/{id}/confirmar` | ApiNegocio | FilaDieta + OrdenCocina | Confirmar y enviar a cocina | — | `{ data: FilaDieta, ordenCocinaId }` | — | Nutricionista, Doctor, Enfermera | `confirmarDieta()` + `dietasRepository.confirmarDieta`; stub `POST .../confirmar` |
| POST | `/api/dietas-cocina/dietas/bulk/confirmar` | ApiNegocio | FilaDieta[] | Confirmación masiva | Body: `{ ids: string[] }` | `{ data: { confirmadas, enviadasCocina } }` | — | Nutricionista, Doctor | `confirmarSeleccionados()` en `DietasPage.tsx` |
| POST | `/api/dietas-cocina/dietas/{id}/novedad` | ApiNegocio | FilaDieta | Registrar novedad post-confirmación | Body: `DatosNovedadDieta` | `{ data: FilaDieta }` | — | Nutricionista, Doctor, Enfermera | `DietasNovedadSheet.tsx`; `puedeRegistrarNovedad()` |
| POST | `/api/dietas-cocina/dietas/{id}/cancelar` | ApiNegocio | FilaDieta | Cancelar dieta confirmada | Body: `{ motivo, justificacion, aceptaFacturacion? }` | `{ data: FilaDieta }` | — | Nutricionista, Doctor | `DietasCancelarDialog.tsx`; `puedeCancelarDieta()` |
| PATCH | `/api/dietas-cocina/dietas/bulk/consistencia` | ApiNegocio | FilaDieta[] | Asignación masiva consistencia | Body: `{ ids, consistencia }` | `{ data: { actualizadas } }` | — | Nutricionista, Doctor | `asignarConsistenciaMasiva()` en contexto; `DietasAsignarConsistenciaDialog.tsx` |
| GET | `/api/dietas-cocina/dietas/kpis` | ApiNegocio | KpiDieta | KPIs por comida | Query: `comida` | `{ data: KpiDieta[] }` | Comida | Nutricionista, Doctor, Enfermera | `calcularKpisDietas()` → `DietasKpiGrid.tsx` |
| GET | `/api/dietas-cocina/dietas/export` | ApiNegocio | FilaDieta | Export CSV selección | Query: `ids`, `comida` | `text/csv` | IDs seleccionados | Nutricionista, Doctor | `exportarSeleccionados()` en `DietasPage.tsx` |

### C. Catálogo dietas y tarifas

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/catalogo/dietas` | ApiNegocio | DietaCatalogo | Listar catálogo | Query: `estado?`, `busqueda?`, `page?`, `pageSize?` | `{ data: DietaCatalogo[], meta }` | Estado, búsqueda | Nutricionista, Admin | `DietasTarifasTabla.tsx`, `DietasTarifasPage.tsx` |
| GET | `/api/dietas-cocina/catalogo/dietas/{id}` | ApiNegocio | DietaCatalogo | Detalle catálogo | Path: `id` | `{ data: DietaCatalogo }` | — | Nutricionista, Admin | `EditarDietaSheet.tsx` |
| POST | `/api/dietas-cocina/catalogo/dietas` | ApiNegocio | DietaCatalogo | Crear dieta catálogo | Body: `DietaCatalogoFormValues` + tarifa inicial | `{ data: DietaCatalogo }` | — | Nutricionista, Admin | `CrearDietaSheet.tsx` |
| PUT | `/api/dietas-cocina/catalogo/dietas/{id}` | ApiNegocio | DietaCatalogo | Editar metadatos | Body: `DietaCatalogoFormValues` (codigo read-only) | `{ data: DietaCatalogo }` | — | Nutricionista, Admin | `EditarDietaSheet.tsx` |
| POST | `/api/dietas-cocina/catalogo/dietas/{id}/desactivar` | ApiNegocio | DietaCatalogo | Desactivar dieta | Body: `{ motivo? }` | `{ data: DietaCatalogo }` | — | Nutricionista, Admin | `DesactivarDietaDialog.tsx` |
| GET | `/api/dietas-cocina/catalogo/dietas/{id}/tarifas` | ApiNegocio | TarifaHistorico | Histórico tarifas | Path: `id` | `{ data: TarifaHistorico[] }` | — | Nutricionista, Admin | `HistoricoTarifasSheet.tsx`, `HistoricoTarifasTimeline.tsx` |
| POST | `/api/dietas-cocina/catalogo/dietas/{id}/tarifas` | ApiNegocio | TarifaHistorico | Nueva vigencia tarifaria | Body: `{ monto, fechaInicio }` | `{ data: DietaCatalogo }` | Validación solapamiento | Nutricionista, Admin | `NuevaTarifaSheet.tsx` → `validarSolapamientoVigencia` |
| GET | `/api/dietas-cocina/catalogo/dietas/siguiente-codigo` | ApiNegocio | — | Siguiente código autogenerado | — | `{ data: { codigo } }` | — | Nutricionista, Admin | prop `siguienteCodigo` en `CrearDietaSheet.tsx` |

### D. Ciclo bandejas — estado global

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/ciclo-bandejas` | ApiNegocio | EstadoCicloBandejas | Cargar estado completo | Query: `comida?`, `fecha?` | `{ data: { ordenes, etiquetas } }` | Comida, fecha operativa | Proveedor, Enfermera, Nutricionista | `cicloBandejasRepository.http.ts` TODO GET; `CicloBandejasContext.tsx` |
| PUT | `/api/dietas-cocina/ciclo-bandejas` | ApiNegocio | EstadoCicloBandejas | Persistir snapshot | Body: `EstadoCicloBandejas` | `204` | — | Proveedor, Enfermera | `cicloBandejasRepository.http.ts` TODO PUT; auto-save en contexto |

### E. Órdenes de cocina — CRUD y transiciones (PATCH)

> Las transiciones siguen `cicloBandejasValidaciones.ts`. Cada PATCH valida precondiciones en servidor.

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/ordenes` | ApiNegocio | OrdenCocina | Listar órdenes | Query: ver filtros cocina §F | `{ data: OrdenCocina[] }` | Pabellón, estado, etc. | Proveedor, Nutricionista | `CocinaTabla.tsx`, `CocinaProveedorView.tsx` |
| GET | `/api/dietas-cocina/ordenes/{id}` | ApiNegocio | OrdenCocina | Detalle orden + checklist | Path: `id` | `{ data: OrdenCocina }` | — | Proveedor | `CocinaDetalleSheet.tsx` |
| POST | `/api/dietas-cocina/ordenes` | ApiNegocio | OrdenCocina | Crear desde dieta confirmada | Body: `CrearOrdenDesdeDietaInput` | `{ data: { id } }` | Idempotente por paciente+comida | Sistema / Nutricionista | `dietasRepository.crearOrdenDesdeDieta`; stub `POST /ordenes` |
| PATCH | `/api/dietas-cocina/ordenes/{id}/estado` | ApiNegocio | OrdenCocina | Transición genérica | Body: `{ estadoCocina }` | `{ data: OrdenCocina }` | Máquina estados | Proveedor | Patrón unificado para transiciones |
| PATCH | `/api/dietas-cocina/ordenes/bulk/en-preparacion` | ApiNegocio | OrdenCocina[] | Iniciar preparación | Body: `{ ids: string[] }` | `{ data: OrdenCocina[] }` | `por_iniciar` → `en_preparacion` | Proveedor | `marcarEnPreparacion()` L178–187 |
| PATCH | `/api/dietas-cocina/ordenes/bulk/lista` | ApiNegocio | OrdenCocina[] | Marcar como lista | Body: `{ ids }` | `{ data }` | Requiere checklist completo | Proveedor | `marcarComoLista()` + `puedeMarcarLista()` |
| PATCH | `/api/dietas-cocina/ordenes/bulk/despacho` | ApiNegocio | OrdenCocina[] | Registrar despacho | Body: `{ ids }` | `{ data }` | Requiere etiqueta impresa | Proveedor | `registrarDespacho()` + `puedeDespachar()` |
| PATCH | `/api/dietas-cocina/ordenes/{id}/checklist/{checklistId}` | ApiNegocio | ChecklistItem | Toggle ítem checklist | Body: `{ completado: boolean }` | `{ data: OrdenCocina }` | Solo `por_iniciar`/`en_preparacion` | Proveedor | `actualizarChecklist()`; `puedeEditarChecklist()` |
| POST | `/api/dietas-cocina/ordenes/{id}/cancelar` | ApiNegocio | OrdenCocina | Cancelar orden cocina | — | `{ data: OrdenCocina }` | `por_iniciar`/`en_preparacion`/`lista` | Proveedor, Nutricionista | `cancelarOrdenCocina()` + `puedeCancelarOrdenCocina()` |
| GET | `/api/dietas-cocina/ordenes/kpis` | ApiNegocio | KpiCocina | KPIs cocina | Query: `comida?` | `{ data: KpiCocina[] }` | Comida | Proveedor | `CocinaKpiGrid.tsx` |

**Máquina de estados `estadoCocina`:**

```
por_iniciar → en_preparacion → lista → despachada → (cancelada en cualquier punto previo a despachada)
```

### F. Etiquetas y logística enfermería (PATCH)

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/etiquetas` | ApiNegocio | EtiquetaEnfermera | Listar etiquetas | Query: `comida?`, `estadoLogistica?`, `pabellon?` | `{ data: EtiquetaEnfermera[] }` | Múltiples | Proveedor, Enfermera | `EtiquetasProveedorView.tsx`, `EtiquetasEnfermeraView.tsx` |
| GET | `/api/dietas-cocina/etiquetas/buscar` | ApiNegocio | EtiquetaEnfermera | Buscar por código QR/manual | Query: `codigo` | `{ data: EtiquetaEnfermera }` | Código etiqueta | Enfermera | `buscarEtiquetaPorCodigo.ts`; flujos pre-entrega/entrega/devolución |
| POST | `/api/dietas-cocina/etiquetas/generar` | ApiNegocio | EtiquetaEnfermera[] | Generar desde órdenes listas | Body: `{ ordenIds: string[] }` | `{ data: { etiquetaIds } }` | Orden en `lista` | Proveedor | `generarEtiquetas()` L223–270 |
| PATCH | `/api/dietas-cocina/etiquetas/bulk/impresas` | ApiNegocio | EtiquetaEnfermera[] | Marcar impresas | Body: `{ etiquetaIds }` | `{ data }` | Estado `generada` | Proveedor | `marcarEtiquetasImpresas()` |
| PATCH | `/api/dietas-cocina/etiquetas/bulk/reimpresas` | ApiNegocio | EtiquetaEnfermera[] | Reimprimir | Body: `{ etiquetaIds }` | `{ data }` | Ya impresa | Proveedor | `reimprimirEtiquetas()` |
| GET | `/api/dietas-cocina/etiquetas/{id}/pdf` | ApiNegocio | — | PDF etiquetas lote | Query: `ids` | `application/pdf` | IDs | Proveedor | `generarPdfEtiquetas.ts` |
| PATCH | `/api/dietas-cocina/etiquetas/{id}/pre-entrega` | ApiNegocio | EtiquetaEnfermera | Confirmar recepción enfermería | Body: `{ recibidoPor? }` | `{ data }` | `impresa` + orden `despachada` | Enfermera | `confirmarPreEntrega()` + `puedeConfirmarPreEntrega()` |
| PATCH | `/api/dietas-cocina/etiquetas/{id}/entrega` | ApiNegocio | EtiquetaEnfermera | Confirmar entrega paciente | — | `{ data }` | `pre_entregada` | Enfermera | `confirmarEntrega()` + `puedeConfirmarEntrega()` |
| PATCH | `/api/dietas-cocina/etiquetas/{id}/devolucion` | ApiNegocio | EtiquetaEnfermera | Registrar devolución | Body: `ConfirmarDevolucionInput` | `{ data }` | `pre_entregada`/`entregada` | Enfermera | `DevolucionFlowPage.tsx`, tipo en `ciclo-bandejas.ts` |
| POST | `/api/dietas-cocina/etiquetas/{id}/foto-devolucion` | ApiNegocio | — | Subir evidencia fotográfica | `multipart/form-data` (JPG/PNG ≤5MB) | `{ data: { url } }` | — | Enfermera | `RegistroDevolucionForm.tsx` accept image |

**Máquina de estados `estadoLogistica`:**

```
generada → impresa → pre_entregada → entregada → devuelta
```

### G. Conciliación facturación

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/conciliacion` | ApiNegocio | FilaConciliacion | Listar líneas conciliación | Query: `busqueda?`, `numeroFactura?`, `periodo?`, `proveedor?` | `{ data: FilaConciliacion[], kpis }` | Texto, factura, periodo | Nutricionista, Admin | `useConciliacionFiltrada()` |
| GET | `/api/dietas-cocina/conciliacion/{id}` | ApiNegocio | DetalleConciliacion | Detalle comparativo | Path: `id` | `{ data: DetalleConciliacion }` | — | Nutricionista, Admin | `ConciliacionDetalleSheet.tsx` |
| PATCH | `/api/dietas-cocina/conciliacion/{id}/conciliado` | ApiNegocio | FilaConciliacion | Marcar conciliado manual | Body: `{ motivo, observaciones }` | `{ data: FilaConciliacion }` | obs ≥10 chars | Nutricionista, Admin | `onMarcarConciliado` + `validarResolucion()` |
| PATCH | `/api/dietas-cocina/conciliacion/{id}/pendiente-revision` | ApiNegocio | FilaConciliacion | Dejar pendiente revisión | Body: `{ motivo, observaciones }` | `{ data }` | — | Nutricionista, Admin | `onPendienteRevision` |
| GET | `/api/dietas-cocina/conciliacion/kpis` | ApiNegocio | — | KPIs agregados | Query: filtros conciliación | `{ data: Kpi[] }` | — | Nutricionista, Admin | `calcularKpisConciliacion()` |

### H. Reportes y dashboards

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/dashboard/nutricionista` | ApiNegocio | — | Dashboard inicio nutricionista | Query: `fecha?`, `comida?` | KPIs + distribución + actividad | Fecha operativa | Nutricionista, Doctor, Admin | `construirDashboardNutricionista.ts`, `NutricionistaDashboard.tsx` |
| GET | `/api/dietas-cocina/dashboard/proveedor` | ApiNegocio | — | Dashboard inicio proveedor | Query: `comida?` | KPIs progreso + alertas | Comida | Proveedor | `ProveedorDashboard.tsx` |
| GET | `/api/dietas-cocina/dashboard/enfermera` | ApiNegocio | — | Dashboard inicio enfermera | Query: `comida?`, `pabellon?` | KPIs + alertas clínicas | Pabellón | Enfermera | `construirDashboardEnfermera.ts`, `EnfermeraDashboard.tsx` |
| GET | `/api/dietas-cocina/reportes/nutricionista` | ApiNegocio | — | Reportes clínicos | Query: `FiltrosReportes` | KPIs, hitos, gráficos | desde/hasta/servicio/horario | Nutricionista, Admin | `ReportesNutricionistaView.tsx`, `reportesDesdeCiclo.ts` |
| GET | `/api/dietas-cocina/reportes/proveedor` | ApiNegocio | — | Reportes operativos proveedor | Query: `FiltrosReportes` | KPIs, hallazgos | Idem | Proveedor | `ReportesProveedorView.tsx` |

### I. Parámetros operativos

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/parametros/tiempos-comida` | ApiNegocio | TiempoComida config | Obtener ventanas operativas | — | `{ data: ComidaParam[] }` | — | Nutricionista, Admin | `mockTiempos.ts`, `TiemposComidaPanel.tsx` |
| PUT | `/api/dietas-cocina/parametros/tiempos-comida` | ApiNegocio | TiempoComida config | Actualizar ventanas/cierres | Body: formulario tiempos | `{ data }` | — | Nutricionista, Admin | `TiemposComidaFormulario.tsx`, `configTiemposStorage.ts` |
| GET | `/api/dietas-cocina/parametros/tipos-paciente` | ApiNegocio | Categoría edad | Listar categorías | — | `{ data: CategoriaEdad[] }` | — | Nutricionista, Admin | `CategoriasEdadTabla.tsx`, `ParametrosTiposPacienteContext.tsx` |
| PUT | `/api/dietas-cocina/parametros/tipos-paciente` | ApiNegocio | Categoría edad | CRUD categorías | Body: categorías | `{ data }` | — | Nutricionista, Admin | `TiposPacienteView.tsx` |
| POST | `/api/dietas-cocina/parametros/tipos-paciente/clasificar` | ApiNegocio | — | Simular clasificación edad | Body: `{ edad }` | `{ data: { categoria } }` | — | Nutricionista, Admin | `SimuladorClasificacion.tsx`, `clasificarEdadPaciente.ts` |

### J. Auditoría (Dietas)

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/auditoria` | ApiNegocio | Evento auditoría | Listar eventos | Query: `modulo?`, `resultado?`, `desde?`, `hasta?`, `usuario?` | `{ data: Evento[], meta }` | Módulo, resultado, fechas | Admin, Nutricionista | `AuditoriaTabla.tsx`, `AuditoriaFiltros.tsx` |
| GET | `/api/dietas-cocina/auditoria/{id}` | ApiNegocio | Evento auditoría | Detalle evento | Path: `id` | `{ data: DetalleAuditoria }` | — | Admin, Nutricionista | `AuditoriaDetalleSheet.tsx` |

### K. Usuarios y permisos (Dietas)

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/dietas-cocina/usuarios` | ApiNegocio | UsuarioModulo | Listar usuarios | Query: `rol?`, `estado?`, `page?`, `pageSize?` | `{ data: UsuarioModulo[], meta }` | Rol, estado, paginación | Admin | `UsuariosTabla.tsx`, `UsuariosFiltros.tsx` |
| POST | `/api/dietas-cocina/usuarios` | ApiNegocio | UsuarioModulo | Crear usuario | Body: `Omit<UsuarioModulo,"id">` | `{ data: UsuarioModulo }` | — | Admin | `NuevoUsuarioDialog.tsx` |
| PUT | `/api/dietas-cocina/usuarios/{id}` | ApiNegocio | UsuarioModulo | Editar usuario | Body: datos usuario | `{ data }` | — | Admin | `NuevoUsuarioDialog.tsx` modo edición |
| PATCH | `/api/dietas-cocina/usuarios/{id}/rol` | ApiNegocio | UsuarioModulo | Cambiar rol | Body: `{ rol: RolDietas }` | `{ data }` | — | Admin | `CambiarRolDialog.tsx` |
| PATCH | `/api/dietas-cocina/usuarios/{id}/estado` | ApiNegocio | UsuarioModulo | Activar/desactivar | Body: `{ estado }` | `{ data }` | — | Admin | `ConfirmarAccionDialog.tsx` |
| GET | `/api/dietas-cocina/roles/permisos` | ApiNegocio | — | Matriz permisos por rol | — | `{ data: Record<RolDietas, RutaDietas[]> }` | — | Admin | `RolesPermisosPanel.tsx`, `permisos.ts` |
| PUT | `/api/dietas-cocina/roles/{rol}/permisos` | ApiNegocio | — | Actualizar permisos rol | Body: `{ rutas: RutaDietas[] }` | `{ data }` | — | Admin | `EditarPermisosRolDialog.tsx` |

---

## ApiNegocio — Módulo Encuestas (sugeridos)

### L. Pacientes e identificación

> Rutas reales expuestas por `PacientesEncuestasController`.

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/v1/encuestas/pacientes/search` | ApiNegocio | Paciente | Búsqueda parcial | Query: `termino`, `maxResults?` | `{ data: BusquedaPacienteDto[], total }` | Término ≥3 | Encuestador, Admin | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| GET | `/api/v1/encuestas/pacientes/{cedula}/atenciones` | ApiNegocio | Atención | Atenciones paciente | Query: `tipoDocumento` | `{ data: AtencionPacienteDto[], total }` | Documento | Encuestador, Admin | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| POST | `/api/v1/encuestas/pacientes/identificar` | ApiNegocio | Paciente | Identificación captura | Body: `{ numeroDocumento, tipoDocumento, canal, numeroAtencion? }` | `{ data: PacienteContextoDto }` | — | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |

### M. Cuestionarios (editor)

> Rutas reales expuestas por `CuestionariosController`.

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/v1/encuestas/cuestionarios` | ApiNegocio | Cuestionario | Listar | Query: `estado?`, `canal?`, `busqueda?`, `page?`, `pageSize?` | `{ data: CuestionarioResumenDto[], meta }` | Estado, canal, búsqueda, paginación | Admin, Encuestador | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| GET | `/api/v1/encuestas/cuestionarios/{id}` | ApiNegocio | Cuestionario | Detalle con secciones | Path: `id` | `{ data: CuestionarioDetalleDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| POST | `/api/v1/encuestas/cuestionarios` | ApiNegocio | Cuestionario | Crear borrador | Body: `CuestionarioCreacionDto` | `{ data: CuestionarioDetalleDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| PUT | `/api/v1/encuestas/cuestionarios/{id}` | ApiNegocio | Cuestionario | Actualizar metadatos | Body: `CuestionarioActualizacionDto` | `{ data: CuestionarioDetalleDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| PATCH | `/api/v1/encuestas/cuestionarios/{id}/estado` | ApiNegocio | Cuestionario | Cambiar estado | Body: `CuestionarioEstadoDto` | `{ data: CuestionarioDetalleDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| POST | `/api/v1/encuestas/cuestionarios/{id}/duplicar` | ApiNegocio | Cuestionario | Duplicar | Body opcional: `CuestionarioDuplicadoDto` | `{ data: CuestionarioDetalleDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| DELETE | `/api/v1/encuestas/cuestionarios/{id}` | ApiNegocio | Cuestionario | Eliminar borrador | — | `204 NoContent` | Solo borrador | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| GET | `/api/v1/encuestas/cuestionarios/{id}/estructura` | ApiNegocio | SeccionCuestionarioDto[] | Árbol secciones/preguntas | — | `{ data: SeccionCuestionarioDto[] }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| PUT | `/api/v1/encuestas/cuestionarios/{id}/estructura` | ApiNegocio | SeccionCuestionarioDto[] | Guardar estructura completa | Body: `EstructuraCuestionarioDto` | `{ data: SeccionCuestionarioDto[] }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| POST | `/api/v1/encuestas/cuestionarios/{id}/preguntas` | ApiNegocio | PreguntaCuestionarioDto | Añadir pregunta | Body: `PreguntaCuestionarioCreacionDto` | `{ data: PreguntaCuestionarioDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| PUT | `/api/v1/encuestas/cuestionarios/{id}/preguntas/{preguntaId}` | ApiNegocio | PreguntaCuestionarioDto | Editar pregunta | Body: `PreguntaCuestionarioActualizacionDto` | `{ data: PreguntaCuestionarioDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |
| PUT | `/api/v1/encuestas/cuestionarios/{id}/preguntas/{preguntaId}/logica` | ApiNegocio | PreguntaCuestionarioDto | Configurar lógica | Body: `LogicaPreguntaCuestionarioDto` | `{ data: PreguntaCuestionarioDto }` | — | Admin | `backend/Bital.ApiNegocio/Controllers/CuestionariosController.cs` |

### N. Captura encuestas

> Rutas reales expuestas por `PacientesEncuestasController`.

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/v1/encuestas/captura/presencial/pendientes` | ApiNegocio | Paciente captura | Cola presencial | Query: `servicio?`, `pabellon?`, `estado?`, `busqueda?`, `page?`, `pageSize?` | `{ data: PacienteCapturaPresencialDto[], meta, kpis }` | Servicio, estado, búsqueda, paginación | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| POST | `/api/v1/encuestas/captura/presencial/{pacienteId}/iniciar` | ApiNegocio | Encuesta | Iniciar captura | Body: `{ cuestionarioId }` | `{ data: SeccionEncuestaDto[] }` | — | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| PUT | `/api/v1/encuestas/captura/{encuestaId}/respuestas` | ApiNegocio | Respuesta | Guardar respuestas parciales | Body: `GuardarRespuestasEncuestaRequestDto` | `{ data: { encuestaId, secciones } }` | — | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| POST | `/api/v1/encuestas/captura/{encuestaId}/completar` | ApiNegocio | Encuesta | Finalizar encuesta | Body: `FinalizarEncuestaRequestDto` | `{ data: FinalizarEncuestaResponseDto }` | Validación requeridas | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| GET | `/api/v1/encuestas/captura/telefonica/pendientes` | ApiNegocio | FilaCapturaTelefonica | Cola telefónica | Query: `busqueda?`, `tipoHospitalizacion?`, `servicio?`, `estado?`, `fechaCitaDesde?`, `fechaCitaHasta?`, `page?`, `pageSize?` | `{ data: FilaCapturaTelefonicaDto[], meta, kpis }` | Servicio, estado llamada | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| POST | `/api/v1/encuestas/captura/telefonica/{id}/intento` | ApiNegocio | IntentoLlamada | Registrar intento | Body: `IntentoLlamadaRequestDto` | `{ data: FilaCapturaTelefonicaDto }` | — | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |
| POST | `/api/v1/encuestas/captura/telefonica/{id}/iniciar-encuesta` | ApiNegocio | Encuesta | Iniciar tras aceptación | — | `{ data: RespuestaCapturaTelefonicaInicioDto }` | Resultado `acepta_encuesta` | Encuestador | `backend/Bital.ApiNegocio/Controllers/PacientesEncuestasController.cs` |

### O. Encuestas realizadas

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/v1/encuestas/realizadas` | ApiNegocio | FilaEncuestaRealizada | Listar encuestas | Query: filtros avanzados + `page`, `pageSize` | `{ data, meta: { total, page } }` | Fecha, servicio, canal, SAT/NPS | Admin, Encuestador | `EncuestasRealizadasTabla.tsx`, `FiltrosAvanzados.tsx` |
| GET | `/api/v1/encuestas/realizadas/{id}` | ApiNegocio | DetalleEncuestaRealizada | Detalle completo | Path: `id` | `{ data: DetalleEncuestaRealizada }` | — | Admin, Encuestador | `DetalleEncuestaSheet.tsx` |
| POST | `/api/v1/encuestas/realizadas/{id}/anular` | ApiNegocio | FilaEncuestaRealizada | Anular encuesta | Body: `{ motivo }` | `{ data }` | Motivo requerido + checkbox | Admin | `AnularEncuestaDialog.tsx` |

### P. Indicadores y brechas

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/v1/encuestas/indicadores/experiencia` | ApiNegocio | KpiExperiencia | KPIs experiencia | Query: rango, servicio, punto, eps, contrato, canal | `{ data: { kpis, segmentos } }` | Multiples | Admin, Encuestador | `mockIndicadoresExperiencia.ts`, `IndicadoresExperienciaTab.tsx` |
| GET | `/api/v1/encuestas/indicadores/experiencia/nivel-satisfaccion` | ApiNegocio | SegmentoBarra | Distribución SAT | Query: filtros | `{ data: SegmentoBarra[] }` | — | Admin | `NivelSatisfaccionChart.tsx` |
| GET | `/api/v1/encuestas/indicadores/brechas` | ApiNegocio | FilaBrecha | Análisis brechas | Query: filtros brechas | `{ data: FilaBrecha[], kpis }` | Servicio, estado brecha | Admin | `BrechasTabla.tsx`, `AnalisisBrechasTab.tsx` |

### Q. Parámetros encuestas

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/v1/encuestas/parametros/reglas` | ApiNegocio | Regla condicional | Listar reglas activas | — | `{ data: Regla[] }` | — | Admin | `ReglasActivasList.tsx` |
| POST | `/api/v1/encuestas/parametros/reglas` | ApiNegocio | Regla | Crear regla | Body: `NuevaRegla` | `{ data }` | — | Admin | `NuevaReglaForm.tsx` |
| PATCH | `/api/v1/encuestas/parametros/reglas/{id}/estado` | ApiNegocio | Regla | Activar/borrador | Body: `{ estado }` | `{ data }` | — | Admin | `ModoPruebaPanel.tsx` |
| GET | `/api/v1/encuestas/parametros/modo-prueba` | ApiNegocio | — | Estado modo prueba | — | `{ data: { activo } }` | — | Admin | `ModoPruebaPanel.tsx` |
| PUT | `/api/v1/encuestas/parametros/modo-prueba` | ApiNegocio | — | Toggle modo prueba | Body: `{ activo }` | `{ data }` | — | Admin | `ModoPruebaPanel.tsx` |

### R. Auditoría y usuarios (Encuestas)

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
|--------|----------|-----|---------|-----------|---------|----------|---------|---------|-------------------|
| GET | `/api/encuestas/auditoria` | ApiNegocio | Evento auditoría | Listar | Query: filtros | `{ data, meta }` | — | Admin | `auditoria/AuditoriaPage.tsx` |
| GET | `/api/encuestas/auditoria/{id}` | ApiNegocio | — | Detalle | Path: `id` | `{ data }` | — | Admin | `AuditoriaDetalleSheet.tsx` |
| GET | `/api/encuestas/usuarios` | ApiNegocio | Usuario | Listar | Query: rol, estado, page | `{ data, meta }` | Paginación | Admin | `usuarios/UsuariosTabla.tsx` |
| POST | `/api/encuestas/usuarios` | ApiNegocio | Usuario | Crear | Body: usuario | `{ data }` | — | Admin | Patrón análogo dietas |
| PATCH | `/api/encuestas/usuarios/{id}/rol` | ApiNegocio | Usuario | Cambiar rol | Body: `{ rol }` | `{ data }` | — | Admin | `CambiarRolDialog.tsx` |
| GET | `/api/encuestas/dashboard/inicio` | ApiNegocio | — | Dashboard inicio | — | KPIs inicio | — | Encuestador, Admin | `inicio/datos/mockInicio.ts`, `KpiCard.tsx` |

---

## Conteo ApiNegocio sugeridos

| Dominio | Endpoints |
|---------|-----------|
| Censo / dietas operativas | 13 |
| Catálogo tarifas | 8 |
| Ciclo bandejas + órdenes (PATCH) | 12 |
| Etiquetas logística (PATCH) | 10 |
| Conciliación | 5 |
| Reportes / dashboards | 5 |
| Parámetros dietas | 5 |
| Auditoría + usuarios dietas | 9 |
| Encuestas (pacientes → dashboard) | 45 |
| **Total** | **112** |

---

## Notas de diseño

1. **PATCH para transiciones:** El frontend modela el ciclo bandejas como mutaciones locales (`marcarEnPreparacion`, `confirmarDevolucion`, etc.). El backend debe exponer PATCH idempotentes con validación server-side equivalente a `cicloBandejasValidaciones.ts`.

2. **Envelope consistente:** ApiNegocio debe reutilizar el envelope `{ data, timestamp, version }` de ApiConsultas.

3. **Permisos:** Roles dietas definidos en `PERMISOS_POR_ROL_DEFAULT` (`permisos.ts`). Encuestas aún sin restricción granular — planificar antes de producción.

4. **Flag API:** `VITE_DIETAS_COCINA_API=true` activa repositorios HTTP (`api/index.ts`).

5. **Evidencia de stubs pendientes:**
   - `cicloBandejasRepository.http.ts`: `GET/PUT /api/dietas-cocina/ciclo-bandejas`
   - `dietasRepository.ts`: `POST confirmar`, `POST ordenes`
