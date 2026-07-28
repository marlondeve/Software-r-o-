# Backend BITAL (.NET 8)

Backend del proyecto **BITAL** (nombre código) para Clínica del Río. Expone una API sobre arquitectura por capas (Clean Architecture).

Documentación general del monorepo: [README.md](../README.md)

## APIs

| API | Rol | Estado |
|---|---|---|
| `Bital.ApiNegocio` | Punto de entrada para el frontend; reglas de negocio y consultas integradas | Implementada |

El frontend **solo debe consumir `Bital.ApiNegocio`**.

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
Bital.ApiNegocio  →  Application / Infrastructure  →  SQL Server Bital + Vital HIS
```

### Decisiones aplicadas

1. Solución única `Bital.sln` para todo el backend.
2. Separación en capas con dirección de dependencias hacia el dominio.
3. Una sola API pública: `Bital.ApiNegocio`.
4. Acceso read-only a Vital integrado en la capa de infraestructura.

## Ejecución local

Puertos definidos en `Properties/launchSettings.json` de cada proyecto:

| API | HTTP | HTTPS | Swagger |
|---|---|---|---|
| ApiNegocio | 5042 | 7031 | `http://localhost:5042/swagger` |

```bash
cd backend
dotnet restore
dotnet build Bital.sln
dotnet run --project Bital.ApiNegocio
```

Verificación:

```bash
dotnet test Bital.sln
```

Resultado esperado: `0 Warning(s)` y `0 Error(s)`.

## Bital.ApiNegocio

Será el único punto de entrada del frontend para operaciones de negocio y consultas integradas.

## Configuración

La configuración por ambiente vive en `appsettings.json` y `appsettings.Development.json` de cada proyecto.

**ApiNegocio** — claves relevantes:

| Clave | Descripción |
|---|---|
| `ConnectionStrings:BitalDatabase` | Conexión al SQL Server de negocio |
| `ConnectionStrings:VitalDatabase` | Conexión al SQL Server de Vital |
| `ConnectionStrings:VitalDatabaseReadOnly` | Conexión read-only (ApplicationIntent) |
| `Cors:AllowedOrigins` | Orígenes permitidos (incluye `http://localhost:5173`) |
| `Serilog` | Niveles y sinks de logging |

Para desarrollo local, editar `Bital.ApiNegocio/appsettings.Development.json`. En entornos compartidos o producción, usar [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) o variables de entorno — no commitear credenciales.

## Workspace Node (placeholder)

El paquete `backend` del monorepo pnpm incluye un servidor Node mínimo (`src/index.js`) que responde 503. Sirve únicamente para el script `pnpm dev:back` (puerto 3000). **No es el backend institucional**; el backend real es la solución .NET descrita arriba.

## Migración SQL Server (BitalNegocio)

Scripts y guía completa para crear la base operativa e importar datos desde Vital (incluye roles dinámicos `RolesModulo`):

- **Guía:** [docs/MIGRACION_SQL_SERVER.md](../docs/MIGRACION_SQL_SERVER.md)
- **Orquestador:** `backend/scripts/Migrate-BitalNegocio.ps1`
- **Datos:** `backend/scripts/02-MigrateData.sql`

## Esquema legacy Vital

El esquema Vital no sigue convenciones modernas (campos `char(N)` con espacios, tipos ambiguos, sin constraints). La capa de infraestructura maneja esto con trimming explícito y ADO.NET para control total sobre tipos en queries de atenciones.

Tablas principales consultadas:

| Tabla | Propósito |
|---|---|
| `CAPBAS` | Datos demográficos del paciente |
| `MAEPAC` | Maestro de pacientes |
| `INGRESOS` | Movimientos/ingresos hospitalarios |
