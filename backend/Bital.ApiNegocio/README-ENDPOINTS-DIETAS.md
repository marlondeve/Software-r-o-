# Guía de endpoints del módulo de dietas

Este documento resume los endpoints reales que el frontend debe consumir para el módulo de dietas en `Bital.ApiNegocio`.

## Base URL

- Local: `http://localhost:8080`
- Producción: `http://186.190.254.230:8080`

Todos los endpoints usan versión:

```http
/api/v1
```

---

## 1. Dietas: censo, detalle y flujo principal

### Obtener censo de dietas

```http
GET /api/v1/dietas-cocina/censo?fecha=2026-07-26&comida=Desayuno
```

### Obtener dietas de un paciente

```http
GET /api/v1/dietas-cocina/paciente/{pacienteId}/dietas?fecha=2026-07-26
```

### Solicitar o actualizar una dieta

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/solicitud
```

Body:

```json
{
  "dieta": "Blanda",
  "consistencia": "Puré",
  "observaciones": "Sin sal"
}
```

### Confirmar una dieta

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/confirmar
```

### Confirmación masiva de dietas

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

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/cancelar
```

Body:

```json
"Motivo de la cancelación"
```

### Registrar novedad en una dieta

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/novedad
```

### Obtener detalle completo de una dieta

```http
GET /api/v1/dietas-cocina/dietas/{filaDietaId}
```

### Obtener historial de trazabilidad de una dieta

```http
GET /api/v1/dietas-cocina/dietas/{filaDietaId}/historial
```

### Buscar dietas con filtros avanzados

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

```http
GET /api/v1/dietas-cocina/catalogo
```

---

## 2. Conciliación de dietas

### Listar conciliación

```http
GET /api/v1/dietas-cocina/conciliacion?busqueda=juan&periodo=2026-07&proveedor=Hospital&estado=pendiente
```

### Obtener detalle de una conciliación

```http
GET /api/v1/dietas-cocina/conciliacion/{id}
```

### Marcar conciliado

```http
PATCH /api/v1/dietas-cocina/conciliacion/{id}/conciliado
```

### Marcar pendiente de revisión

```http
PATCH /api/v1/dietas-cocina/conciliacion/{id}/pendiente-revision
```

### Obtener KPIs de conciliación

```http
GET /api/v1/dietas-cocina/conciliacion/kpis?periodo=2026-07&proveedor=Hospital
```

---

## 3. Etiquetas y logística de enfermería

### Listar etiquetas

```http
GET /api/v1/dietas-cocina/etiquetas?comida=Desayuno&estadoLogistica=Pendiente&pabellon=3
```

### Buscar etiqueta por código QR/barcode

```http
GET /api/v1/dietas-cocina/etiquetas/buscar?codigo=ETQ-000123
```

### Generar etiquetas

```http
POST /api/v1/dietas-cocina/etiquetas/generar
```

### Marcar etiquetas como impresas

```http
PATCH /api/v1/dietas-cocina/etiquetas/bulk/impresas
```

### Marcar etiquetas para reimpresión

```http
PATCH /api/v1/dietas-cocina/etiquetas/bulk/reimpresas
```

### Confirmar pre-entrega

```http
PATCH /api/v1/dietas-cocina/etiquetas/{etiquetaId}/pre-entrega
```

### Confirmar entrega

```http
PATCH /api/v1/dietas-cocina/etiquetas/{etiquetaId}/entrega
```

### Registrar devolución

```http
PATCH /api/v1/dietas-cocina/etiquetas/{etiquetaId}/devolucion
```

### Cargar foto de devolución

```http
POST /api/v1/dietas-cocina/etiquetas/{etiquetaId}/foto-devolucion
```

### Generar PDF de etiquetas

```http
GET /api/v1/dietas-cocina/etiquetas/pdf
```

---

## 4. Dashboards y reportes

### Dashboard nutricionista

```http
GET /api/v1/dietas-cocina/dashboard/nutricionista?fecha=2026-07-26&comida=Almuerzo
```

### Dashboard proveedor

```http
GET /api/v1/dietas-cocina/dashboard/proveedor?comida=Almuerzo
```

### Dashboard enfermera

```http
GET /api/v1/dietas-cocina/dashboard/enfermera?comida=Almuerzo&pabellon=3
```

### Reporte nutricionista

```http
GET /api/v1/dietas-cocina/reportes/nutricionista?desde=2026-07-01&hasta=2026-07-26&servicio=Hospitalización&horario=Diurno&comida=Almuerzo
```

### Reporte proveedor

```http
GET /api/v1/dietas-cocina/reportes/proveedor?desde=2026-07-01&hasta=2026-07-26&servicio=Hospitalización&horario=Diurno&comida=Almuerzo
```

---

## 5. Parámetros del módulo

### Obtener tiempos de comida

```http
GET /api/v1/dietas-cocina/parametros/tiempos-comida
```

### Actualizar tiempos de comida

```http
PUT /api/v1/dietas-cocina/parametros/tiempos-comida
```

### Obtener tipos de paciente

```http
GET /api/v1/dietas-cocina/parametros/tipos-paciente
```

### Actualizar tipos de paciente

```http
PUT /api/v1/dietas-cocina/parametros/tipos-paciente
```

### Clasificar edad

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

### Listar eventos de auditoría

```http
GET /api/v1/dietas-cocina/auditoria?modulo=Dietas&resultado=Exitoso&desde=2026-07-01&hasta=2026-07-26&usuario=admin&page=1&pageSize=20
```

### Obtener detalle de un evento

```http
GET /api/v1/dietas-cocina/auditoria/{id}
```

> Nota: existe un endpoint temporal de carga de datos de prueba, pero está oculto del explorador de API.

---

## 7. Usuarios y permisos

### Listar usuarios del módulo

```http
GET /api/v1/dietas-cocina/usuarios?rol=Nutricionista&estado=true&page=1&pageSize=10
```

### Crear usuario

```http
POST /api/v1/dietas-cocina/usuarios
```

### Editar usuario

```http
PUT /api/v1/dietas-cocina/usuarios/{id}
```

### Cambiar rol

```http
PATCH /api/v1/dietas-cocina/usuarios/{id}/rol
```

### Cambiar estado

```http
PATCH /api/v1/dietas-cocina/usuarios/{id}/estado
```

### Obtener matriz de permisos

```http
GET /api/v1/dietas-cocina/roles/permisos
```

### Actualizar permisos de un rol

```http
PUT /api/v1/dietas-cocina/roles/{rol}/permisos
```

> Nota: el controlador incluye un endpoint temporal de seed para pruebas internas, no recomendado para consumo frontend.

---

## 8. Recomendaciones para frontend

- Usar siempre la versión `/api/v1`.
- Manejar `404` cuando una dieta, etiqueta, usuario o evento no exista.
- Algunos endpoints siguen usando valores temporales de usuario en backend mientras se integra autenticación real.
- Los body exactos dependen de los DTOs del proyecto; esta guía resume los contratos visibles para consumo frontend.
- Si se consume en producción, usar `http://186.190.254.230:8080`.

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
- `/dietas-cocina/conciliacion`
- `/dietas-cocina/conciliacion/{id}`
- `/dietas-cocina/conciliacion/{id}/conciliado`
- `/dietas-cocina/conciliacion/{id}/pendiente-revision`
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
- `/dietas-cocina/roles/permisos`
- `/dietas-cocina/roles/{rol}/permisos`
