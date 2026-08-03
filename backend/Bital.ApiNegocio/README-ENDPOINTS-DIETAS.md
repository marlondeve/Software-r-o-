# Guía de endpoints del módulo de dietas

Este documento explica los endpoints reales que el frontend debe consumir para el módulo de dietas en `Bital.ApiNegocio`.

La idea es que sirva como guía práctica para formularios, pantallas operativas y consultas del equipo frontend: qué hace cada endpoint, cuándo usarlo y cómo encaja en el flujo del módulo.

## Base URL

| Entorno | URL |
|---|---|
| Desarrollo local | `http://localhost:8080` |
| Producción (vía proxy IIS) | `https://riosoft.clinicadelriomonteria.com:8080` — rutas relativas `/api/v1` |

Prefijo de versión: `/api/v1`

---

## 1. Dietas: censo, detalle y flujo principal

Esta sección cubre el flujo principal del módulo. El frontend la usa cuando necesita consultar la programación de dietas, editar una solicitud, confirmar cambios o registrar novedades.

### ¿Qué hace esta sección?

- Muestra el censo de dietas para una fecha o comida determinada.
- Permite abrir el detalle de una dieta.
- Da soporte a formularios de solicitud y confirmación.
- Permite registrar cambios, cancelaciones y novedades.
- Recupera historial para trazabilidad.

### Obtener censo de dietas

Usar para cargar la pantalla principal del módulo y mostrar la lista de dietas del día.

El parámetro `fecha` filtra el día que quiere revisar el usuario y `comida` permite acotar por desayuno, almuerzo, cena u otro turno.

```http
GET /api/v1/dietas-cocina/censo?fecha=2026-07-26&comida=Desayuno
```

### Obtener dietas de un paciente

Usar cuando el frontend necesite ver todas las dietas asociadas a un paciente antes de editar, confirmar o revisar su programación.

Se consume normalmente después de seleccionar el paciente desde una búsqueda o desde una lista de atenciones.

```http
GET /api/v1/dietas-cocina/paciente/{pacienteId}/dietas?fecha=2026-07-26
```

### Solicitar o actualizar una dieta

Usar para registrar o modificar la información clínica y operativa de una dieta.

Este endpoint suele alimentar formularios de edición, donde el usuario ajusta consistencia, observaciones u otras condiciones especiales.

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/solicitud
```

Body:

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

### Confirmar una dieta

Usar cuando el registro ya fue revisado y se quiere dejar constancia de que la dieta queda confirmada.

Al confirmar, el backend crea automáticamente una orden de cocina 1:1 y devuelve `ordenCocinaId` en `FilaDietaDto` (visible en `GET /ordenes-cocina`).

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/confirmar
```

### Confirmación masiva de dietas

Usar para confirmar varias dietas en una sola operación, por ejemplo en una bandeja de trabajo con selección múltiple.

Este endpoint ayuda cuando el usuario procesa lotes desde una grilla.

```http
POST /api/v1/dietas-cocina/dietas/bulk/confirmar
```

Body:

```json
{
  "dietasIds": ["guid-1", "guid-2"],
  "usuario": "TestUser"
}
```

### Cancelar una dieta

Usar cuando la dieta ya no debe producirse o fue creada con error.

El cuerpo es solo el motivo textual de la cancelación y el frontend debería pedir confirmación al usuario antes de enviarlo.

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/cancelar
```

Body:

```json
"Motivo de la cancelación"
```

### Registrar novedad en una dieta

Usar para dejar trazabilidad operativa o clínica sobre un cambio puntual en la dieta.

Se recomienda usarlo desde un formulario corto de observaciones o novedades.

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/novedad
```

### Obtener detalle completo de una dieta

Usar para abrir una vista detallada desde la tabla principal o desde una acción de consulta.

```http
GET /api/v1/dietas-cocina/dietas/{filaDietaId}
```

### Obtener historial de trazabilidad de una dieta

Usar para mostrar la secuencia de eventos o cambios que ha tenido una dieta.

Es útil para auditoría visual y para seguimiento operativo.

```http
GET /api/v1/dietas-cocina/dietas/{filaDietaId}/historial
```

### Buscar dietas con filtros avanzados

Usar para búsquedas avanzadas en el censo o en pantallas de administración.

Conviene exponer este endpoint cuando el usuario necesita filtrar por varios criterios al mismo tiempo.

```http
POST /api/v1/dietas-cocina/dietas/buscar
```

Body de ejemplo:

```json
{
  "fecha": "2026-07-26",
  "comida": "Almuerzo",
  "servicio": "Hospitalización",
  "estado": "Solicitada",
  "paciente": "Juan"
}
```

### Obtener catálogo de tipos de dietas activas

Usar para llenar combos, selectores o catálogos en formularios de solicitud y edición.

```http
GET /api/v1/dietas-cocina/catalogo
```

---

## 2. Conciliación de dietas

Esta sección está pensada para el proceso de conciliación operativa, revisión de diferencias y seguimiento de pendientes.

El frontend la usa en pantallas de control, revisión y validación.

### Listar conciliación

Usar para mostrar una lista de registros a conciliar y filtrar por periodo, proveedor o estado.

```http
GET /api/v1/dietas-cocina/conciliacion?busqueda=juan&periodo=2026-07&proveedor=Hospital&estado=pendiente
```

### Obtener detalle de una conciliación

Usar para abrir el detalle de un registro específico antes de marcarlo como conciliado o pendiente.

```http
GET /api/v1/dietas-cocina/conciliacion/{id}
```

### Marcar conciliado

Usar cuando el registro ya fue validado y aprobado.

```http
PATCH /api/v1/dietas-cocina/conciliacion/{id}/conciliado
```

### Marcar pendiente de revisión

Usar cuando el registro requiere revisión adicional o quedó con alguna inconsistencia.

```http
PATCH /api/v1/dietas-cocina/conciliacion/{id}/pendiente-revision
```

### Obtener KPIs de conciliación

Usar para pintar indicadores resumidos en un dashboard de conciliación.

```http
GET /api/v1/dietas-cocina/conciliacion/kpis?periodo=2026-07&proveedor=Hospital
```

---

## 3. Etiquetas y logística de enfermería

Esta sección soporta el ciclo de impresión, entrega y devolución de etiquetas.

El frontend la usa en pantallas operativas de logística y distribución.

### Listar etiquetas

Usar para ver etiquetas pendientes, impresas o en cualquier estado de logística.

```http
GET /api/v1/dietas-cocina/etiquetas?comida=Desayuno&estadoLogistica=Pendiente&pabellon=3
```

### Buscar etiqueta por código QR/barcode

Usar cuando el usuario escanee o escriba manualmente un código de etiqueta.

```http
GET /api/v1/dietas-cocina/etiquetas/buscar?codigo=ETQ-000123
```

### Generar etiquetas

Usar para producir etiquetas nuevas a partir de la programación disponible.

```http
POST /api/v1/dietas-cocina/etiquetas/generar
```

### Marcar etiquetas como impresas

Usar para registrar que el lote ya fue impreso.

```http
PATCH /api/v1/dietas-cocina/etiquetas/bulk/impresas
```

### Marcar etiquetas para reimpresión

Usar cuando una etiqueta se dañó, se perdió o necesita volver a emitirse.

```http
PATCH /api/v1/dietas-cocina/etiquetas/bulk/reimpresas
```

### Confirmar pre-entrega

Usar antes de la entrega final para dejar trazabilidad del paso intermedio.

```http
PATCH /api/v1/dietas-cocina/etiquetas/{etiquetaId}/pre-entrega
```

### Confirmar entrega

Usar para cerrar la entrega física de la etiqueta o de la dieta asociada.

```http
PATCH /api/v1/dietas-cocina/etiquetas/{etiquetaId}/entrega
```

### Registrar devolución

Usar cuando la etiqueta o entrega no pudo completarse y debe devolverse.

```http
PATCH /api/v1/dietas-cocina/etiquetas/{etiquetaId}/devolucion
```

### Cargar foto de devolución

Usar como soporte visual cuando la devolución requiere evidencia.

```http
POST /api/v1/dietas-cocina/etiquetas/{etiquetaId}/foto-devolucion
```

### Generar PDF de etiquetas

Usar para descargar o imprimir el documento consolidado de etiquetas.

```http
GET /api/v1/dietas-cocina/etiquetas/pdf
```

---

## 4. Dashboards y reportes

Esta sección alimenta resúmenes visuales, indicadores y exportaciones del módulo.

### Dashboard nutricionista

Usar para mostrar información resumen orientada al nutricionista.

```http
GET /api/v1/dietas-cocina/dashboard/nutricionista?fecha=2026-07-26&comida=Almuerzo
```

### Dashboard proveedor

Usar para la vista resumida del proveedor o cocina.

```http
GET /api/v1/dietas-cocina/dashboard/proveedor?comida=Almuerzo
```

### Dashboard enfermera

Usar para el resumen que consulta enfermería o el personal asistencial.

```http
GET /api/v1/dietas-cocina/dashboard/enfermera?comida=Almuerzo&pabellon=3
```

### Reporte nutricionista

Usar para generar reportes más detallados del área nutricional.

```http
GET /api/v1/dietas-cocina/reportes/nutricionista?desde=2026-07-01&hasta=2026-07-26&servicio=Hospitalización&horario=Diurno&comida=Almuerzo
```

### Reporte proveedor

Usar para exportación o seguimiento operativo del proveedor.

```http
GET /api/v1/dietas-cocina/reportes/proveedor?desde=2026-07-01&hasta=2026-07-26&servicio=Hospitalización&horario=Diurno&comida=Almuerzo
```

---

## 5. Parámetros del módulo

Esta sección contiene catálogos y configuración general del módulo.

El frontend la usa en formularios de administración, no en el uso operativo diario.

### Obtener tiempos de comida

Usar para mostrar los horarios o bloques de alimentación disponibles.

```http
GET /api/v1/dietas-cocina/parametros/tiempos-comida
```

### Actualizar tiempos de comida

Usar para modificar la configuración de horarios desde el panel administrativo.

```http
PUT /api/v1/dietas-cocina/parametros/tiempos-comida
```

### Obtener tipos de paciente

Usar para listar los tipos de paciente que maneja el módulo.

```http
GET /api/v1/dietas-cocina/parametros/tipos-paciente
```

### Actualizar tipos de paciente

Usar para ajustar los catálogos de tipos de paciente.

```http
PUT /api/v1/dietas-cocina/parametros/tipos-paciente
```

### Clasificar edad

Usar cuando el frontend necesite saber cómo clasificar un paciente por edad.

Es útil en validaciones de formularios o en reglas de negocio.

```http
POST /api/v1/dietas-cocina/parametros/tipos-paciente/clasificar
```

Body:

```json
{
  "edad": 7
}
```

---

## 6. Auditoría

Esta sección sirve para trazabilidad del módulo y revisión de actividad.

### Listar eventos de auditoría

Usar para mostrar el historial de acciones realizadas dentro del módulo.

```http
GET /api/v1/dietas-cocina/auditoria?modulo=Dietas&resultado=Exitoso&desde=2026-07-01&hasta=2026-07-26&usuario=admin&page=1&pageSize=20
```

### Obtener detalle de un evento

Usar para abrir la información completa de un evento específico.

```http
GET /api/v1/dietas-cocina/auditoria/{id}
```

> Nota: existe un endpoint temporal de carga de datos de prueba, pero está oculto del explorador de API.

---

## 7. Usuarios y permisos

Esta sección permite administrar accesos, roles y permisos del módulo de dietas.

El frontend la consume en pantallas administrativas y de seguridad.

### Listar usuarios del módulo

Usar para mostrar usuarios filtrados por rol, estado o paginación.

```http
GET /api/v1/dietas-cocina/usuarios?rol=Nutricionista&estado=true&page=1&pageSize=10
```

### Crear usuario

Usar para registrar un nuevo usuario del módulo.

```http
POST /api/v1/dietas-cocina/usuarios
```

### Editar usuario

Usar para actualizar datos del usuario existente.

```http
PUT /api/v1/dietas-cocina/usuarios/{id}
```

### Cambiar rol

Usar para asignar otro rol al usuario.

```http
PATCH /api/v1/dietas-cocina/usuarios/{id}/rol
```

### Cambiar estado

Usar para activar o desactivar un usuario.

```http
PATCH /api/v1/dietas-cocina/usuarios/{id}/estado
```

### Obtener matriz de permisos

Usar para pintar la matriz de permisos por rol.

```http
GET /api/v1/dietas-cocina/roles/permisos
```

### Actualizar permisos de un rol

Usar para guardar cambios en la configuración de permisos.

```http
PUT /api/v1/dietas-cocina/roles/{rol}/permisos
```

> Nota: el controlador incluye un endpoint temporal de seed para pruebas internas, no recomendado para consumo frontend.

---

## 8. Recomendaciones para frontend

- Usar siempre la versión `/api/v1` con cookie de sesión (`withCredentials: true`).
- Antes de enviar formularios de confirmación, cancelación o asignación masiva, mostrar una validación o modal de confirmación.
- Manejar `404` cuando una dieta, etiqueta, usuario o evento no exista.
- En producción usar URLs relativas (`/api/v1/...`) — el proxy IIS reenvía a `127.0.0.1:8081`.
- Los body exactos dependen de los DTOs del proyecto; esta guía resume los contratos visibles para consumo frontend.
- En tablas y formularios, conservar el identificador devuelto por el backend para consultar detalle, historial o estado posterior.

---

## 9. Resumen rápido de rutas

- `/dietas-cocina/censo`
- `/dietas-cocina/paciente/{pacienteId}/dietas`
- `/dietas-cocina/dietas/{filaDietaId}/solicitud`
- `/dietas-cocina/dietas/{filaDietaId}/confirmar`
- `/dietas-cocina/dietas/bulk/confirmar`
- `/dietas-cocina/dietas/{filaDietaId}/cancelar`
- `/dietas-cocina/dietas/{filaDietaId}/novedad`
- `/dietas-cocina/dietas/{filaDietaId}`
- `/dietas-cocina/dietas/{filaDietaId}/historial`
- `/dietas-cocina/dietas/buscar`
- `/dietas-cocina/catalogo`
- `/dietas-cocina/catalogo/{id}`
- `/dietas-cocina/catalogo/{id}/desactivar`
- `/dietas-cocina/catalogo/{id}/tarifas`
- `/dietas-cocina/conciliacion`
- `/dietas-cocina/conciliacion/{id}`
- `/dietas-cocina/conciliacion/{id}/conciliado`
- `/dietas-cocina/conciliacion/{id}/pendiente-revision`
- `/dietas-cocina/conciliacion/{id}/factura`
- `/dietas-cocina/conciliacion/kpis`
- `/dietas-cocina/etiquetas`
- `/dietas-cocina/etiquetas/buscar`
- `/dietas-cocina/etiquetas/generar`
- `/dietas-cocina/etiquetas/bulk/impresas`
- `/dietas-cocina/etiquetas/bulk/reimpresas`
- `/dietas-cocina/etiquetas/{etiquetaId}/pre-entrega`
- `/dietas-cocina/etiquetas/{etiquetaId}/entrega`
- `/dietas-cocina/etiquetas/{etiquetaId}/devolucion`
- `/dietas-cocina/etiquetas/{etiquetaId}/foto-devolucion`
- `/dietas-cocina/etiquetas/pdf`
- `/dietas-cocina/dashboard/nutricionista`
- `/dietas-cocina/dashboard/proveedor`
- `/dietas-cocina/dashboard/enfermera`
- `/dietas-cocina/reportes/nutricionista`
- `/dietas-cocina/reportes/proveedor`
- `/dietas-cocina/parametros/tiempos-comida`
- `/dietas-cocina/parametros/tipos-paciente`
- `/dietas-cocina/parametros/tipos-paciente/clasificar`
- `/dietas-cocina/auditoria`
- `/dietas-cocina/auditoria/{id}`
- `/dietas-cocina/usuarios`
- `/dietas-cocina/usuarios/{id}/restablecer-password`
- `/dietas-cocina/roles/permisos`
- `/dietas-cocina/roles/{rol}/permisos`

---

## Changelog 2026-07-27 — Cierre P0/P1

| Cambio | Endpoint | Pantalla desbloqueada |
|--------|----------|------------------------|
| Aislamiento/alergias en solicitud | `POST /dietas/{id}/solicitud` | Formulario solicitud dieta |
| Auto-orden al confirmar | `POST /dietas/{id}/confirmar` | Cocina (bandejas sin workaround) |
| Checklist persistente | `PATCH /ordenes-cocina/{id}/checklist` | Cocina proveedor |
| Despacho EnRuta | `PATCH /ordenes-cocina/{id}/estado` (`Despachada`) | Despacho / dashboard proveedor |
| CRUD catálogo/tarifas | `POST/PATCH /catalogo...` | Dietas y tarifas |
| Modo carga anticipada | `GET/PUT /parametros/tiempos-comida` (`modoCarga`) | Parámetros tiempos |
| PDF etiquetas | `GET /etiquetas/pdf?ids=` | Impresión etiquetas |
| Export CSV | `?formato=csv` en conciliación, auditoría, reportes | Exportaciones |
| Factura conciliación | `POST /conciliacion/{id}/factura` | Conciliación |
| Foto devolución real | `POST /etiquetas/{id}/foto-devolucion` | Devolución enfermería |
| Reset password | `POST /usuarios/{id}/restablecer-password` | Usuarios |
| Auditoría automática | Servicios Ordenes/Dietas | Auditoría |
