# 11 — Históricos y auditoría

> **Fuente de verdad:** `frontend/src/types/audit.ts`, `frontend/src/modules/dietas-cocina/types/audit.ts`, `frontend/src/modules/dietas-cocina/types/catalog.ts` (`TarifaHistorico`), `frontend/src/modules/dietas-cocina/types/diets.ts` (`EventoTrazabilidad`), `frontend/src/modules/encuestas/types/audit.ts`

---

## 1. Campos estándar de auditoría

### 1.1 Base transversal (`types/audit.ts`)

```typescript
interface CamposAuditoriaBase {
  createdAt?: string      // ISO 8601 datetime
  createdBy?: string      // UUID usuario o identificador SSO
  updatedAt?: string
  updatedBy?: string
  deletedAt?: string      // Soft delete
  deletedBy?: string
  isActive?: boolean      // Eliminación lógica
}
```

**Cuándo aplicar:** Entidades maestras administrables, catálogos, parámetros, usuarios.

**Cuándo NO aplicar automáticamente:** DTOs de lectura HIS, KPIs calculados, registros append-only de eventos (usar solo `createdAt`/`createdBy`).

### 1.2 Resumen usuario auditoría

```typescript
interface UsuarioAuditoriaResumen {
  nombre: string
  rol: string
  iniciales: string
  esSistema?: boolean     // Jobs automáticos, integración Vital
}
```

---

## 2. Entidades que requieren historial

### 2.1 Dietas y Cocina — historial obligatorio

| Entidad | Tipo historial | Campos clave | Justificación | Evidencia frontend |
| ------- | -------------- | ------------ | ------------- | ------------------ |
| **DietaCatalogo** | Versionado tarifas | `historicoTarifas: TarifaHistorico[]` | Conciliación financiera; trazabilidad contractual proveedor | `types/catalog.ts`, `HistoricoTarifasSheet` |
| **TarifaHistorico** | Append-only por vigencia | `vigenciaDesde`, `vigenciaHasta`, `monto`, `motivoCambio`, `registradoPor`, `vigente` | Una tarifa vigente; auditoría cambios precio | `validarSolapamientoVigencia()` |
| **FilaDieta / SolicitudDieta** | Timeline eventos | `EventoTrazabilidad[]`, cambios estado | Responsabilidad clínica; novedades y cancelaciones | `types/diets.ts`, `DietasDetalleSheet` |
| **OrdenCocina** | Transiciones estado + checklist | `estadoCocina`, snapshots checklist | Cadena custodia alimentaria | `CicloBandejasContext`, validaciones ciclo |
| **EtiquetaEnfermera** | Logística completa | `estadoLogistica`, `horaPreEntrega`, `horaEntrega`, `horaDevolucion`, `recibidoPor` | Trazabilidad entrega/devolución | `types/labels.ts` |
| **Devolución** | Evidencia + motivo | `motivoDevolucion`, `observacionesDevolucion`, `fotoDevolucion` | Reclamos, calidad, facturación | `ConfirmarDevolucionInput` |
| **ParametrosTiempoComida** | Cambios ventanas horarias | Ventanas, hitos, activo/inactivo | Impacto cancelación tardía (RN-DC-021) | `types/parameters.ts` |
| **CategoriaEdad** | CRUD categorías | Rangos, estado borrador/activo | Clasificación paciente pediátrico/adulto | `mockTiposPaciente.ts` |
| **FilaConciliacion** | Resolución manual | `estado: conciliado-manual` | Evidencia ajuste facturación | `types/reconciliation.ts` |
| **UsuarioModulo** | Cambios rol/estado | `rol`, `estado`, `ultimoAcceso`, `origen` | Seguridad; elevación privilegios | `types/users.ts`, `validarCambioRol()` |
| **Permisos rol módulo** | Diff permisos | Rutas agregadas/removidas | Cumplimiento acceso mínimo | `diffPermisosRol()` |

### 2.2 Dietas y Cocina — auditoría de eventos (log transversal)

Modelo UI: `FilaAuditoria`, `DetalleAuditoria` (`modules/dietas-cocina/types/audit.ts`)

| Campo auditoría | Tipo | Obligatorio | Justificación |
| --------------- | ---- | ----------- | ------------- |
| `id` | uuid | Sí | PK evento |
| `codigoAuditoria` | string | Sí | Referencia humana (ej. AUD-2026-001234) |
| `fechaHora` | datetime | Sí | Orden cronológico |
| `usuario` | UsuarioAuditoriaResumen | Sí | Responsable |
| `modulo` | ModuloAuditoria enum | Sí | Segmentación (`dietas`, `cocina`, `etiquetas`, etc.) |
| `accion` | string | Sí | Verbo negocio (ej. "Confirmar dieta", "Cambiar tarifa") |
| `registroId` | string | Sí | FK entidad afectada |
| `cambios` | CambioAuditoria | Sí | Diff o texto narrativo |
| `resultado` | `exitoso` \| `fallido` | Sí | Intentos fallidos (seguridad) |

**Detalle extendido (`DetalleAuditoria`):**

| Campo | Justificación |
| ----- | ------------- |
| `justificacion` | Obligatorio en cambios tarifa, novedades clínicas, parámetros |
| `valorAnterior` / `valorNuevo` | Cambios configuración |
| `impacto.riesgoClinico` + nivel | Evaluación clínica automatizada o manual |
| `impacto.impactoTarifa` + nivel | Impacto financiero |
| `metadatos.ip` | Seguridad forense |
| `metadatos.dispositivo` | Contexto operativo |
| `metadatos.sistema` | Versión app / cliente |
| `historial[]` | Cadena eventos relacionados |
| `mensajeError` | Fallos de validación |

### 2.3 Encuestas SIAO — historial requerido (scaffold)

| Entidad | Historial | Justificación |
| ------- | --------- | ------------- |
| Cuestionario | Versiones | No alterar encuestas ya respondidas |
| RespuestaEncuesta | Inmutable post-cierre | Integridad indicadores SIAO |
| Cambio respuesta | **Inferido:** log si se permite corrección | Normativa calidad |
| ParametrosReglas | Cambios reglas | Reproducibilidad indicadores |

Referencia: `modules/encuestas/types/audit.ts`, `mockAuditoriaEncuestas.ts`

### 2.4 Plataforma — historial requerido

| Entidad | Historial | Justificación |
| ------- | --------- | ------------- |
| Usuario (global) | CRUD + accesos módulo | Super Admin |
| Rol (global) | Definición permisos | Scaffold `/administracion/roles` |
| ConfigAccesoModulos | Cambios `rolesConAcceso`, matrices | Hoy en localStorage — migrar a BD |

---

## 3. Entidades sin historial completo (solo created/updated)

| Entidad | Campos mínimos | Motivo |
| ------- | -------------- | ------ |
| ChecklistItem (plantilla) | `createdAt`, `updatedAt` | Config estática por tipo dieta |
| KpiDieta / KpiCocina | Ninguno persistido | Calculados en runtime |
| RegistroSistema (conciliación detalle) | Snapshot consulta | Derivado del ciclo, no editable |
| Datos paciente HIS | `syncedAt` opcional | Read-only desde Vital |

---

## 4. Eventos de negocio a auditar (catálogo acciones)

### Dietas
- Crear/editar/confirmar solicitud
- Registrar novedad (con motivo)
- Cancelar dieta (con motivo, flag tardía)
- Sincronizar censo HIS

### Cocina
- Iniciar preparación
- Actualizar checklist
- Marcar lista
- Generar/imprimir/reimprimir etiqueta
- Despachar
- Cancelar orden

### Logística enfermería
- Confirmar pre-entrega (`recibidoPor`)
- Confirmar entrega
- Confirmar devolución (motivo + foto)

### Catálogo y finanzas
- Crear/editar/desactivar dieta catálogo
- Crear/cerrar tarifa vigente
- Conciliación manual

### Administración
- Cambio rol usuario
- Modificación permisos rol
- Config acceso módulo (Super Admin)

---

## 5. Modelo de datos sugerido (backend)

```text
audit_events (append-only)
├── id, codigo, timestamp, user_id, module, action, entity_type, entity_id
├── changes_json, result, error_message
├── justification, clinical_risk_level, tariff_impact_level
└── ip, device, client_version

entity_history (versionado selectivo)
├── id, entity_type, entity_id, version, snapshot_json
├── changed_fields[], effective_from, effective_to
└── created_by, created_at

tariff_history (especializado — ya modelado en frontend)
├── id, diet_catalog_id, amount, valid_from, valid_to
├── reason, registered_by, is_current
└── created_at
```

---

## 6. Retención y consulta

| Tipo dato | Retención sugerida | Consulta UI |
| --------- | ------------------ | ----------- |
| Audit log operativo | ≥ 2 años | `/dietas-cocina/auditoria`, `/encuestas/auditoria` |
| Histórico tarifas | Indefinido | `HistoricoTarifasTimeline` |
| Evidencia foto devolución | ≥ 1 año | Detalle devolución |
| Logs fallidos auth | 90 días | **Inferido** — no hay UI aún |

---

## 7. Campos NO recomendados por entidad

| Entidad | Evitar | Razón |
| ------- | ------ | ----- |
| EtiquetaEnfermera | `updatedAt` sin log eventos | Preferir timestamps por transición logística |
| FilaDieta (HIS) | `deletedAt` | Paciente sale del censo por alta, no delete |
| KPI reportes | Campos auditoría | Agregaciones efímeras |
| Respuesta encuesta cerrada | `updatedAt` editable | Inmutabilidad regulatoria |

---

## 8. Integración Vital vs Bital en auditoría

| Origen | Qué auditar | Qué NO auditar en Bital |
| ------ | ----------- | ----------------------- |
| Vital (ApiConsultas) | Sync censo: timestamp, registros procesados | Cambios demográficos en HIS |
| Bital (ApiNegocio) | Toda mutación operativa dietas/encuestas | — |

Marcar eventos sistema: `usuario.esSistema = true` en jobs de sincronización censo.
