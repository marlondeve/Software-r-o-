# 00 — Resumen ejecutivo

> Auditoría del frontend BITAL (`frontend/src/`) para especificación de **Bital.ApiNegocio** e integración con **Bital.ApiConsultas** (HIS Vital).  
> Cliente: Clínica del Río (Colombia). Fecha análisis: julio 2026.

---

## 1. Contexto arquitectónico

```text
Frontend React (5173)
      ↓
Bital.ApiNegocio (5042)     ← pendiente — contrato objetivo de este análisis
      ↓
Bital.ApiConsultas (5013)   ← implementada, read-only Vital
      ↓
SQL Server (Vital)
```

| Componente | Estado | Observación |
| ---------- | ------ | ----------- |
| Módulo Dietas y Cocina | **Prototipo funcional** | Único módulo con flujo operativo end-to-end (mock + localStorage) |
| Módulo Encuestas SIAO | **Scaffold** | Pantallas y navegación; datos mock |
| Administración plataforma | **Scaffold** | Solo Super Admin; páginas vacías (`SectionPage`) |
| Autenticación | **Mock** | `authService.ts` — sessionStorage |
| Integración HIS | **Parcial** | Censo vía `GET /atenciones/hospitalarias` |

**Fuente de verdad de dominio:** `frontend/src/modules/dietas-cocina/types/`, `frontend/src/types/`, `frontend/src/modules/encuestas/types/`

---

## 2. Doce métricas del análisis

| # | Métrica | Valor | Notas |
| - | ------- | ----- | ----- |
| 1 | **Módulos analizados** | **3** | dietas-cocina (completo), encuestas (scaffold), administración (scaffold) + shell compartido |
| 2 | **Pantallas analizadas** | **~42** | 42 archivos `*Page.tsx` únicos (excl. duplicados Windows); 51 paths con variantes |
| 3 | **Archivos TS/TSX revisados** | **393** | Todo `frontend/src/` |
| 4 | **Entidades identificadas** | **~28** | 13 tipos dietas-cocina + 12 encuestas + 3 globales (`Usuario`, `Modulo`, auditoría base) |
| 5 | **Campos totales estimados** | **~195** | Interfaces exportadas en `types/` + campos mock derivados |
| 6 | **Endpoints sugeridos** | **~85 ApiNegocio** + **7 ApiConsultas existentes** | Stubs TODO confirman 4 rutas dietas mínimas |
| 7 | **Catálogos identificados** | **16** | Tiempos comida, tipos dieta, tarifas, estados (dieta/cocina/etiqueta/conciliación), motivos cancelación/devolución/novedad, roles, rutas permisos, categorías edad, motivos aislamiento |
| 8 | **Reglas de negocio detectadas** | **52** | Documentadas en `08-reglas-de-negocio.md` |
| 9 | **Preguntas pendientes** | **37** | Documentadas en `12-preguntas-para-el-equipo.md` |
| 10 | **Principales inconsistencias** | **8** | Ver sección 4 |
| 11 | **Riesgos API** | **7 críticos** | Ver sección 5 |
| 12 | **Fases implementación** | **6 fases** | Ver sección 6 |

---

## 3. Hallazgos clave por módulo

### Dietas y Cocina (prioridad MVP)

Flujo operativo completo modelado en frontend:

```text
Censo HIS → Solicitud dieta → Confirmación → Orden cocina → Checklist →
Lista → Etiqueta → Impresión → Despacho → Pre-entrega → Entrega → Devolución → Conciliación
```

- **Persistencia actual:** `localStorage` (`cicloBandejasStorage`, `dietasStorage`, `configTiemposStorage`) — debe migrarse a ApiNegocio.
- **Validaciones críticas:** `cicloBandejasValidaciones.ts` (17 reglas transaccionales).
- **Integración HIS:** `mapearAtencionHospitalariaAFilaDieta.ts` — solo lectura paciente/ubicación.
- **Repositorios:** `dietasRepository.ts` y `cicloBandejasRepository.http.ts` con TODOs explícitos de endpoints.

### Encuestas SIAO

- 14 rutas definidas en router; UI navegable con mocks.
- Permisos **no enforced:** `encuestas/lib/permisos.ts` da acceso total a todos los roles.
- Sin stubs HTTP de negocio identificados (solo `pacientesRepository` hacia Consultas).

### Administración plataforma

- `/administracion/{usuarios,roles,permisos}` — componentes vacíos.
- Config acceso módulos funcional en UI pero persiste en `localStorage` (`configAccesoModulos.ts`).

---

## 4. Principales inconsistencias

| # | Inconsistencia | Impacto | Evidencia |
| - | -------------- | ------- | --------- |
| 1 | Permisos Encuestas config vs runtime | Operador accede a cuestionarios/indicadores sin restricción | `configAccesoModulos.ts` vs `encuestas/lib/permisos.ts` |
| 2 | Super Admin vs Admin módulo | Mock no distingue Admin módulo puro | `authService.ts`, `obtenerRolEnModulo()` |
| 3 | Doctor tratado como Nutricionista en permisos | Backend debe decidir si es rol separado | `resolverRolPermisos()` |
| 4 | Estado dieta UI vs estado persistido | Dos vocabularios (`confirmada` vs `por-iniciar` derivado) | `EstadoDieta`, `mapearEstadoDietaOrden.ts` |
| 5 | Alias tipos dieta incompletos | Tarifa incorrecta para tipos HIS no mapeados | `ALIAS_TIPO_DIETA` parcial |
| 6 | Ciclo bandejas monolítico PUT | Sin granularidad REST por transición | `cicloBandejasRepository.http.ts` |
| 7 | Config permisos en localStorage | No multi-dispositivo ni auditable | `bital:config-acceso-modulos` |
| 8 | Scaffold admin sin tipos | Sin contrato para roles globales | `RolesPage.tsx` vacío |

---

## 5. Riesgos para la construcción de la API

| Riesgo | Severidad | Mitigación |
| ------ | --------- | ---------- |
| **Reglas de ciclo solo en frontend** | Crítica | Replicar `cicloBandejasValidaciones.ts` en domain layer backend; tests por transición |
| **Mezcla datos Vital/Bital sin frontera** | Crítica | DTOs separados; ApiNegocio orquesta Consultas |
| **Concurrencia órdenes cocina** | Alta | Optimistic locking (`version`/`etag`); transacciones |
| **Tarifas sin fecha operativa** | Alta | Resolver tarifa por `(tipoDieta, fecha)` no solo por nombre |
| **Auditoría no implementada** | Alta | Tabla append-only desde MVP; especialmente tarifas y devoluciones |
| **Auth mock en producción** | Crítica | OIDC institucional antes de go-live |
| **Encuestas sin spec funcional** | Media | No implementar backend encuestas hasta resolver P-SIAO-* |

---

## 6. Orden recomendado de implementación backend

### Fase 0 — Fundación (2–3 semanas)

1. Autenticación OIDC/JWT (`platform.auth.*`)
2. Proxy ApiConsultas desde ApiNegocio (pacientes, atenciones hospitalarias)
3. Modelo RBAC: claims `platform.*`, `dietas-cocina.*`
4. Infraestructura auditoría (`audit_events`)

### Fase 1 — Censo y dietas (3–4 semanas)

1. `GET /dietas-cocina/dietas` — censo enriquecido (HIS + estado Bital)
2. `POST/PATCH /dietas-cocina/dietas` — solicitud, confirmación, novedad, cancelación
3. Reglas RN-DC-018–024, RN-DC-021–022 (ventanas horarias)
4. Job sync censo (`census.sync`)

### Fase 2 — Ciclo cocina y etiquetas (4–5 semanas)

1. `POST /ordenes`, transiciones prepare/checklist/complete/dispatch
2. Etiquetas: generate, print, pre-delivery, deliver, return
3. Reglas RN-DC-001–017 completas
4. Migración desde modelo monolítico `ciclo-bandejas` a recursos REST granulares

### Fase 3 — Catálogo, tarifas, parámetros (2–3 semanas)

1. CRUD `DietaCatalogo`, `TarifaHistorico` con histórico inmutable
2. `GET /catalogo/resolve` — reemplazar `resolverTarifaDieta.ts`
3. Parámetros tiempos comida y categorías edad
4. Reglas RN-DC-025–034

### Fase 4 — Reportes, conciliación, auditoría UI (2–3 semanas)

1. Endpoints reportes por rol (agregaciones)
2. Conciliación batch + resolución manual
3. `GET /audit` con filtros módulo/fecha
4. Storage evidencia devoluciones (P-FILE-01)

### Fase 5 — Administración módulo (1–2 semanas)

1. Usuarios módulo dietas-cocina
2. Permisos por rol (migrar de localStorage)
3. Config acceso módulos en BD (Super Admin)

### Fase 6 — Encuestas SIAO (pendiente definición funcional)

1. Resolver P-ENC-* y P-SIAO-* con equipo
2. Aplicar guards permisos encuestas
3. CRUD cuestionarios versionados + captura respuestas

---

## 7. Endpoints ApiConsultas ya disponibles

| Método | Endpoint | Uso frontend actual |
| ------ | -------- | ------------------- |
| GET | `/api/v1/atenciones/hospitalarias` | Censo dietas |
| GET | `/api/v1/pacientes/search` | Encuestas identificación |
| GET | `/api/v1/pacientes/{id}` | Detalle paciente |
| GET | `/api/v1/atenciones/{id}` | Detalle atención |
| GET | `/api/v1/atenciones/paciente` | Historial atenciones |
| GET | `/api/v1/pacientes/buscar` | Búsqueda alternativa |
| GET | `/health` | Health check |

**Regla:** Frontend producción **no** debe llamar ApiConsultas directamente; ApiNegocio expone facades.

---

## 8. Documentos generados en esta auditoría

| Archivo | Contenido |
| ------- | --------- |
| `00-resumen-ejecutivo.md` | Este documento |
| `08-reglas-de-negocio.md` | 52 reglas con ID, condiciones y recomendaciones |
| `09-roles-y-permisos.md` | 3 niveles jerárquicos + matriz `platform.*`, `dietas-cocina.*`, `encuestas.*` |
| `11-historicos-y-auditoria.md` | Entidades con historial y campos justificados |
| `12-preguntas-para-el-equipo.md` | 37 decisiones abiertas |
| `13-matriz-trazabilidad.md` | ~120 filas UI → entidad → endpoint |

Documentos complementarios sugeridos por el prompt original (no incluidos en esta entrega): `01`–`07`, `10`.

---

## 9. Recomendación final

Priorizar **Bital.ApiNegocio** con el flujo Dietas y Cocina como vertical slice MVP: autenticación → censo → solicitud → ciclo bandejas → auditoría mínima. No iniciar backend Encuestas ni administración global hasta cerrar las preguntas de `12-preguntas-para-el-equipo.md`.

El frontend ya define contratos implícitos robustos en `types/` y validaciones en `lib/` — el backend debe tratarlos como especificación normativa, no como sugerencias opcionales.
