# 01 — Inventario de módulos, rutas y componentes

> **Alcance:** frontend React (`frontend/src/`), centrado en módulos **Dietas y Cocina** (prototipo funcional) y **Encuestas SIAO** (scaffold).  
> **Fuentes:** `app/router.tsx`, `modules/dietas-cocina/types/*`, `modules/encuestas/types/*`, `types/*`, repositorios y persistencia local.  
> **Fecha de auditoría:** 2026-07-25

---

## Resumen ejecutivo de conteos

| Métrica | Dietas y Cocina | Encuestas SIAO | Global / transversal |
|--------|-----------------|----------------|----------------------|
| Rutas registradas en router | 18 | 15 | 6 (login, módulos, admin×3, 404) |
| Páginas (`*Page.tsx`) | 15 | 14 | 4 (admin + login + selección) |
| Componentes TSX (aprox.) | 120 | 81 | — |
| Archivos de tipos centralizados | 13 | 12 | 5 |
| Interfaces / types de dominio | 37 | 29 | 6 |
| Enums / unions de dominio | 18 | 21 | 2 |
| Repositorios de módulo | 3 | 1 | — |
| Claves `localStorage` | 4 | 0 | 1 |
| Contextos React de estado operativo | 2 | 0 | 1 (`AuthProvider`) |
| Estado del módulo | **Funcional** (mock + localStorage + censo HTTP) | **Scaffold** (mock estático) | Admin: scaffold |

**Nivel de certeza:** Confirmado (conteos de archivos y router); Inferido (clasificación scaffold vs funcional en sub-flujos parciales).

---

## Arquitectura de navegación

```text
/login → /modulos → /dietas-cocina/* | /encuestas/*
                         ↓
              /administracion/* (RequireAdmin — Super Administrador)
```

**Evidencia:** `frontend/src/app/router.tsx`

---

## Guards y autorización

| Guard | Ubicación | Propósito | Módulos / rutas |
|-------|-----------|-----------|-----------------|
| `GuestRoute` | `features/autenticacion/components/GuestRoute.tsx` | Impide acceso autenticado a `/login` | Login |
| `RequireAuth` | `features/autenticacion/components/RequireAuth.tsx` | Sesión obligatoria | `/modulos`, módulos, admin |
| `RequireModuleAccess` | `features/autenticacion/components/RequireModuleAccess.tsx` | Acceso al módulo (`moduloId`) | `/dietas-cocina`, `/encuestas` |
| `RequireDietasRuta` | `features/autenticacion/components/RequireDietasRuta.tsx` | Permisos por rol y ruta Dietas | Hijas de `/dietas-cocina` |
| `RequireEnfermeraEtiquetas` | `modules/dietas-cocina/etiquetas/views/RequireEnfermeraEtiquetas.tsx` | Solo rol Enfermera en flujos de etiquetas | Subrutas `etiquetas/*` (enfermería) |
| `RequireAdmin` | `features/autenticacion/components/RequireAdmin.tsx` | `Usuario.esAdministrador === true` | `/administracion/*` |

**Permisos Dietas por rol (default):** `modules/dietas-cocina/lib/permisos.ts`, `lib/configAccesoModulos.ts`  
**Roles Dietas:** `Administrador`, `Nutricionista`, `Doctor`, `Proveedor`, `Enfermera` — `types/enums.ts`  
**Roles Encuestas:** `Administrador`, `Encuestador` — `modules/encuestas/types/enums.ts`

**Nivel de certeza:** Confirmado

---

## Variables de entorno y repositorios

| Variable | Efecto | Repositorio afectado |
|----------|--------|----------------------|
| `VITE_BITAL_API_BASE_URL` | Base URL ApiConsultas | Censo HTTP, pacientes Encuestas HTTP |
| `VITE_DIETAS_COCINA_API=true` | HTTP vs mock | `censoRepository`, `cicloBandejasRepository` |
| `VITE_ENCUESTAS_API=true` | HTTP vs mock | `pacientesRepository` |

### Dietas y Cocina — repositorios

| Repositorio | Interfaz | Implementaciones | Estado backend |
|-------------|----------|------------------|----------------|
| `censoRepository` | `CensoRepository` | `.mock.ts`, `.http.ts` | **Parcial** — HTTP usa `GET /atenciones/hospitalarias` vía ApiConsultas |
| `cicloBandejasRepository` | `CicloBandejasRepository` | `.mock.ts`, `.http.ts` | **Pendiente** — persistencia local + stub HTTP |
| `dietasRepository` | `DietasRepository` | `.http.ts` (stub TODO) | **Pendiente** — `confirmarDieta`, `crearOrdenDesdeDieta` |

**Evidencia:** `modules/dietas-cocina/api/index.ts`, `types/repositories.ts`, `api/dietasRepository.ts`

### Encuestas — repositorios

| Repositorio | Interfaz | Implementaciones | Estado backend |
|-------------|----------|------------------|----------------|
| `pacientesRepository` | `PacientesRepository` | `.mock.ts`, `.http.ts` | **Parcial** — HTTP delega a `@/api` (`Paciente`, `Atencion`) |

**Evidencia:** `modules/encuestas/api/index.ts`, `types/repositories.ts`

---

## Claves `localStorage`

| Clave | Archivo | Contenido | Migración backend |
|-------|---------|-----------|-------------------|
| `dietas-cocina-ciclo-bandejas` | `lib/cicloBandejasStorage.ts` | `OrdenCocina[]`, `EtiquetaEnfermera[]` | ApiNegocio — ciclo operativo |
| `dietas-cocina-operativas-mock-v1` | `lib/dietasStorage.ts` | `FilaDieta[]`, `ultimaSincronizacion` | ApiNegocio — censo operativo dietas |
| `dietas-cocina-operativas-api-v1` | `lib/dietasStorage.ts` | Idem (modo API) | ApiNegocio |
| `dietas-cocina-parametros-tiempos` | `parametros/lib/configTiemposStorage.ts` | `ConfigTiempos` | ApiNegocio — parámetros |
| `bital:config-acceso-modulos` | `lib/configAccesoModulos.ts` | Matriz acceso rol→ruta por módulo | ApiNegocio — configuración plataforma |

**Nivel de certeza:** Confirmado

---

## Contextos de estado operativo (Dietas)

| Contexto | Archivo | Entidades gestionadas | Persistencia |
|----------|---------|----------------------|--------------|
| `DietasOperativasContext` | `context/DietasOperativasContext.tsx` | `FilaDieta[]`, sincronización censo | `dietasStorage` + `censoRepository` |
| `CicloBandejasContext` | `context/CicloBandejasContext.tsx` | `OrdenCocina[]`, `EtiquetaEnfermera[]`, mutaciones ciclo | `cicloBandejasStorage` |

**Nivel de certeza:** Confirmado

---

# Módulo: Dietas y Cocina

**Prefijo de ruta:** `/dietas-cocina`  
**Layout:** `MainLayout` → `DietasCocinaLayout` → `RequireDietasRuta`  
**Estado general:** **Prototipo funcional** — flujo operativo completo en frontend con mocks, localStorage y censo HIS conectado.

---

## Mapa rutas → pantallas → componentes → tipos

### `/dietas-cocina/inicio` (index e `/inicio`)

| Elemento | Detalle |
|----------|---------|
| **Página** | `InicioPage` |
| **Dashboards por rol** | `NutricionistaDashboard`, `ProveedorDashboard`, `EnfermeraDashboard` |
| **Componentes compartidos** | `DashboardPageHeader`, `DashboardCard`, `CountdownCard`, `DonutChart`, `EstadoBadge`, `KpiCard` |
| **Tipos** | `EstadoDieta`, `TiempoComida`, `KpiDieta` (calculados), `RolDietas` |
| **Datos** | Mock por rol (`inicio/datos/mock*.ts`); KPIs derivados de `FilaDieta` / ciclo |
| **Estado** | Funcional (UI completa; datos mock/calculados) |

**Evidencia:** `inicio/InicioPage.tsx`, `inicio/dashboards/*`

---

### `/dietas-cocina/dietas`

| Elemento | Detalle |
|----------|---------|
| **Página** | `DietasPage` |
| **Componentes principales** | `DietasComidaTabs`, `DietasKpiGrid`, `DietasFiltros`, `DietasTabla`, `DietasBarraSeleccion`, `DietasSolicitudSheet`, `DietasDetalleSheet`, `DietasNovedadSheet`, `DietasCancelarDialog`, `DietasAsignarConsistenciaDialog` |
| **Tipos** | `FilaDieta`, `TiempoComida`, `EstadoDieta`, `ComidaTab`, `KpiDieta`, `EventoTrazabilidad`, `MotivoCancelacionId`, `MOTIVOS_NOVEDAD` |
| **Contexto** | `DietasOperativasContext`, `CicloBandejasContext` |
| **Operaciones** | Sincronizar censo, solicitar dieta, novedad, cancelar, asignar consistencia, confirmar → orden cocina |
| **Estado** | **Funcional** (persistencia local + censo HTTP opcional) |

**Evidencia:** `dietas/DietasPage.tsx`, `types/diets.ts`, `context/DietasOperativasContext.tsx`

---

### `/dietas-cocina/dietas-tarifas`

| Elemento | Detalle |
|----------|---------|
| **Página** | `DietasTarifasPage` |
| **Componentes** | `DietasTarifasTabla`, `CrearDietaSheet`, `EditarDietaSheet`, `DesactivarDietaDialog`, `NuevaTarifaSheet`, `HistoricoTarifasSheet`, `HistoricoTarifasTimeline`, `EstadoDietaCatalogoBadge`, `DietasTarifasAccionesPopover` |
| **Tipos** | `DietaCatalogo`, `TarifaHistorico`, `EstadoDietaCatalogo` |
| **Datos** | `datos/mockDietasTarifas.ts` |
| **Estado** | Funcional (CRUD mock en memoria/local) |

**Evidencia:** `dietas-tarifas/DietasTarifasPage.tsx`, `types/catalog.ts`

---

### `/dietas-cocina/cocina`

| Elemento | Detalle |
|----------|---------|
| **Página** | `CocinaPage` → `CocinaProveedorView` |
| **Componentes** | `CocinaKpiGrid`, `CocinaFiltrosBar`, `CocinaTabla`, `CocinaDetalleSheet`, `CocinaSeguimientoTimeline` |
| **Tipos** | `OrdenCocina`, `ChecklistItem`, `EstadoCocina`, `FiltrosCocina`, `KpiCocina`, `FiltroSeguimientoCocina` |
| **Contexto** | `CicloBandejasContext` |
| **Operaciones** | Cambiar estado cocina, checklist, despacho, generar etiquetas |
| **Estado** | **Funcional** |

**Evidencia:** `cocina/CocinaPage.tsx`, `types/kitchen.ts`

---

### `/dietas-cocina/etiquetas` (+ subrutas)

| Ruta | Página | Componentes clave | Tipos | Rol / guard |
|------|--------|-------------------|-------|-------------|
| `/etiquetas` (index) | `EtiquetasPage` → `EtiquetasEnfermeraIndex` / vista proveedor | `EtiquetasKpiGrid`, `EtiquetaCard`, `RecepcionProveedorPanel`, `EscannerEtiquetaPanel` | `EtiquetaDieta`, `EtiquetaEnfermera`, `KpiEtiqueta` | Proveedor / Enfermera |
| `/etiquetas/consulta/:codigo` | `EtiquetaConsultaPage` | `DetalleAsignacionPanel` | `EtiquetaEnfermera` | `RequireEnfermeraEtiquetas` |
| `/etiquetas/pre-entrega` | `PreEntregaFlowPage` | `BandejaResumenCard`, `OrdenCocinaContextoCard` | `EstadoLogisticaEtiqueta`, `ModoFlujoEtiqueta` | Enfermera |
| `/etiquetas/entrega` | `EntregaFlowPage` | Flujo entrega | `EtiquetaEnfermera` | Enfermera |
| `/etiquetas/devolucion` | `DevolucionFlowPage` | `RegistroDevolucionForm` | `ConfirmarDevolucionInput`, `MotivoDevolucion` | Enfermera |
| `/etiquetas/exito` | `CicloFinalizadoPage` | `CicloFinalizadoPanel` | — | Enfermera |

**Tipos adicionales:** `EstadoEtiqueta`, `EstadoLogisticaEtiqueta`, `MOTIVOS_DEVOLUCION`  
**Operaciones:** Imprimir PDF (`generarPdfEtiquetas.ts`), pre-entrega, entrega, devolución con foto  
**Estado:** **Funcional** (ciclo completo en contexto + localStorage)

**Evidencia:** `router.tsx` L94-138, `etiquetas/*`, `types/labels.ts`, `types/tray-cycle.ts`

---

### `/dietas-cocina/reportes`

| Elemento | Detalle |
|----------|---------|
| **Página** | `ReportesPage` → `ReportesNutricionistaView` / `ReportesProveedorView` |
| **Componentes** | `ReportesFiltros`, `ReportesCharts`, `LogisticaTimeline` |
| **Tipos** | `FiltrosReportes`, `ReportesKpi`, `ReportesChartItem`, `ReportesSegmento`, `ReportesEstadoDietas`, `ReportesHito` |
| **Datos** | Mock + derivados de ciclo (`lib/reportesDesdeCiclo.ts`) |
| **Estado** | Funcional (visualización; export demo) |

**Evidencia:** `reportes/ReportesPage.tsx`, `types/reports.ts`

---

### `/dietas-cocina/conciliacion`

| Elemento | Detalle |
|----------|---------|
| **Página** | `ConciliacionPage` |
| **Componentes** | `ConciliacionTabla`, `ConciliacionDetalleSheet`, `ConciliacionKpiGrid`, `EstadoConciliacionBadge` |
| **Tipos** | `FilaConciliacion`, `RegistroSistema`, `DetalleConciliacion`, `EstadoConciliacion` |
| **Datos** | Construido desde ciclo (`lib/construirConciliacionDesdeCiclo.ts`) |
| **Estado** | Funcional (cálculo frontend) |

**Evidencia:** `conciliacion/ConciliacionPage.tsx`, `types/reconciliation.ts`

---

### `/dietas-cocina/parametros/tiempos` y `/parametros/tipos-paciente`

| Ruta | Vista | Componentes | Tipos |
|------|-------|-------------|-------|
| `/parametros/tiempos` | `TiemposRestriccionesView` | `TiemposComidaPanel`, `TiemposComidaFormulario`, `SecuenciaOperativa`, `CargaAnticipadaCard` | `ParametrosTiempoComida`, `HitoTiempo`, `ConfigTiempos`, `TiempoComida`, `ModoCargaAnticipada` |
| `/parametros/tipos-paciente` | `TiposPacienteView` | `CategoriasEdadTabla`, `SimuladorClasificacion` | `CategoriaEdad`, `EstadoCategoria` |

**Persistencia:** `configTiemposStorage` (localStorage)  
**Estado:** Funcional (edición local; tipos paciente mock)

**Evidencia:** `parametros/views/*`, `types/parameters.ts`

---

### `/dietas-cocina/auditoria`

| Elemento | Detalle |
|----------|---------|
| **Página** | `AuditoriaPage` |
| **Componentes** | `AuditoriaFiltros`, `AuditoriaTabla`, `AuditoriaDetalleSheet`, `ResultadoAuditoriaBadge` |
| **Tipos** | `FilaAuditoria`, `DetalleAuditoria`, `CambioAuditoria`, `ModuloAuditoria`, `ResultadoAuditoria` |
| **Datos** | `auditoria/datos/mockAuditoria.ts` |
| **Estado** | Scaffold funcional (solo lectura mock) |

---

### `/dietas-cocina/usuarios`

| Elemento | Detalle |
|----------|---------|
| **Página** | `UsuariosRolesPage` |
| **Componentes** | `UsuariosTabla`, `RolesPermisosPanel`, `CambiarRolDialog`, `PermisosRolPopover` |
| **Tipos** | `UsuarioModulo`, `RolDietas`, `EstadoUsuario`, `OrigenUsuario` |
| **Estado** | Scaffold (gestión mock; validaciones en `usuarios/lib/permisosValidaciones.ts`) |

---

# Módulo: Encuestas SIAO

**Prefijo de ruta:** `/encuestas`  
**Layout:** `MainLayout module="encuestas"`  
**Estado general:** **Scaffold** — pantallas, navegación y tipos definidos; datos mock estáticos; sin persistencia operativa.

---

## Mapa rutas → pantallas → componentes → tipos

### `/encuestas/inicio`

| Elemento | Detalle |
|----------|---------|
| **Página** | `InicioPage` |
| **Componentes** | `DashboardPageHeader`, `KpiCard`, `DashboardCard`, `IndicadoresChart`, `EstadoCapturaBadge`, `ListaIconItem`, `DataTable` |
| **Tipos** | `EstadoCaptura`, `TipoCaptura` (enums) |
| **Datos** | `inicio/datos/mockInicio.ts` |
| **Estado** | Scaffold |

---

### `/encuestas/identificacion-paciente`

| **Página** | `IdentificacionPacientePage` |
| **Componentes** | `BusquedaPacienteCard`, `PacienteEncontradoCard` |
| **Tipos** | `PacienteEncontrado`, `CanalPaciente`, `PacientesRepository` → `Paciente`, `Atencion` (`@/api/types`) |
| **Estado** | Scaffold (búsqueda mock/HTTP parcial) |

---

### `/encuestas/captura-presencial`

| **Página** | `CapturaPresencialPage` |
| **Componentes** | Tabla pacientes presenciales, badges estado |
| **Tipos** | `PacientePresencial`, `EstadoPaciente` |
| **Estado** | Scaffold |

---

### `/encuestas/captura-telefonica`

| **Página** | `CapturaTelefonicaPage` |
| **Componentes** | `GestionLlamadaSheet`, tabla captura |
| **Tipos** | `FilaCapturaTelefonica`, `IntentoLlamada`, `EstadoLlamada`, `ResultadoLlamada` |
| **Estado** | Scaffold |

---

### `/encuestas/captura-encuesta` y `/captura-encuesta/registrada`

| Ruta | Página | Componentes | Tipos |
|------|--------|-------------|-------|
| `/captura-encuesta` | `CapturaEncuestaPage` | `CapturaEncuestaTopBar`, `EscalaSatisfaccionInput`, `OpcionUnicaInput`, `TextoLibreInput`, `RevisionFinalStep` | `SeccionEncuesta`, `TipoPreguntaEncuesta`, `ValorSatisfaccion`, `PacienteContextoEncuesta` |
| `/captura-encuesta/registrada` | `EncuestaRegistradaPage` | Confirmación post-registro | — |

**Estado:** Scaffold (wizard UI; sin POST real)

---

### `/encuestas/encuestas-realizadas`

| **Página** | `EncuestasRealizadasPage` |
| **Componentes** | `EncuestasRealizadasTabla`, `DetalleEncuestaSheet`, `AnularEncuestaDialog`, `EstadoEncuestaBadge` |
| **Tipos** | `FilaEncuestaRealizada`, `DetalleEncuestaRealizada`, `RespuestaEncuestaDetalle`, `EstadoEncuesta`, `CanalEncuesta`, `EstadoSincronizacion` |
| **Estado** | Scaffold |

---

### `/encuestas/cuestionarios` y `/cuestionarios/:id/editor`

| Ruta | Página | Componentes | Tipos |
|------|--------|-------------|-------|
| `/cuestionarios` | `CuestionariosPage` | `CuestionariosTabla`, `CuestionarioAccionesPopover` | `Cuestionario`, `EstadoCuestionario`, `CanalCuestionario` |
| `/cuestionarios/:id/editor` | `EditorCuestionarioPage` | `EstructuraPanel`, `PreguntaEditorPanel`, `ConfiguracionLogicaPanel` | `SeccionEditor`, `PreguntaEditor`, `OpcionRespuesta`, `LogicaCondicional`, `TipoRespuesta` |

**Estado:** Scaffold

---

### `/encuestas/indicadores` y `/encuestas/analisis-brechas`

| Ruta | Página | Componentes | Tipos |
|------|--------|-------------|-------|
| `/indicadores` | `IndicadoresPage` | `KpiExperienciaGrid`, `FiltrosExperiencia`, `TiemposEsperaSection`, `RecomendacionLista` | `KpiExperiencia`, `SegmentoBarra` |
| `/analisis-brechas` | `AnalisisBrechasPage` | `AnalisisBrechasTab`, `BrechasTabla`, `ContactoBadge` | `FilaBrecha`, `EstadoBrecha`, `ContactoBrecha`, `TonoMotivoBrecha` |

**Estado:** Scaffold

---

### `/encuestas/parametros`

| **Página** | `ParametrosPage` |
| **Componentes** | `NuevaReglaForm`, listado reglas |
| **Tipos** | `ReglaActiva`, `EstadoRegla` |
| **Estado** | Scaffold |

---

### `/encuestas/usuarios` y `/encuestas/auditoria`

| Ruta | Tipos principales | Estado |
|------|-------------------|--------|
| `/usuarios` | `UsuarioEncuestasModulo`, `RolEncuestas` | Scaffold |
| `/auditoria` | `FilaAuditoriaEncuesta`, `DetalleAuditoriaExtendido` | Scaffold |

---

# Tipos centralizados — índice por archivo

## `modules/dietas-cocina/types/`

| Archivo | Entidades / tipos exportados |
|---------|------------------------------|
| `enums.ts` | Unions de estado, roles, rutas, catálogos fijos (`MOTIVOS_*`) |
| `diets.ts` | `FilaDieta`, `ComidaTab`, `KpiDieta`, `EventoTrazabilidad` |
| `catalog.ts` | `DietaCatalogo`, `TarifaHistorico` |
| `kitchen.ts` | `OrdenCocina`, `ChecklistItem`, `FiltrosCocina`, `KpiCocina` |
| `labels.ts` | `EtiquetaDieta`, `EtiquetaEnfermera`, KPIs |
| `reconciliation.ts` | `FilaConciliacion`, `RegistroSistema`, `DetalleConciliacion` |
| `parameters.ts` | `ParametrosTiempoComida`, `HitoTiempo`, `CategoriaEdad`, `ConfigTiempos` |
| `reports.ts` | View models de reportes |
| `audit.ts` | `FilaAuditoria`, `DetalleAuditoria` |
| `users.ts` | `UsuarioModulo` |
| `tray-cycle.ts` | Estado ciclo, inputs, mutaciones |
| `repositories.ts` | Contratos de repositorio |

## `modules/encuestas/types/`

| Archivo | Entidades / tipos exportados |
|---------|------------------------------|
| `enums.ts` | Estados captura, encuesta, cuestionario, brechas, roles |
| `patients.ts` | `PacienteEncontrado`, `PacientePresencial`, `PacienteContextoEncuesta` |
| `capture.ts` | `FilaCapturaTelefonica`, `SeccionEncuesta`, `IntentoLlamada` |
| `questionnaires.ts` | `Cuestionario` |
| `questionnaire-editor.ts` | Editor: `PreguntaEditor`, `SeccionEditor`, lógica condicional |
| `completed-surveys.ts` | `FilaEncuestaRealizada`, `DetalleEncuestaRealizada` |
| `indicators.ts` | `KpiExperiencia`, `FilaBrecha` |
| `parameters.ts` | `ReglaActiva` |
| `audit.ts` | `FilaAuditoriaEncuesta`, `DetalleAuditoriaExtendido` |
| `users.ts` | `UsuarioEncuestasModulo` |
| `repositories.ts` | `PacientesRepository` |

## `frontend/src/types/` (transversal)

| Archivo | Tipos |
|---------|-------|
| `user.ts` | `Usuario` (auth mock) |
| `module.ts` | `ModuloId`, `AccesoModulo` |
| `pagination.ts` | `FiltrosPaginacion`, `RespuestaPaginada<T>` |
| `audit.ts` | `CamposAuditoriaBase`, `UsuarioAuditoriaResumen` |

## `@/api/types` (HIS / ApiConsultas)

| Tipo | Uso en frontend |
|------|-----------------|
| `Paciente` | Encuestas — búsqueda paciente |
| `Atencion` | Encuestas — atenciones por paciente |
| `AtencionHospitalaria` | Dietas — censo hospitalario (`mapearAtencionHospitalariaAFilaDieta`) |

---

## Matriz scaffold vs funcional (resumen)

| Área | Scaffold | Funcional |
|------|----------|-----------|
| **Dietas** | Auditoría, usuarios módulo, export demo | Censo, solicitud, ciclo cocina→etiquetas→entrega, tarifas mock, reportes, conciliación, parámetros tiempos |
| **Encuestas** | Todas las pantallas (mock estático) | — |
| **Admin plataforma** | Usuarios, roles, permisos globales | — |
| **Auth** | Mock completo | Guards operativos |

**Nivel de certeza:** Confirmado para Dietas (evidencia de contextos + localStorage + flujos); Confirmado para Encuestas (sin contexto operativo ni persistencia).

---

## Referencias cruzadas

- Entidades y campos detallados: `02-entidades-y-campos.md`
- Relaciones entre entidades: `03-relaciones.md`
- Catálogos y parámetros: `07-catalogos-y-parametros.md`
