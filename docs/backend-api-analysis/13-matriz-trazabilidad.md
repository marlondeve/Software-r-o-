# 13 — Matriz de trazabilidad

> Relación entre pantallas del frontend, acciones UI, entidades (`types/`), endpoints sugeridos y estado de implementación backend.  
> **Estados:** Confirmado | Inferido | Pendiente de definición | No encontrado  
> **API destino:** Negocio = Bital.ApiNegocio | Consultas = Bital.ApiConsultas (read-only Vital)

---

## Leyenda de entidades (fuente: `types/`)

| Entidad | Archivo tipo |
| ------- | ------------ |
| `FilaDieta` | `modules/dietas-cocina/types/diets.ts` |
| `DietaCatalogo` | `modules/dietas-cocina/types/catalog.ts` |
| `OrdenCocina` | `modules/dietas-cocina/types/kitchen.ts` |
| `EtiquetaEnfermera` | `modules/dietas-cocina/types/labels.ts` |
| `FilaConciliacion` | `modules/dietas-cocina/types/reconciliation.ts` |
| `FilaAuditoria` | `modules/dietas-cocina/types/audit.ts` |
| `UsuarioModulo` | `modules/dietas-cocina/types/users.ts` |
| `ParametrosTiempoComida` | `modules/dietas-cocina/types/parameters.ts` |
| `Usuario` | `types/user.ts` |

---

## 1. Autenticación y plataforma

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| platform | `/login` | `LoginPage` | Iniciar sesión | `Usuario` | email, accesos, esAdministrador | `/api/v1/auth/login` | POST | Pendiente de definición |
| platform | `/login` | `LoginPage` | Cerrar sesión | — | — | `/api/v1/auth/logout` | POST | Pendiente de definición |
| platform | `/modulos` | `SeleccionModuloPage` | Seleccionar módulo | `Usuario` | accesos[].moduloId | — | — | Confirmado (local) |
| platform | TopBar | `ConfiguracionAccesoModulosDialog` | Configurar acceso módulos | ConfigAccesoModulos | rolesConAcceso, permisosDietas | `/api/v1/platform/module-access` | PUT | Inferido |
| platform | `/administracion/usuarios` | `UsuariosPage` | Listar usuarios global | `Usuario` | * | `/api/v1/platform/users` | GET | No encontrado (scaffold) |
| platform | `/administracion/roles` | `RolesPage` | Gestionar roles | Rol | * | `/api/v1/platform/roles` | CRUD | No encontrado (scaffold) |
| platform | `/administracion/permisos` | `PermisosPage` | Matriz permisos | Permiso | * | `/api/v1/platform/permissions` | GET | No encontrado (scaffold) |

---

## 2. Dietas y Cocina — Inicio

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/inicio` | `NutricionistaDashboard` | Ver KPIs clínicos | KpiDieta | value, label | `/api/v1/dietas-cocina/dashboard/nutricionista` | GET | Inferido |
| dietas-cocina | `/inicio` | `ProveedorDashboard` | Ver KPIs cocina | KpiCocina | value | `/api/v1/dietas-cocina/dashboard/proveedor` | GET | Inferido |
| dietas-cocina | `/inicio` | `EnfermeraDashboard` | Ver KPIs entregas | KpiEnfermeraEtiqueta | value | `/api/v1/dietas-cocina/dashboard/enfermera` | GET | Inferido |
| dietas-cocina | `/inicio` | `EstadoBadge` | Mostrar estado | `FilaDieta` | estado | — | — | Confirmado (derivado) |

---

## 3. Dietas y Cocina — Gestión de dietas

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/dietas` | `DietasPage` | Listar censo operativo | `FilaDieta` | * | `/api/v1/dietas-cocina/dietas` | GET | Inferido |
| dietas-cocina | `/dietas` | `DietasKpiGrid` | KPIs por comida | KpiDieta | value | `/api/v1/dietas-cocina/dietas/kpis` | GET | Inferido |
| dietas-cocina | `/dietas` | `DietasComidaTabs` | Filtrar por comida | `FilaDieta` | comida | `?comida=` | GET | Confirmado |
| dietas-cocina | `/dietas` | `DietasTabla` | Buscar paciente | `FilaDieta` | paciente, habitacion | `?search=` | GET | Confirmado |
| dietas-cocina | `/dietas` | Toolbar | Actualizar censo HIS | `FilaDieta` | pacienteId, idIngreso, servicio | `/api/v1/atenciones/hospitalarias` | GET | Confirmado (ApiConsultas) |
| dietas-cocina | `/dietas` | `DietasSolicitudSheet` | Crear solicitud | `FilaDieta` | tipoDieta, consistencia, observaciones | `/api/v1/dietas-cocina/dietas` | POST | Inferido |
| dietas-cocina | `/dietas` | `DietasSolicitudSheet` | Editar solicitud | `FilaDieta` | tipoDieta, estado | `/api/v1/dietas-cocina/dietas/{id}` | PATCH | Inferido |
| dietas-cocina | `/dietas` | `DietasSolicitudSheet` | Confirmar dieta | `FilaDieta` | estado→confirmada | `/api/v1/dietas-cocina/dietas/{id}/confirmar` | POST | Confirmado (TODO stub) |
| dietas-cocina | `/dietas` | `DietasNovedadSheet` | Registrar novedad | `FilaDieta` | tipoDieta, observaciones | `/api/v1/dietas-cocina/dietas/{id}/novedad` | POST | Inferido |
| dietas-cocina | `/dietas` | `DietasCancelarDialog` | Cancelar dieta | `FilaDieta` | estado, cancelacionTardia | `/api/v1/dietas-cocina/dietas/{id}/cancelar` | PATCH | Inferido |
| dietas-cocina | `/dietas` | `DietasDetalleSheet` | Ver trazabilidad | `EventoTrazabilidad` | titulo, fecha | `/api/v1/dietas-cocina/dietas/{id}/timeline` | GET | Inferido |
| dietas-cocina | `/dietas` | `DietasTabla` | Acciones fila | `FilaDieta` | estado | — | — | Confirmado (`dietasAcciones.ts`) |

---

## 4. Dietas y Cocina — Catálogo y tarifas

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/dietas-tarifas` | `DietasTarifasTabla` | Listar catálogo | `DietaCatalogo` | nombre, tarifaVigente, estado | `/api/v1/dietas-cocina/catalogo` | GET | Inferido |
| dietas-cocina | `/dietas-tarifas` | `CrearDietaSheet` | Crear dieta | `DietaCatalogo` | codigo, nombre, descripcion | `/api/v1/dietas-cocina/catalogo` | POST | Inferido |
| dietas-cocina | `/dietas-tarifas` | `EditarDietaSheet` | Editar dieta | `DietaCatalogo` | nombre, descripcion | `/api/v1/dietas-cocina/catalogo/{id}` | PATCH | Inferido |
| dietas-cocina | `/dietas-tarifas` | `DesactivarDietaDialog` | Desactivar | `DietaCatalogo` | activa | `/api/v1/dietas-cocina/catalogo/{id}/deactivate` | PATCH | Inferido |
| dietas-cocina | `/dietas-tarifas` | `NuevaTarifaSheet` | Nueva tarifa | `TarifaHistorico` | monto, vigenciaDesde, motivoCambio | `/api/v1/dietas-cocina/catalogo/{id}/tariffs` | POST | Inferido |
| dietas-cocina | `/dietas-tarifas` | `HistoricoTarifasSheet` | Ver histórico | `TarifaHistorico` | * | `/api/v1/dietas-cocina/catalogo/{id}/tariffs` | GET | Inferido |
| dietas-cocina | — | `resolverTarifaPorTipoDieta` | Resolver tarifa | `DietaCatalogo` | tarifaVigente | `/api/v1/dietas-cocina/catalogo/resolve` | GET | Inferido |

---

## 5. Dietas y Cocina — Cocina y seguimiento

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/cocina` | `CocinaTabla` | Listar órdenes | `OrdenCocina` | * | `/api/v1/dietas-cocina/ordenes` | GET | Inferido |
| dietas-cocina | `/cocina` | `CocinaFiltrosBar` | Filtrar órdenes | `OrdenCocina` | pabellon, estadoCocina | `?pabellon=&estado=` | GET | Confirmado |
| dietas-cocina | `/cocina` | `CocinaTabla` | Iniciar preparación | `OrdenCocina` | estadoCocina→en_preparacion | `/api/v1/dietas-cocina/ordenes/{id}/prepare` | PATCH | Inferido |
| dietas-cocina | `/cocina` | Checklist UI | Actualizar checklist | `ChecklistItem` | completado | `/api/v1/dietas-cocina/ordenes/{id}/checklist` | PATCH | Inferido |
| dietas-cocina | `/cocina` | `CocinaTabla` | Marcar lista | `OrdenCocina` | estadoCocina→lista | `/api/v1/dietas-cocina/ordenes/{id}/complete` | PATCH | Inferido |
| dietas-cocina | `/cocina` | `CocinaTabla` | Despachar | `OrdenCocina` | estadoCocina→despachada | `/api/v1/dietas-cocina/ordenes/{id}/dispatch` | PATCH | Inferido |
| dietas-cocina | `/cocina` | `CocinaDetalleSheet` | Timeline seguimiento | `OrdenCocina` | paso activo | `/api/v1/dietas-cocina/ordenes/{id}` | GET | Inferido |
| dietas-cocina | `/cocina` | — | Crear orden desde dieta | `OrdenCocina` | * | `/api/v1/dietas-cocina/ordenes` | POST | Confirmado (TODO stub) |
| dietas-cocina | — | `CicloBandejasContext` | Persistir ciclo | `EstadoCicloBandejas` | ordenes, etiquetas | `/api/v1/dietas-cocina/ciclo-bandejas` | GET/PUT | Confirmado (TODO stub) |

---

## 6. Dietas y Cocina — Etiquetas

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/etiquetas` | `EtiquetasProveedorView` | Listar etiquetas | `EtiquetaEnfermera` | codigo, estado | `/api/v1/dietas-cocina/etiquetas` | GET | Inferido |
| dietas-cocina | `/etiquetas` | Proveedor actions | Generar etiqueta | `EtiquetaEnfermera` | codigo, qrPayload | `/api/v1/dietas-cocina/ordenes/{id}/labels` | POST | Inferido |
| dietas-cocina | `/etiquetas` | Proveedor actions | Imprimir PDF | `EtiquetaDieta` | * | — (client PDF) | — | Confirmado |
| dietas-cocina | `/etiquetas` | Proveedor actions | Marcar impresa | `EtiquetaEnfermera` | estado, estadoLogistica | `/api/v1/dietas-cocina/etiquetas/{id}/print` | PATCH | Inferido |
| dietas-cocina | `/etiquetas/pre-entrega` | `PreEntregaFlowPage` | Confirmar pre-entrega | `EtiquetaEnfermera` | recibidoPor, horaPreEntrega | `/api/v1/dietas-cocina/etiquetas/{id}/pre-delivery` | PATCH | Inferido |
| dietas-cocina | `/etiquetas/entrega` | `EntregaFlowPage` | Confirmar entrega | `EtiquetaEnfermera` | horaEntrega | `/api/v1/dietas-cocina/etiquetas/{id}/deliver` | PATCH | Inferido |
| dietas-cocina | `/etiquetas/devolucion` | `DevolucionFlowPage` | Confirmar devolución | `EtiquetaEnfermera` | motivoDevolucion, fotoDevolucion | `/api/v1/dietas-cocina/etiquetas/{id}/return` | PATCH | Inferido |
| dietas-cocina | `/etiquetas/consulta/:codigo` | `EtiquetaConsultaPage` | Buscar por QR/código | `EtiquetaEnfermera` | codigo | `/api/v1/dietas-cocina/etiquetas/by-code/{codigo}` | GET | Inferido |
| dietas-cocina | `/etiquetas` | `EscannerEtiquetaPanel` | Escanear código | `EtiquetaEnfermera` | codigo | `/api/v1/dietas-cocina/etiquetas/by-code/{codigo}` | GET | Inferido |

---

## 7. Dietas y Cocina — Reportes y conciliación

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/reportes` | `ReportesNutricionistaView` | Reportes clínicos | Reporte | * | `/api/v1/dietas-cocina/reports/clinical` | GET | Inferido |
| dietas-cocina | `/reportes` | `ReportesProveedorView` | Reportes proveedor | Reporte | * | `/api/v1/dietas-cocina/reports/provider` | GET | Inferido |
| dietas-cocina | `/conciliacion` | `ConciliacionTabla` | Listar conciliación | `FilaConciliacion` | cantSist, cantFact, estado | `/api/v1/dietas-cocina/reconciliation` | GET | Inferido |
| dietas-cocina | `/conciliacion` | `ConciliacionDetalleSheet` | Ver detalle diff | `DetalleConciliacion` | registros | `/api/v1/dietas-cocina/reconciliation/{id}` | GET | Inferido |
| dietas-cocina | `/conciliacion` | Acciones manual | Conciliar manual | `FilaConciliacion` | estado→conciliado-manual | `/api/v1/dietas-cocina/reconciliation/{id}/resolve` | PATCH | Inferido |

---

## 8. Dietas y Cocina — Parámetros

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/parametros/tiempos` | `TiemposComidaPanel` | Config tiempos comida | `ParametrosTiempoComida` | ventanaCambios, hitos | `/api/v1/dietas-cocina/params/meal-times` | GET/PUT | Inferido |
| dietas-cocina | `/parametros/tiempos` | `CargaAnticipadaCard` | Modo carga | `ConfigTiempos` | modoCarga | `/api/v1/dietas-cocina/params/meal-times` | PUT | Inferido |
| dietas-cocina | `/parametros/tipos-paciente` | `CategoriasEdadTabla` | CRUD categorías | `CategoriaEdad` | rangoMin, rangoMax | `/api/v1/dietas-cocina/params/age-categories` | CRUD | Inferido |
| dietas-cocina | `/parametros/tipos-paciente` | `SimuladorClasificacion` | Simular clasificación | `CategoriaEdad` | regla | `/api/v1/dietas-cocina/params/age-categories/classify` | POST | Inferido |

---

## 9. Dietas y Cocina — Auditoría y usuarios

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/auditoria` | `AuditoriaTabla` | Listar eventos | `FilaAuditoria` | accion, resultado | `/api/v1/dietas-cocina/audit` | GET | Inferido |
| dietas-cocina | `/auditoria` | `AuditoriaDetalleSheet` | Ver detalle | `DetalleAuditoria` | justificacion, impacto | `/api/v1/dietas-cocina/audit/{id}` | GET | Inferido |
| dietas-cocina | `/auditoria` | `AuditoriaFiltros` | Filtrar auditoría | `FilaAuditoria` | modulo, fecha | `?module=&from=&to=` | GET | Confirmado |
| dietas-cocina | `/usuarios` | `UsuariosRolesPage` | Listar usuarios módulo | `UsuarioModulo` | rol, estado | `/api/v1/dietas-cocina/users` | GET | Inferido |
| dietas-cocina | `/usuarios` | Roles panel | Cambiar rol | `UsuarioModulo` | rol | `/api/v1/dietas-cocina/users/{id}/role` | PATCH | Inferido |
| dietas-cocina | `/usuarios` | Permisos panel | Editar permisos rol | ConfigAccesoModulos | permisosDietas | `/api/v1/dietas-cocina/roles/{rol}/permissions` | PUT | Inferido |

---

## 10. Encuestas SIAO (scaffold)

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| encuestas | `/inicio` | `InicioPage` | Dashboard | — | — | `/api/v1/encuestas/dashboard` | GET | No encontrado |
| encuestas | `/identificacion-paciente` | `IdentificacionPacientePage` | Buscar paciente | PacienteEncuesta | documento | `/api/v1/pacientes/search` | GET | Confirmado (Consultas) |
| encuestas | `/captura-presencial` | `CapturaPresencialPage` | Iniciar captura | Encuesta | — | `/api/v1/encuestas/surveys` | POST | No encontrado |
| encuestas | `/captura-telefonica` | `CapturaTelefonicaPage` | Captura teléfono | Encuesta | — | `/api/v1/encuestas/surveys` | POST | No encontrado |
| encuestas | `/captura-encuesta` | `CapturaEncuestaPage` | Wizard respuestas | RespuestaEncuesta | * | `/api/v1/encuestas/surveys/{id}/answers` | PUT | No encontrado |
| encuestas | `/encuestas-realizadas` | `EncuestasRealizadasPage` | Listar realizadas | EncuestaRealizada | * | `/api/v1/encuestas/surveys` | GET | No encontrado |
| encuestas | `/cuestionarios` | `CuestionariosPage` | Listar cuestionarios | Cuestionario | titulo, estado | `/api/v1/encuestas/questionnaires` | GET | No encontrado |
| encuestas | `/cuestionarios/:id/editor` | `EditorCuestionarioPage` | Editar cuestionario | Cuestionario | preguntas | `/api/v1/encuestas/questionnaires/{id}` | PUT | No encontrado |
| encuestas | `/indicadores` | `IndicadoresPage` | Ver indicadores | Indicador | valor | `/api/v1/encuestas/indicators` | GET | No encontrado |
| encuestas | `/analisis-brechas` | `AnalisisBrechasPage` | Análisis brechas | Brecha | * | `/api/v1/encuestas/gap-analysis` | GET | No encontrado |
| encuestas | `/parametros` | `ParametrosPage` | Reglas parametrización | ParametroRegla | * | `/api/v1/encuestas/params` | GET/PUT | No encontrado |
| encuestas | `/auditoria` | `AuditoriaPage` | Auditoría encuestas | FilaAuditoriaEncuesta | * | `/api/v1/encuestas/audit` | GET | No encontrado |
| encuestas | `/usuarios` | `UsuariosRolesPage` | Usuarios módulo | UsuarioModuloEncuestas | rol | `/api/v1/encuestas/users` | GET | No encontrado |

---

## 11. Integración HIS (ApiConsultas — existentes)

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |
| dietas-cocina | `/dietas` | Censo sync | Atenciones hospitalarias | AtencionHIS | paciente, ubicación | `/api/v1/atenciones/hospitalarias` | GET | Confirmado |
| encuestas | `/identificacion-paciente` | Búsqueda | Buscar paciente | PacienteHIS | documento, nombre | `/api/v1/pacientes/search` | GET | Confirmado |
| * | — | Health | Health check | — | — | `/health` | GET | Confirmado |
| * | — | — | Atención por ID | AtencionHIS | * | `/api/v1/atenciones/{id}` | GET | Confirmado |
| * | — | — | Atenciones por paciente | AtencionHIS[] | * | `/api/v1/atenciones/paciente` | GET | Confirmado |

---

## 12. Resumen por estado

| Estado | Filas aprox. | % |
| ------ | ------------ | - |
| Confirmado | 18 | 15% |
| Inferido | 62 | 52% |
| Pendiente de definición | 4 | 3% |
| No encontrado (scaffold) | 18 | 15% |
| Confirmado local/mock | 18 | 15% |
| **Total filas** | **~120** | 100% |

---

## 13. Endpoints prioritarios MVP (derivados de matriz)

1. `POST /api/v1/auth/login`
2. `GET /api/v1/atenciones/hospitalarias` (existente — vía ApiNegocio proxy)
3. `GET|POST|PATCH /api/v1/dietas-cocina/dietas/*`
4. `POST /api/v1/dietas-cocina/ordenes`
5. `PATCH /api/v1/dietas-cocina/ordenes/{id}/*` (prepare, checklist, complete, dispatch)
6. `POST|PATCH /api/v1/dietas-cocina/etiquetas/*`
7. `GET|PUT /api/v1/dietas-cocina/catalogo/*`
8. `GET|PUT /api/v1/dietas-cocina/params/*`
9. `GET /api/v1/dietas-cocina/audit`
