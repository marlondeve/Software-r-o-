# Referencia de API — Bital.ApiNegocio

> **Alcance:** Endpoints **compartidos** de Bital.ApiNegocio (autenticación, pacientes, atenciones, health).  
> Los módulos de negocio tienen guías propias:
> - [README-ENDPOINTS-DIETAS.md](./Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md)
> - [README-ENDPOINTS-ENCUESTAS.md](./Bital.ApiNegocio/README-ENDPOINTS-ENCUESTAS.md)

Setup, arquitectura y ejecución local: [README.md](./README.md)

---

## URL base

| Entorno | Base URL | Swagger |
|---|---|---|
| Desarrollo local | `http://localhost:8080` | `http://localhost:8080/swagger` |
| Producción IIS | `https://riosoft.clinicadelrio.org` o `:8080` (mismo origen) | Solo red interna / diagnóstico |

En producción el frontend consume rutas relativas (`/api/v1`, `/health`); IIS hace proxy a `127.0.0.1:8081`.

Prefijo de versión: `/api/v1`

---

## Índice de endpoints

- [Autenticación](#autenticación)
- [Pacientes](#pacientes)
  - [Buscar por documento](#1-buscar-paciente-por-documento)
  - [Obtener por ID](#2-obtener-paciente-por-id)
  - [Buscar por nombre](#3-buscar-pacientes-por-nombre)
- [Atenciones](#atenciones-ingresos-hospitalarios)
  - [Listar activas](#1-listar-atenciones-activas)
  - [Obtener por ID](#2-obtener-atención-por-id)
  - [Listar por paciente](#3-listar-atenciones-por-paciente)
  - [Atenciones hospitalarias (Dietas)](#4-atenciones-hospitalarias-para-módulo-de-dietas)
- [Health Check](#health-check)

---

## Autenticación

El API emite el JWT en la cookie de sesión `bital_access_token`. El frontend usa `withCredentials: true` y **nunca accede al token desde JavaScript**.

| Entorno | Comportamiento |
|---|---|
| **Producción (HTTPS)** | Cookie `Secure` + `HttpOnly` + `SameSite=Strict`. Frontend y API comparten origen (`https://…` en :443 o :8080 → proxy IIS → `127.0.0.1:8081`). |
| **Desarrollo** | Proxy Vite (`/api` → `localhost:8080`). Cookie con `SameSite=Lax`; `Secure` si la petición es HTTPS o el ambiente es Production. |

| Endpoint | Auth | Descripción |
|---|---|---|
| `POST /api/v1/auth/login` | Anónimo | Login — body: `{ "usuario", "password" }` |
| `GET /api/v1/auth/me` | Cookie | Sesión actual |
| `POST /api/v1/auth/logout` | Cookie | Cierra sesión |
| `POST /api/v1/auth/cambiar-password` | Anónimo | Cambio de contraseña (rate limit 10/min por IP) |

**Login de ejemplo:**

```bash
curl -X POST "http://localhost:8080/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","password":"admin"}' \
  -c cookies.txt
```

**Respuesta exitosa (200):**

```json
{
  "data": {
    "id": "...",
    "usuario": "admin",
    "email": "admin@clinicadelrio.com",
    "nombreCompleto": "Administrador RioSoft",
    "rolNombre": "Administrador"
  }
}
```

Los endpoints de negocio (`/dietas-cocina/*`, `/encuestas/*`) requieren cookie de sesión válida salvo los marcados `[AllowAnonymous]`.

---

## Pacientes

### 1. Buscar Paciente por Documento

**Endpoint:**

```http
GET /api/v1/pacientes/buscar
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `numeroDocumento` | string | Sí | Número de documento | `1003195163` |
| `tipoDocumento` | string | Sí | Tipo de documento | `CC`, `TI`, `CE` |

**Ejemplo de Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/pacientes/buscar?numeroDocumento=1003195163&tipoDocumento=CC" -b cookies.txt -c cookies.txt
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": {
    "cedula": "1003195163",
    "tipoDocumento": "CC",
    "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
    "primerNombre": "MANUEL",
    "segundoNombre": "DE JESUS",
    "primerApellido": "LOPEZ",
    "segundoApellido": "MARTINEZ",
    "fechaNacimiento": "1996-01-14T00:00:00",
    "edad": 30,
    "sexo": "M",
    "email": "manuellopez@gmail.com",
    "telefono": "3001234567",
    "direccion": "VEREDA LA COROZA LAS CAÑAS BARRIO CERETE",
    "municipio": "162",
    "estado": "A",
    "nitEntidad": "22434",
    "fechaAfiliacion": "2020-01-15T00:00:00"
  },
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "v1"
}
```

**Errores Posibles:**

- `400 Bad Request` — Parámetros faltantes o inválidos
- `404 Not Found` — Paciente no encontrado
- `500 Internal Server Error` — Error de base de datos

**Datos de Prueba Válidos:**

```text
numeroDocumento: 1003195163, tipoDocumento: CC
numeroDocumento: 1067923999, tipoDocumento: CC
```

---

### 2. Obtener Paciente por ID

**Endpoint:**

```http
GET /api/v1/pacientes/{id}
```

**Parámetros Path:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `id` | string | Formato: `{documento}-{tipo}` | `1003195163-CC` |

**Ejemplo de Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/pacientes/1003195163-CC"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": {
    "cedula": "1003195163",
    "tipoDocumento": "CC",
    "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
    "primerNombre": "MANUEL",
    "segundoNombre": "DE JESUS",
    "primerApellido": "LOPEZ",
    "segundoApellido": "MARTINEZ",
    "fechaNacimiento": "1996-01-14T00:00:00",
    "edad": 30,
    "sexo": "M"
  },
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "v1"
}
```

**Datos de Prueba Válidos:**

```text
id: 1003195163-CC
id: 1067923999-CC
```

---

### 3. Buscar Pacientes por Nombre

**Endpoint:**

```http
GET /api/v1/pacientes/search
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `termino` | string | Sí | Nombre o apellido (mínimo 3 caracteres) | `MANUEL` |
| `maxResults` | int | No | Máximo de resultados (default: 20) | `10` |

**Ejemplo de Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/pacientes/search?termino=MANUEL&maxResults=10"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "cedula": "1003195163",
      "tipoDocumento": "CC",
      "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
      "primerNombre": "MANUEL",
      "edad": 30,
      "sexo": "M"
    },
    {
      "cedula": "987654321",
      "tipoDocumento": "CC",
      "nombreCompleto": "MANUEL ANTONIO GOMEZ RUIZ",
      "primerNombre": "MANUEL",
      "edad": 45,
      "sexo": "M"
    }
  ],
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "v1"
}
```

**Datos de Prueba Válidos:**

```text
termino: MANUEL
termino: LOPEZ
termino: YERALDINE
termino: PEÑATE
```

---

## Atenciones (Ingresos Hospitalarios)

### 1. Listar Atenciones Activas

**Endpoint:**

```http
GET /api/v1/atenciones
```

**Parámetros Query (Opcionales):**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `servicioId` | string | Filtrar por servicio específico | `3` |

**Ejemplo de Request:**

```bash
# Todas las atenciones activas
curl -X GET "http://localhost:8080/api/v1/atenciones"

# Filtradas por servicio
curl -X GET "http://localhost:8080/api/v1/atenciones?servicioId=3"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "cedula": "1003195163",
      "tipoDocumento": "CC",
      "consecutivo": 1,
      "paciente": {
        "cedula": "1003195163",
        "tipoDocumento": "CC",
        "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
        "primerNombre": "MANUEL",
        "segundoNombre": "DE JESUS",
        "primerApellido": "LOPEZ",
        "segundoApellido": "MARTINEZ",
        "fechaNacimiento": "1996-01-14T00:00:00",
        "edad": 30,
        "sexo": "M"
      },
      "claseProcedimiento": "3",
      "fechaAdmision": "2026-07-10T14:30:00",
      "fechaEgreso": null,
      "estadoActual": "Activo",
      "estaActivo": true,
      "diagnosticoEntrada": "J189",
      "diagnosticoSalida": null,
      "tipoHospitalizacion": "S",
      "numeroFactura": null
    }
  ],
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "v1"
}
```

**Lógica de Filtro:**

- Retorna solo ingresos con `fechaEgreso = NULL` (pacientes aún hospitalizados)
- Ordenados por fecha de admisión descendente (más recientes primero)
- Límite: 10 registros

---

### 2. Obtener Atención por ID

**Endpoint:**

```http
GET /api/v1/atenciones/{id}
```

**Parámetros Path:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `id` | int | Consecutivo del ingreso | `1` |

**Ejemplo de Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/atenciones/1"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": {
    "cedula": "1003195163",
    "tipoDocumento": "CC",
    "consecutivo": 1,
    "paciente": {
      "cedula": "1003195163",
      "tipoDocumento": "CC",
      "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
      "edad": 30,
      "sexo": "M"
    },
    "claseProcedimiento": "3",
    "fechaAdmision": "2026-06-10T14:57:07",
    "fechaEgreso": "2026-06-23T17:41:17",
    "estadoActual": "Egresado",
    "estaActivo": false,
    "diagnosticoEntrada": "E631",
    "diagnosticoSalida": "E631",
    "tipoHospitalizacion": "N",
    "numeroFactura": null
  },
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "v1"
}
```

**Datos de Prueba Válidos:**

```text
id: 1
id: 2
id: 3
```

---

### 3. Listar Atenciones por Paciente

**Endpoint:**

```http
GET /api/v1/atenciones/paciente
```

**Parámetros Query:**

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `numeroDocumento` | string | Sí | Número de documento | `1003195163` |
| `tipoDocumento` | string | Sí | Tipo de documento | `CC` |

**Ejemplo de Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/atenciones/paciente?numeroDocumento=1003195163&tipoDocumento=CC"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "cedula": "1003195163",
      "tipoDocumento": "CC",
      "consecutivo": 1,
      "paciente": {
        "cedula": "1003195163",
        "tipoDocumento": "CC",
        "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
        "edad": 30,
        "sexo": "M"
      },
      "fechaAdmision": "2026-06-10T14:57:07",
      "fechaEgreso": "2026-06-23T17:41:17",
      "estadoActual": "Egresado",
      "estaActivo": false
    },
    {
      "consecutivo": 5,
      "fechaAdmision": "2026-05-15T10:20:00",
      "fechaEgreso": "2026-05-20T16:00:00",
      "estadoActual": "Egresado",
      "estaActivo": false
    }
  ],
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "v1"
}
```

**Datos de Prueba Válidos:**

```text
numeroDocumento: 1003195163, tipoDocumento: CC
numeroDocumento: 1067923999, tipoDocumento: CC
```

---

### 4. Atenciones Hospitalarias (para Módulo de Dietas)

**Endpoint:**

```http
GET /api/v1/atenciones/hospitalarias
```

Endpoint especializado que retorna pacientes hospitalizados activos en pabellones 3–7, con información para el módulo de Dietas. Sin parámetros.

**Ejemplo de Request:**

```bash
curl -X GET "http://localhost:8080/api/v1/atenciones/hospitalarias"
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "idIngreso": 1,
      "tipoDocumento": "CC",
      "cedula": "1067923999",
      "nombreCompleto": "YERALDINE PEÑATE HOYOS",
      "pabellon": "HOSPITALIZACION PISO 3",
      "cama": "3HP02"
    },
    {
      "idIngreso": 2,
      "tipoDocumento": "CC",
      "cedula": "1003195163",
      "nombreCompleto": "MANUEL DE JESUS LOPEZ MARTINEZ",
      "pabellon": "HOSPITALIZACION PISO 1",
      "cama": "1HP01"
    }
  ],
  "timestamp": "2026-07-23T08:30:10Z",
  "version": "v1"
}
```

**Lógica de Filtro:**

- Pabellones incluidos: `3, 4, 5, 6, 7`
- `fechaEgreso IS NULL` (aún hospitalizado)
- `estadoSalida = 0 OR NULL` (activo)
- `continúaHospitalizado = 'S' OR NULL`
- Ordenado por pabellón y cama

**Campos Retornados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `idIngreso` | int | Consecutivo único del ingreso |
| `tipoDocumento` | string | Tipo de documento del paciente |
| `cedula` | string | Número de documento |
| `nombreCompleto` | string | Nombre completo del paciente |
| `pabellon` | string | Nombre del pabellón (tabla MAEPAB) |
| `cama` | string | Número de cama asignada |

---

## Health Check

**Endpoint:**

```http
GET /health
```

**Ejemplo de Request:**

```bash
curl -X GET "http://localhost:8080/health"
```

**Respuesta Exitosa (200 OK):**

```text
Healthy
```

**Respuesta de Error (503 Service Unavailable):**

```text
Unhealthy
```

Verifica disponibilidad del servicio y conexión a la base de datos Vital.

---

## Códigos de Estado HTTP

| Código | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| `200` | OK | Operación exitosa |
| `400` | Bad Request | Parámetros inválidos o faltantes |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Server Error | Error en el servidor o base de datos |
| `503` | Service Unavailable | Base de datos no disponible |

---

## Formato de Respuestas

### Respuesta Exitosa (Envelope)

Todas las respuestas exitosas siguen este formato:

```json
{
  "data": { },
  "timestamp": "2026-07-23T08:00:00Z",
  "version": "v1"
}
```

### Respuesta de Error (Problem Details — RFC 7807)

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Se requieren numeroDocumento y tipoDocumento",
  "instance": "/api/v1/pacientes/buscar"
}
```

---

## Datos de Prueba Consolidados

### Pacientes disponibles en BD de prueba

| Documento | Tipo | Nombre Completo |
|-----------|------|-----------------|
| `1003195163` | `CC` | MANUEL DE JESUS LOPEZ MARTINEZ |
| `1067923999` | `CC` | YERALDINE PEÑATE HOYOS |
| `1067921999` | `CC` | PAULA ANDREA MUÑOZ PLAZA |

### IDs de ingresos válidos

```text
1, 2, 3
```

### Términos de búsqueda válidos

```text
MANUEL, LOPEZ, YERALDINE, PEÑATE, PAULA, MUÑOZ
```
