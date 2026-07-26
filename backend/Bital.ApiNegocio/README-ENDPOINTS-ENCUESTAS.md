# Guía de endpoints del módulo de encuestas

Este documento resume los endpoints reales que el frontend debe consumir para el módulo de encuestas en `Bital.ApiNegocio`.

## Base URL

- Local: `http://localhost:8080`
- Producción: `http://186.190.254.230:8080`

Todos los endpoints usan versión:

```http
/api/v1
```

---

## 1. Pacientes, captura y flujo de encuesta

### Buscar pacientes

```http
GET /api/v1/encuestas/pacientes/search?termino=juan&maxResults=10
```

### Obtener atenciones de un paciente

```http
GET /api/v1/encuestas/pacientes/{cedula}/atenciones?tipoDocumento=CC
```

### Identificar paciente

```http
POST /api/v1/encuestas/pacientes/identificar
```

Body:

```json
{
  "numeroDocumento": "1003195163",
  "tipoDocumento": "CC",
  "canal": "Presencial",
  "numeroAtencion": 12345
}
```

### Cola de captura presencial

```http
GET /api/v1/encuestas/captura/presencial/pendientes?servicio=Hospitalizaci%C3%B3n&page=1&pageSize=10
```

### Iniciar captura presencial

```http
POST /api/v1/encuestas/captura/presencial/{pacienteId}/iniciar
```

Body:

```json
{
  "cuestionarioId": "guid-del-cuestionario"
}
```

### Guardar respuestas parciales

```http
PUT /api/v1/encuestas/captura/{encuestaId}/respuestas
```

### Completar encuesta

```http
POST /api/v1/encuestas/captura/{encuestaId}/completar
```

### Cola de captura telefónica

```http
GET /api/v1/encuestas/captura/telefonica/pendientes?busqueda=123&page=1&pageSize=10
```

### Registrar intento de llamada

```http
POST /api/v1/encuestas/captura/telefonica/{id}/intento
```

### Iniciar encuesta telefónica

```http
POST /api/v1/encuestas/captura/telefonica/{id}/iniciar-encuesta
```

---

## 2. Encuestas realizadas

### Listar encuestas realizadas

```http
GET /api/v1/encuestas/realizadas?fechaDesde=2026-07-01&fechaHasta=2026-07-31&servicio=Hospitalizaci%C3%B3n&canal=Presencial&estado=Completada&sat=5&nps=10&page=1&pageSize=10
```

### Obtener detalle de una realizada

```http
GET /api/v1/encuestas/realizadas/{id}
```

### Anular encuesta realizada

```http
POST /api/v1/encuestas/realizadas/{id}/anular
```

Body:

```json
{
  "motivo": "Registro incorrecto",
  "confirmada": true
}
```

---

## 3. Indicadores y brechas

### Indicadores de experiencia

```http
GET /api/v1/encuestas/indicadores/experiencia?rango=30d&servicio=Hospitalizaci%C3%B3n&canal=Presencial
```

### Nivel de satisfacción

```http
GET /api/v1/encuestas/indicadores/experiencia/nivel-satisfaccion?rango=30d&servicio=Hospitalizaci%C3%B3n&canal=Presencial
```

### Análisis de brechas

```http
GET /api/v1/encuestas/indicadores/brechas?servicio=Hospitalizaci%C3%B3n&estado=Completada&desde=2026-07-01&hasta=2026-07-31&page=1&pageSize=10
```

---

## 4. Cuestionarios

### Listar cuestionarios

```http
GET /api/v1/encuestas/cuestionarios?estado=Activo&canal=Presencial&page=1&pageSize=10
```

### Detalle de cuestionario

```http
GET /api/v1/encuestas/cuestionarios/{id}
```

### Crear cuestionario

```http
POST /api/v1/encuestas/cuestionarios
```

### Actualizar cuestionario

```http
PUT /api/v1/encuestas/cuestionarios/{id}
```

### Cambiar estado

```http
PATCH /api/v1/encuestas/cuestionarios/{id}/estado
```

### Duplicar cuestionario

```http
POST /api/v1/encuestas/cuestionarios/{id}/duplicar
```

### Eliminar cuestionario

```http
DELETE /api/v1/encuestas/cuestionarios/{id}
```

### Obtener estructura

```http
GET /api/v1/encuestas/cuestionarios/{id}/estructura
```

### Guardar estructura

```http
PUT /api/v1/encuestas/cuestionarios/{id}/estructura
```

### Agregar pregunta

```http
POST /api/v1/encuestas/cuestionarios/{id}/preguntas
```

### Editar pregunta

```http
PUT /api/v1/encuestas/cuestionarios/{id}/preguntas/{preguntaId}
```

### Actualizar lógica de pregunta

```http
PUT /api/v1/encuestas/cuestionarios/{id}/preguntas/{preguntaId}/logica
```

---

## 5. Parámetros

### Reglas activas

```http
GET /api/v1/encuestas/parametros/reglas
```

### Crear regla

```http
POST /api/v1/encuestas/parametros/reglas
```

### Cambiar estado de regla

```http
PATCH /api/v1/encuestas/parametros/reglas/{id}/estado
```

### Modo prueba

```http
GET /api/v1/encuestas/parametros/modo-prueba
PUT /api/v1/encuestas/parametros/modo-prueba
```

---

## 6. Auditoría y usuarios de encuestas

### Auditoría de encuestas

```http
GET /api/v1/encuestas/audit?modulo=Encuestas&resultado=exito&page=1&pageSize=20
```

### Detalle de auditoría

```http
GET /api/v1/encuestas/audit/{id}
```

### Usuarios del módulo

```http
GET /api/v1/encuestas/users?rol=Administrador&estado=true&page=1&pageSize=10
```

### Crear usuario del módulo

```http
POST /api/v1/encuestas/users
```

### Cambiar rol de usuario

```http
PATCH /api/v1/encuestas/users/{id}/rol
```

### Dashboard de inicio

```http
GET /api/v1/encuestas/dashboard/inicio
```

---

## 7. Notas para el frontend

- Las rutas antiguas documentadas en algunos análisis (`/surveys`, `/indicators`, `/gap-analysis`, `/params`) ya fueron reemplazadas por rutas reales bajo `/api/v1/encuestas/...`.
- El frontend debe consumir los endpoints reales de este documento.
- La API responde con envelopes tipo `{ data, meta }` o `{ data }` según el endpoint.
- Si el frontend necesita una ruta que aún no aparece aquí, debe revisarse contra el controlador real antes de usar una ruta histórica de la documentación.
