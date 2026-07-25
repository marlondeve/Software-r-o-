# 12 — Preguntas para el equipo

> Decisiones abiertas identificadas durante la auditoría del frontend. Organizadas por módulo/tema.  
> **Nivel de certeza de la duda:** derivada de código scaffold, mocks o ausencia de implementación.

---

## A. Vital (HIS) vs Bital — límites de datos

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-VB-01** | ¿Qué campos de `FilaDieta` deben persistirse en Bital vs leerse siempre de Vital? | `FilaDieta` mezcla datos HIS (`pacienteId`, `idIngreso`, ubicación) con operativos (`tipoDieta`, `estado`, `observaciones`) | Modelo BD, DTOs ApiNegocio | Persistir solo solicitud/estado Bital; enriquecer con JOIN a ApiConsultas | `types/diets.ts`, `mapearAtencionHospitalariaAFilaDieta.ts` |
| **P-VB-02** | ¿El censo operativo es snapshot diario o tiempo real? | `ultimaSincronizacion` en storage local | Frecuencia job sync, cache | Snapshot por fecha operativa + sync manual/on-schedule | `EstadoDietasPersistido` en `types/tray-cycle.ts` |
| **P-VB-03** | ¿Servicio, pabellón, habitación, cama son maestros Vital o editables en Bital? | UI muestra campos HIS; novedades podrían cambiar ubicación | Endpoints catálogo vs read-only | Mantener ubicación autoritativa en Vital; Bital guarda override temporal si aplica traslado | `FilaDieta`, mock censo |
| **P-VB-04** | ¿Cómo mapear tipos de dieta Vital → catálogo Bital? | `ALIAS_TIPO_DIETA` en frontend es parcial | Tabla mapping, fallbacks | Tabla `diet_type_alias` administrable; fallback `"Normal"` como hoy | `resolverTarifaDieta.ts` |
| **P-VB-05** | ¿Usuarios con `origen: "Vital API"` se provisionan automáticamente? | Enum existe; flujo no implementado | SSO/provisioning | Sync LDAP/AD institucional; Bital solo complementa roles módulo | `types/users.ts`, `OrigenUsuario` |
| **P-VB-06** | ¿ApiConsultas seguirá siendo el único bridge o habrá integración directa? | Arquitectura documentada en prompt | Topología servicios | Mantener ApiConsultas read-only; ApiNegocio único punto frontend | `promt.md`, `backend/README.md` |
| **P-VB-07** | ¿Qué ocurre con dietas de pacientes dados de alta intradía? | No hay regla explícita de baja | Cancelación automática vs manual | Job que cancela solicitudes activas al detectar alta HIS | **Inferido** — censo sync |

---

## B. Permisos Encuestas no aplicados

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-ENC-01** | ¿Se aplicará la matriz `permisosEncuestas` de `configAccesoModulos.ts`? | `encuestas/lib/permisos.ts` ignora config y da acceso total | Guards backend encuestas | Alinear runtime con config; guard equivalente a `RequireDietasRuta` | Comentario explícito en permisos encuestas |
| **P-ENC-02** | ¿"Analista SIAO" y "Operador de encuestas" son roles distintos en producción? | Alias `Encuestador` en roles encuestas | Claims JWT separados | Dos roles con permisos diferenciados según config default | `encuestas/lib/roles.ts`, `configAccesoModulos.ts` |
| **P-ENC-03** | ¿Operador puede ver indicadores/brechas? | Config dice no; runtime dice sí | Endpoints analíticos | Denegar `encuestas.indicators.read` a Operador | Matriz sección 09 |
| **P-ENC-04** | ¿Quién edita cuestionarios vs quién captura? | Scaffold sin enforcement | CRUD cuestionarios vs captura | Analista/Admin: manage; Operador: respond only | `editor-cuestionario/`, captura flows |

---

## C. Administración scaffold (plataforma)

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-ADM-01** | ¿Los roles globales en `/administracion/roles` son plantillas o instancias por módulo? | `RolesPage` es `<SectionPage title="Roles" />` vacío | Modelo RBAC | Roles globales como templates; asignación por módulo en accesos | `features/administracion/roles/RolesPage.tsx` |
| **P-ADM-02** | ¿Super Admin puede restringirse a sí mismo? | No hay UI | Seguridad | Al menos 2 Super Admins; protección último admin | **Inferido** |
| **P-ADM-03** | ¿Config acceso módulos (`rolesConAcceso`) vive en BD o config institucional? | Hoy `localStorage` | Endpoint `platform.modules.configure` | BD con auditoría; eliminar localStorage en prod | `configAccesoModulos.ts` |
| **P-ADM-04** | ¿Administrador de módulo puede crear sub-roles custom? | Solo permisos sobre rutas fijas | Extensibilidad RBAC | Fase 1: rutas fijas; Fase 2: permisos granulares | `EditarPermisosRolDialog` |
| **P-ADM-05** | ¿Mock incluirá usuario Admin módulo sin Super Admin? | No existe en `authService.ts` | Testing RBAC | Agregar `admin-dietas@` con `esAdministrador: false` | `authService.ts`, prompt |

---

## D. Archivos y documentos

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-FILE-01** | ¿Dónde almacenar `fotoDevolucion` de devoluciones? | Campo `string` (URL/base64) en tipo | Storage, multipart | Blob storage (Azure/S3) + URL firmada; max 5MB JPEG/PNG | `EtiquetaEnfermera.fotoDevolucion` |
| **P-FILE-02** | ¿PDF etiquetas se genera client-side o server-side? | `generarPdfEtiquetas.ts` en frontend | Endpoint print service | Mantener client-side MVP; server-side para auditoría impresiones | `etiquetas/lib/generarPdfEtiquetas.ts` |
| **P-FILE-03** | ¿Se requiere evidencia fotográfica obligatoria en devolución? | Campo opcional en `ConfirmarDevolucionInput` | Validación 422 | Obligatorio para motivos "Error en cocina" — **Inferido** | `RegistroDevolucionForm.tsx` |
| **P-FILE-04** | ¿Exportación reportes: CSV, Excel, PDF? | UI reportes sin export real | Endpoints export | CSV para conciliación; PDF para firma gerencia | `reportes/` scaffold export |
| **P-FILE-05** | ¿Importación masiva catálogo dietas/tarifas? | No hay UI import | Bulk endpoints | Fase 2; inicialmente CRUD manual | **Inferido** |

---

## E. Ciclo operativo y concurrencia

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-CICLO-01** | ¿Una dieta confirmada genera exactamente una orden por comida/día? | No hay unique constraint visible | Idempotencia POST orden | UNIQUE `(patient_admission_id, meal_time, operational_date)` | `crearOrdenDesdeDieta` |
| **P-CICLO-02** | ¿Múltiples usuarios pueden editar misma orden cocina? | Estado en Context/localStorage | Optimistic locking | `version` o `etag` en orden | `CicloBandejasContext.tsx` |
| **P-CICLO-03** | ¿Cancelación dieta cancela orden activa automáticamente? | Flujos separados | Transacción cascada | Sí si orden no despachada | **Inferido** |
| **P-CICLO-04** | ¿Reimpresión etiqueta requiere motivo? | No hay campo motivo | Auditoría | Registrar motivo en audit log | `puedeReimprimirEtiqueta()` |

---

## F. Parámetros y reglas horarias

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-PARAM-01** | ¿Timezone institucional fijo (America/Bogota)? | Horas en formato HH:mm sin TZ | Validación ventanas | Config `operational_timezone` | `ParametrosTiempoComida` |
| **P-PARAM-02** | ¿Cancelación tardía bloquea o solo marca flag? | `cancelacionTardia` es boolean informativo | Política 403 vs 200+flag | Definir con nutrición: warn vs block | `esCancelacionTardia()` |
| **P-PARAM-03** | ¿Categorías edad solapadas permitidas en borrador? | `EstadoCategoria: borrador` | Validación publish | Solo una activa por rango al publicar | `clasificarEdadPaciente.ts` |

---

## G. Conciliación y facturación

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-CONC-01** | ¿Fuente "cantFact" es archivo proveedor o ERP? | Mock estático | Integración import | Endpoint upload + matching | `FilaConciliacion.cantFact` |
| **P-CONC-02** | ¿Conciliación manual requiere aprobación dual? | Un solo rol puede marcar `conciliado-manual` | Workflow | Admin + Nutricionista — **Inferido** | `EstadoConciliacion` |
| **P-CONC-03** | ¿Tarifa aplicada es la vigente a fecha entrega o preparación? | Resolución por tipo, no por fecha evento | Cálculo tarifa | Fecha operativa del ciclo comida | `resolverTarifaPorTipoDieta()` |

---

## H. Autenticación

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-AUTH-01** | ¿SSO institucional (Azure AD, SAML) o credenciales Bital? | Mock acepta cualquier password | OAuth2/OIDC | OIDC con Clínica del Río | `authService.ts` |
| **P-AUTH-02** | ¿Sesión JWT stateless o refresh tokens? | sessionStorage actual | Auth middleware | Access 15min + refresh httpOnly | — |
| **P-AUTH-03** | ¿Doctor es rol independiente o alias Nutricionista en backend? | `resolverRolPermisos` unifica | Modelo roles | Mismo permission set; distinto claim display | `roles.ts` |

---

## I. Encuestas — negocio SIAO (scaffold)

| ID | Pregunta | Motivo de la duda | Impacto en API | Recomendación preliminar | Evidencia |
| -- | -------- | ----------------- | -------------- | ------------------------ | --------- |
| **P-SIAO-01** | ¿Encuestas anónimas vs identificadas? | Flujo identificación paciente existe | Privacidad datos | Identificadas para internación; anónimas ambulatorio — **Pendiente** | `identificacion-paciente/` |
| **P-SIAO-02** | ¿Versionado cuestionario invalida respuestas en curso? | Editor permite cambios | Migración respuestas | Version semver; respuestas ligadas a versión | `editor-cuestionario/` |
| **P-SIAO-03** | ¿Integración indicadores con reportes regulatorios externos? | Solo mock Recharts | Export/API | **Pendiente definición** | `indicadores/` |

---

## Resumen

| Categoría | Preguntas |
| --------- | --------- |
| Vital vs Bital | 7 |
| Permisos Encuestas | 4 |
| Admin scaffold | 5 |
| Archivos | 5 |
| Ciclo operativo | 4 |
| Parámetros | 3 |
| Conciliación | 3 |
| Autenticación | 3 |
| Encuestas SIAO | 3 |
| **Total** | **37** |

### Prioridad de resolución

1. **Bloqueantes MVP Dietas:** P-VB-01, P-VB-04, P-CICLO-01, P-PARAM-02, P-AUTH-01
2. **Pre-producción:** P-FILE-01, P-ADM-03, P-CONC-01
3. **Módulo Encuestas:** P-ENC-01 a P-ENC-04, P-SIAO-*
