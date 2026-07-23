# Backend BITAL (.NET 8)

Backend del proyecto **BITAL** (nombre código) para Clínica del Río. Expone dos APIs independientes sobre arquitectura por capas (Clean Architecture).

Documentación general del monorepo: [README.md](../README.md)

## APIs

| API | Rol | Estado |
|---|---|---|
| `Bital.ApiNegocio` | Punto de entrada para el frontend; reglas de negocio de Bital | Scaffold |
| `Bital.ApiConsultas` | Bridge read-only hacia el HIS Vital (SQL Server) | Implementada |

El frontend **solo debe consumir `Bital.ApiNegocio`**. ApiConsultas es un servicio interno que ApiNegocio orquestará cuando la integración esté completa.

Referencia detallada de endpoints de ApiConsultas: [FRONTEND-API-GUIDE.md](./FRONTEND-API-GUIDE.md)

## Prerrequisitos

- Windows 10/11 (entorno de desarrollo actual)
- Git
- .NET SDK **8.0.423** (fijado en [`global.json`](./global.json))
- Visual Studio 2022 Community (17.8+) con workloads:
  - ASP.NET and web development
  - Data storage and processing

> Puede coexistir .NET 10 instalado. El backend queda fijado en .NET 8 mediante `global.json`.

## Estructura de la solución

```text
backend/
├── Bital.sln
├── global.json
├── Bital.ApiConsultas/       # API REST read-only → Vital HIS
├── Bital.ApiNegocio/         # API de negocio (entrada del frontend)
├── Bital.Application/        # Casos de uso
├── Bital.Domain/             # Entidades y reglas de dominio
├── Bital.Infrastructure/     # Acceso a datos e integraciones
├── Bital.Shared/             # Código compartido entre APIs
├── Bital.UnitTests/
├── Bital.IntegrationTests/
└── src/index.js              # Placeholder Node (workspace pnpm, no es el backend real)
```

## Arquitectura

```text
Frontend (React)
      ↓
Bital.ApiNegocio  →  Application / Infrastructure  →  SQL Server Bital
      ↓
Bital.ApiConsultas  →  Vital HIS (read-only, ADO.NET + EF Core raw SQL)
```

### Decisiones aplicadas

1. Solución única `Bital.sln` para todo el backend.
2. Separación en capas con dirección de dependencias hacia el dominio.
3. APIs independientes: consultas (Vital) y negocio (Bital).
4. ApiConsultas usa DbContext read-only (`NoTracking`, bloqueo de escritura).

## Ejecución local

Puertos definidos en `Properties/launchSettings.json` de cada proyecto:

| API | HTTP | HTTPS | Swagger |
|---|---|---|---|
| ApiConsultas | 5013 | 7006 | `http://localhost:5013/swagger` |
| ApiNegocio | 5042 | 7031 | `http://localhost:5042/swagger` |

```bash
cd backend
dotnet restore
dotnet build Bital.sln
dotnet run --project Bital.ApiConsultas
dotnet run --project Bital.ApiNegocio
```

Verificación:

```bash
dotnet test Bital.sln
```

Resultado esperado: `0 Warning(s)` y `0 Error(s)`.

## Bital.ApiConsultas

Bridge read-only que expone datos del HIS **Vital** (SQL Server) mediante API REST.

**Implementado:**

- Endpoints de pacientes y atenciones (ingresos hospitalarios)
- Health checks (API y base de datos)
- Swagger/OpenAPI, versionado v1, CORS para desarrollo local
- Logging estructurado con Serilog
- ADO.NET puro para queries legacy; EF Core con SQL raw para pacientes

**Endpoints principales** (detalle completo en [FRONTEND-API-GUIDE.md](./FRONTEND-API-GUIDE.md)):

```http
GET /api/v1/pacientes/buscar
GET /api/v1/pacientes/{id}
GET /api/v1/pacientes/search
GET /api/v1/atenciones
GET /api/v1/atenciones/{id}
GET /api/v1/atenciones/paciente
GET /api/v1/atenciones/hospitalarias
GET /health
```

## Bital.ApiNegocio

Scaffold inicial. Será el único punto de entrada del frontend para operaciones de negocio (órdenes, menús, autenticación, etc.). Actualmente expone solo el endpoint de plantilla `/weatherforecast`.

## Configuración

La configuración por ambiente vive en `appsettings.json` y `appsettings.Development.json` de cada proyecto.

**ApiConsultas** — claves relevantes:

| Clave | Descripción |
|---|---|
| `ConnectionStrings:VitalDatabase` | Conexión al SQL Server de Vital |
| `ConnectionStrings:VitalDatabaseReadOnly` | Conexión read-only (ApplicationIntent) |
| `Cors:AllowedOrigins` | Orígenes permitidos (incluye `http://localhost:5173`) |
| `Serilog` | Niveles y sinks de logging |

Para desarrollo local, editar `Bital.ApiConsultas/appsettings.Development.json`. En entornos compartidos o producción, usar [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) o variables de entorno — no commitear credenciales.

> **Nota:** `DiagnosticoController` está disponible solo en Development para inspeccionar tablas legacy. Deshabilitar en producción.

## Workspace Node (placeholder)

El paquete `backend` del monorepo pnpm incluye un servidor Node mínimo (`src/index.js`) que responde 503. Sirve únicamente para el script `pnpm dev:back` (puerto 3000). **No es el backend institucional**; el backend real es la solución .NET descrita arriba.

## Esquema legacy Vital

El esquema Vital no sigue convenciones modernas (campos `char(N)` con espacios, tipos ambiguos, sin constraints). ApiConsultas maneja esto con trimming explícito y ADO.NET para control total sobre tipos en queries de atenciones.

Tablas principales consultadas:

| Tabla | Propósito |
|---|---|
| `CAPBAS` | Datos demográficos del paciente |
| `MAEPAC` | Maestro de pacientes |
| `INGRESOS` | Movimientos/ingresos hospitalarios |
