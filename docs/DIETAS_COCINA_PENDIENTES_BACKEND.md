# Dietas-cocina: pendientes de backend para cierre de integración

**Fecha:** 2026-07-27 (actualizado tras cierre P0/P1)  
**Audiencia:** equipo backend / API (`Bital.ApiNegocio`)  
**Contexto:** integración del módulo frontend `dietas-cocina` con `VITE_DIETAS_COCINA_API=true` (sin mezclar mock).  
**Referencias:** `backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md`, `docs/GUIA_CONSUMO_FRONTEND.md`

> **Estado:** Los ítems P0 y P1 del plan de cierre fueron implementados. Este documento se conserva como registro histórico de brechas y criterios de aceptación.

---

## Resumen ejecutivo (post-cierre)

| Área | Estado |
|------|--------|
| Solicitud clínica (aislamiento/alergias) | **Hecho** |
| Auto-orden al confirmar + `ordenCocinaId` | **Hecho** |
| Checklist persistente | **Hecho** (`PATCH /ordenes-cocina/{id}/checklist`) |
| Despacho → `EnRuta` | **Hecho** (`estado: Despachada`) |
| CRUD catálogo/tarifas | **Hecho** |
| `modoCarga` en parámetros | **Hecho** |
| PDF / exports / factura / reset password / auditoría auto | **Hecho** (P1) |
| Migración EF | `20260727013734_AddChecklistAndParametrosOperativos` |

---

## Resumen ejecutivo (histórico — pre-cierre)

El frontend ya consume el flujo principal de **censo → solicitud → confirmación** contra `/api/v1/dietas-cocina/*`. Quedan brechas de contrato y de reglas de negocio que impiden paridad con el comportamiento operativo esperado (cocina, aislamiento, alergias y transiciones de estado).

Este documento **no incluye cambios de código backend**; describe lo que falta implementar o alinear para que el frontend pueda dejar de usar workarounds locales.

---

## Estado actual de la integración (frontend)

| Área | Estado | Notas |
|------|--------|-------|
| Censo | Integrado | `GET /dietas-cocina/censo?fecha&comida` |
| Solicitud / guardado | Parcial | UI envía aislamiento/alergias; API no las persiste |
| Confirmación / cancelación / novedad | Integrado | `POST /confirmar`, `/cancelar`, `/novedad` |
| Cocina (bandejas) | Integrado + workaround | `POST/PATCH /ordenes-cocina`; censo como fuente; checklist/despacho local |
| Etiquetas | Integrado | Generar, imprimir, pre-entrega, entrega, devolución + foto |
| Conciliación | Integrado | Listado, KPIs, detalle API, marcar estados |
| Parámetros | Integrado | Tiempos comida y tipos paciente vía `PUT` completo |
| Usuarios / permisos | Integrado | CRUD usuarios, `PATCH /rol`, `GET/PUT /roles/permisos` |
| Auditoría | Integrado | Listado + detalle API |
| Dietas y tarifas | Lectura | Solo `GET /catalogo`; CRUD tarifas sin API |
| Dashboards / reportes | Integrado | KPIs proveedor desde API cuando disponibles |

### Matriz pantalla → endpoint → estado

| Pantalla / flujo | Endpoint(s) | Estado |
|------------------|-------------|--------|
| Censo dietas | `GET /censo` | Integrado + polling 15s |
| Búsqueda dietas | `POST /dietas/buscar` | Integrado (filtros servicio/estado/paciente) |
| Dietas del paciente | `GET /paciente/{id}/dietas` | Integrado (detalle dieta) |
| Detalle dieta | `GET /dietas/{id}` | Integrado (sheet detalle) |
| Solicitud dieta | `POST /solicitud` | Parcial (aislamiento/alergias no persisten) |
| Confirmar / cancelar / novedad | `/confirmar`, `/cancelar`, `/novedad` | Integrado |
| Cocina: listado órdenes | `GET /ordenes-cocina` | Integrado |
| Cocina: detalle orden | `GET /ordenes-cocina/{id}` | Integrado (sheet detalle) |
| Cocina: en preparación | `POST /ordenes-cocina` | Integrado |
| Cocina: marcar lista | `PATCH /ordenes-cocina/{id}/estado` | Integrado |
| Cocina: cancelar orden | `POST /ordenes-cocina/{id}/cancelar` | Integrado |
| Cocina: checklist | — | Workaround (`sessionStorage`) |
| Cocina: despacho EnRuta | — | Workaround (solo sesión + aviso UI) |
| Cocina: sync tiempo real | Polling censo 15s + focus | Integrado |
| Etiquetas: generar / imprimir | `/etiquetas/generar`, `/bulk/impresas` | Integrado |
| Etiquetas: PDF server | `/etiquetas/pdf` | Sin API útil (PDF cliente en navegador) |
| Enfermería: pre-entrega / entrega / devolución | `/pre-entrega`, `/entrega`, `/devolucion` | Integrado |
| Devolución: foto | `/foto-devolucion` | Integrado |
| Conciliación listado / KPIs | `/conciliacion`, `/conciliacion/kpis` | Integrado |
| Conciliación detalle | `GET /conciliacion/{id}` | Integrado |
| Conciliación: cargar factura / export | — | Demo (sin API) |
| Parámetros tiempos | `GET/PUT /parametros/tiempos-comida` | Integrado |
| Parámetros tipos paciente | `GET/PUT /parametros/tipos-paciente` | Integrado |
| Usuarios CRUD | `/usuarios` | Integrado |
| Cambiar rol | `PATCH /usuarios/{id}/rol` | Integrado |
| Activar/desactivar usuario | `PATCH /usuarios/{id}/estado` | Integrado |
| Permisos por rol | `GET/PUT /roles/permisos` | Integrado |
| Auditoría listado / detalle | `/auditoria`, `/auditoria/{id}` | Integrado |
| Auditoría export / filtros guardados | — | Demo |
| Catálogo dietas-tarifas | `GET /catalogo` | Integrado (solo lectura) |
| Dashboards por rol | `/dashboard/*` | Integrado (KPIs + loading/error) |
| Reportes | `/reportes/*` | Integrado |
| Clasificación edad (simulador) | `POST /parametros/clasificar-edad` | Integrado |

**Variables de entorno frontend (local):**

```env
VITE_BITAL_API_BASE_URL=http://localhost:8080/api/v1
VITE_DIETAS_COCINA_API=true
```

---

## 1. Solicitud de dieta: aislamiento y alergias (prioridad alta)

### Problema

La entidad `FilaDieta` y el DTO de respuesta `FilaDietaDto` **sí tienen** campos clínicos:

- `Aislado`, `Aislamiento`, `ObservacionAislamiento`
- `Alergico`, `Alergias`

Pero `SolicitudDietaDto` y los métodos `SolicitarDietaAsync` / `ConfirmarDietaAsync` en `DietasService` **solo actualizan**:

- `TipoDietaId`, `Consistencia`, `DescripcionDieta`, `Observaciones`

El formulario de solicitud en frontend captura toggles de **Paciente aislado** y **Alérgico** con sus observaciones. Tras guardar, al reabrir el panel los valores no persisten.

### Qué falta en backend

1. Ampliar `SolicitudDietaDto` con:

```json
{
  "tipoDietaId": "guid",
  "consistencia": "Sólida",
  "descripcionDieta": "Dieta Hiposódica",
  "observaciones": "Notas generales",
  "aislado": true,
  "aislamiento": "Contacto",
  "observacionAislamiento": "Precauciones adicionales",
  "alergico": true,
  "alergias": "Maní, mariscos",
  "guardar": true
}
```

2. Persistir esos campos en `SolicitarDietaAsync` y, si aplica, en `ConfirmarDietaAsync`.

3. Reglas sugeridas:

- Si `aislado = false` → `Aislamiento = "Ninguno"`, limpiar `ObservacionAislamiento` (opcional).
- Si `alergico = false` → `Alergias = ""`.

### Estado frontend

El mapper `mapSolicitudToRequest` **ya envía** estos campos cuando el backend los soporte. No requiere cambio adicional en UI.

### Criterio de aceptación

- `POST /dietas-cocina/dietas/{id}/solicitud` con `aislado`/`alergico` actualizados devuelve `FilaDietaDto` con los mismos valores.
- Reabrir detalle/censo muestra los toggles y textos guardados.

---

## 2. Flujo cocina: confirmación → bandeja en producción (prioridad alta)

### Problema

En modo mock, al **confirmar** una dieta el frontend crea una bandeja local (`OrdenCocina` por paciente) visible en **Cocina y seguimiento**.

Con API activa:

- `POST /dietas-cocina/dietas/{id}/confirmar` solo pone `Estado = Confirmada`.
- **No** asigna `OrdenCocinaId`.
- **No** crea registro en `OrdenesCocina`.

La pantalla de cocina del frontend quedó vacía hasta implementar un workaround: **derivar bandejas desde el censo** (filas en estado confirmado o posterior).

### Desalineación de modelo

| Capa | Modelo de "orden" |
|------|-------------------|
| Frontend UI | Una fila = una bandeja (paciente + comida + tipo + consistencia) |
| Backend `OrdenCocina` | Orden agrupada que puede incluir **varias** dietas (`TotalDietas`) |

Hay que definir con negocio cuál es el contrato objetivo:

**Opción A — Backend crea bandeja al confirmar (recomendada para paridad UI):**

- Al confirmar, crear automáticamente una orden (o ítem operativo) por dieta confirmada.
- Devolver `ordenCocinaId` en `FilaDietaDto`.
- Exponer listado operativo para cocina (puede ser extensión de censo filtrado o `GET /ordenes-cocina` a nivel detalle).

**Opción B — Frontend usa `POST /ordenes-cocina` explícitamente:**

- Tras confirmar, frontend llama `POST /api/v1/ordenes-cocina` con `dietasIds[]`.
- Backend pasa dietas a `EnPreparacion` y asocia `OrdenCocinaId`.

**Opción C — Censo enriquecido:**

- Documentar que cocina debe leer solo `GET /censo` filtrando estados `Confirmada`, `EnPreparacion`, `ListaEnvio`, etc., sin entidad `OrdenCocina` intermedia.

### Endpoints existentes no cableados

```
GET    /api/v1/ordenes-cocina?fecha&comida&estado
GET    /api/v1/ordenes-cocina/{ordenId}
POST   /api/v1/ordenes-cocina
PATCH  /api/v1/ordenes-cocina/{ordenId}/estado
DELETE /api/v1/ordenes-cocina/{ordenId}  (cancelar)
```

### Transiciones de cocina sin API

Acciones de la UI de cocina que hoy son **solo estado local** cuando `VITE_DIETAS_COCINA_API=true`:

- Marcar en preparación
- Marcar como lista
- Registrar despacho
- Actualizar checklist

Deben mapearse a actualización de estado de dieta u orden (`EnPreparacion`, `ListaEnvio`, `EnRuta`, etc.) vía `PATCH /ordenes-cocina/{id}/estado` o endpoints equivalentes sobre `FilaDieta`.

### Criterio de aceptación

- Tras confirmar una dieta con tipo y consistencia, aparece en cocina **sin workarounds** del frontend.
- Cambiar estado en cocina persiste en BD y se refleja en censo/etiquetas.

---

## 3. Mapeo de estados `EstadoDieta` (prioridad media)

### Backend (`Bital.Domain.Enums.EstadoDieta`)

`Pendiente`, `Guardado`, `Solicitada`, `Confirmada`, `EnPreparacion`, `ListaEnvio`, `EnRuta`, `Entregada`, `Consumida`, `Cancelada`, `NoConsumida`, `Devuelta`

### Frontend (operativo)

Usa slugs como `no-solicitada`, `guardado`, `confirmada`, `en-preparacion`, `lista-despacho`, `despachada`, etc.

El mapper frontend normaliza respuestas API (`Confirmada` → `confirmada`, `ListaEnvio` → `lista-despacho`, …).

### Qué falta

- Documentar oficialmente la tabla de equivalencias en README de endpoints.
- Garantizar que **todos** los endpoints devuelven `estado` como string del enum .NET (`Confirmada`, no `confirmada`) de forma consistente.
- Validar transiciones: p. ej. confirmación masiva solo desde `Solicitada` (ya implementado parcialmente).

---

## 4. Novedades de dieta (prioridad media)

`POST /dietas-cocina/dietas/{id}/novedad` usa `NovedadDietaDto` orientado a tipo/descripción de novedad, **no** al formulario clínico completo (tipo dieta, consistencia, aislamiento, alergias).

Si el flujo de novedad debe permitir cambiar condiciones clínicas (como el sheet de novedad en UI), hace falta:

- Ampliar DTO, o
- Reutilizar campos de `SolicitudDietaDto`, o
- Documentar que novedad es solo registro auditado y los cambios clínicos van por otro endpoint.

---

## 5. Formato de respuestas HTTP (prioridad media)

El frontend maneja dos formatos:

1. **Wrapper** `{ success, data, message }` (módulos generales)
2. **DTO directo** en rutas `dietas-cocina` (sin wrapper)

Documentar explícitamente qué rutas usan cada formato para evitar regresiones. Endpoints de etiquetas y catálogo mezclan estilos según el controlador.

---

## 6. Cancelación de dieta (prioridad baja)

Frontend envía motivo como **string JSON** en body:

```http
POST /dietas-cocina/dietas/{id}/cancelar
Content-Type: application/json

"[Motivo] Justificación"
```

Confirmar si el contrato definitivo es string plano u objeto `{ motivo, justificacion }` para alinear validación y auditoría.

---

## 7. Catálogo y encoding (prioridad baja, operaciones)

- Script disponible: `backend/Bital.Infrastructure/Data/FixCatalogoEncoding.sql` (UTF-8 en nombres de dietas).
- Aplicar en **cada** ambiente (dev, staging, prod) donde el catálogo muestre caracteres corruptos (`DiabÃ©tica`).
- Verificar encoding de nombres de pacientes si provienen de Hosvital/Vital (fuera de `BitalNegocio`).

---

## 8. Censo e ingreso hospitalario (prioridad baja)

- Frontend dejó de usar IDs temporales (`censo-CC-…`) y exige **GUID** de `FilasDietas` para solicitud/confirmación.
- El censo API debe devolver `id` GUID estable por fila/paciente/comida/fecha.
- Sincronizar reglas de alta de filas nuevas cuando aparece paciente en Hosvital (job o trigger), si aún no está automatizado.

---

## Workarounds activos en frontend (temporales)

| Workaround | Motivo | Eliminar cuando |
|------------|--------|-----------------|
| Bandejas de cocina desde censo + `SincronizarCocinaDesdeDietas` | Paridad UI mientras censo es fuente operativa | Backend unifique listado cocina o devuelva `ordenCocinaId` estable |
| `cocinaOverridesStorage` (checklist + `ordenCocinaApiId`) | Checklist y ID orden no persistidos en API | Endpoints de checklist / orden en cocina |
| Despacho `EnRuta` solo en sesión | No existe estado `EnRuta` persistible | `PATCH` de despacho en API |
| PDF etiquetas en cliente (`jsPDF`) | Endpoint server-side es placeholder | PDF server-side funcional |
| Carga anticipada parámetros en sesión | API tiempos no expone `modoCarga` | Campo en `PUT /parametros/tiempos-comida` |
| Cache catálogo en memoria | Reducir llamadas | Opcional |
| `repararTextoUtf8()` en mappers | Encoding histórico en BD | Catálogo corregido en todos los ambientes |
| Validación permisos UI en cliente | Fallback de autorización | Middleware de permisos en API para rutas |

---

## Checklist E2E por rol (frontend + API)

### Nutricionista

| Paso | Endpoint | Testeable vía API |
|------|----------|-------------------|
| Ver censo | `GET /censo` | Sí |
| Solicitar dieta | `POST /solicitud` | Parcial (aislamiento/alergias) |
| Confirmar individual/masiva | `POST /confirmar` | Sí |
| Cancelar con motivo | `POST /cancelar` | Sí |
| Registrar novedad | `POST /novedad` | Sí |
| Conciliación: marcar estados | `PATCH /conciliado`, `/pendiente-revision` | Sí |
| Conciliación: detalle | `GET /conciliacion/{id}` | Sí |

### Cocina / proveedor

| Paso | Endpoint | Testeable vía API |
|------|----------|-------------------|
| Marcar en preparación | `POST /ordenes-cocina` | Sí |
| Checklist operativo | — | No (sessionStorage) |
| Marcar como lista | `PATCH /ordenes-cocina/{id}/estado` | Sí |
| Cancelar orden | `POST /ordenes-cocina/{id}/cancelar` | Sí |
| Generar etiqueta | `POST /etiquetas/generar` | Sí |
| Imprimir etiquetas | `PATCH /bulk/impresas` | Sí |
| Registrar despacho | — | No (solo sesión) |
| Imprimir PDF | Cliente (`jsPDF`) | Parcial |

### Enfermería

| Paso | Endpoint | Testeable vía API |
|------|----------|-------------------|
| Buscar etiqueta por código | `GET /etiquetas/codigo/{codigo}` | Sí |
| Pre-entrega | `PATCH /pre-entrega` | Sí |
| Entrega al paciente | `PATCH /entrega` | Sí |
| Devolución | `PATCH /devolucion` | Sí |
| Foto devolución | `POST /foto-devolucion` | Sí |

### Administrador

| Paso | Endpoint | Testeable vía API |
|------|----------|-------------------|
| Parámetros tiempos | `GET/PUT /parametros/tiempos-comida` | Sí |
| Tipos paciente | `GET/PUT /parametros/tipos-paciente` | Sí |
| Usuarios CRUD | `/usuarios` | Sí |
| Cambiar rol | `PATCH /usuarios/{id}/rol` | Sí |
| Matriz permisos | `GET/PUT /roles/permisos` | Sí |
| Auditoría | `/auditoria`, `/auditoria/{id}` | Sí |
| Dietas-tarifas | `GET /catalogo` | Solo lectura |

### Todos los roles

| Paso | Endpoint | Testeable vía API |
|------|----------|-------------------|
| Dashboard por rol | `/dashboard/*` | Sí |
| Reportes | `/reportes/*` | Sí |

**No testeable vía API hoy:** despacho persistente (`EnRuta`), CRUD tarifas, persistencia checklist, PDF server-side, aislamiento/alergias en solicitud, export demo conciliación/auditoría.

---

## Checklist sugerido para el equipo backend

- [ ] **§1** — `SolicitudDietaDto` + persistencia aislamiento/alergias
- [ ] **§2** — Definir contrato cocina (A/B/C) e implementar
- [ ] **§2** — Endpoints de cambio de estado cocina consumibles por UI
- [ ] **§3** — Documentar mapa de estados API ↔ UI
- [ ] **§4** — Contrato de novedades clínicas
- [ ] **§5** — Estandarizar wrapper vs DTO directo
- [ ] **§6** — Contrato cancelación
- [ ] **§7** — Script encoding en despliegues
- [ ] Pruebas E2E: solicitud → guardado → confirmación → visible en cocina → etiqueta

---

## Contacto / seguimiento

Pruebas de integración frontend en local contra `http://localhost:8080` con bases `BitalNegocio` + `Hosvital_Pruebas`.

Para validar un fix de §1 rápidamente:

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/solicitud
```

Body con `aislado: true`, `alergico: true`, `alergias: "Maní"`, luego:

```http
GET /api/v1/dietas-cocina/dietas/{filaDietaId}
```

Verificar que `FilaDietaDto` refleje los mismos valores.
