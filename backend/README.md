# Backend RioSoft (.NET 8)

Backend de **RioSoft** para Clínica del Río. Expone **Bital.ApiNegocio** como único punto de entrada del frontend, sobre arquitectura por capas (Clean Architecture).

Documentación general del monorepo: [README.md](../README.md)

## API pública

| Proyecto | Rol | Estado |
|---|---|---|
| `Bital.ApiNegocio` | Punto de entrada del frontend; reglas de negocio + consultas Vital | **Implementada** |

El frontend **solo debe consumir `Bital.ApiNegocio`**. El acceso read-only a Vital HIS está integrado en `Bital.Infrastructure` (no hay API intermedia separada en el flujo actual).

## Prerrequisitos

- Windows 10/11 (entorno de desarrollo actual)
- Git
- .NET SDK **8.0.423** (fijado en [`global.json`](./global.json))
- SQL Server 2019+ con bases `BitalNegocio` y `Hosvital_Pruebas`
- Visual Studio 2022 (17.8+) o VS Code con extensiones C# / ASP.NET

> Puede coexistir .NET 10 instalado. El backend queda fijado en .NET 8 mediante `global.json`.

## Estructura de la solución

```text
backend/
├── Bital.ApiNegocio/         # API Web (controllers, Program.cs)
├── Bital.Application/        # DTOs, interfaces, casos de uso
├── Bital.Domain/             # Entidades y reglas de dominio
├── Bital.Infrastructure/     # EF Core, servicios, acceso Vital
├── Bital.Shared/             # Contratos compartidos
├── Bital.UnitTests/
├── Bital.IntegrationTests/
├── scripts/                  # Migración SQL (Migrate-BitalNegocio.ps1)
├── publish-to-iis.ps1        # Publicación individual de la API
└── setup-iis-server.ps1      # Configuración IIS en el servidor
```

## Arquitectura

```text
Frontend (React)
      ↓  HTTPS + cookie JWT
Bital.ApiNegocio
      ↓
Application → Infrastructure
      ↓                    ↓
BitalNegocio (R/W)    Hosvital_Pruebas (read-only)
```

### Decisiones aplicadas

1. Una sola API pública: `Bital.ApiNegocio`.
2. Separación en capas con dependencias hacia el dominio.
3. Autenticación por cookie de sesión segura en HTTPS (prod: `Secure` + `HttpOnly` + `SameSite=Strict`, mismo origen vía proxy IIS).
4. Acceso Vital vía ADO.NET/EF con trimming explícito para esquema legacy.

## Ejecución local

Puerto definido en `Bital.ApiNegocio/Properties/launchSettings.json`:

| Entorno | URL | Swagger |
|---|---|---|
| Development | `http://localhost:8080` | `http://localhost:8080/swagger` |
| HTTPS (opcional) | `https://localhost:7031` | — |

```bash
cd backend
dotnet restore
dotnet build Bital.ApiNegocio/Bital.ApiNegocio.csproj
dotnet run --project Bital.ApiNegocio
```

Verificación:

```bash
dotnet test Bital.UnitTests/Bital.UnitTests.csproj
curl http://localhost:8080/health
```

## Controladores

| Controlador | Prefijo | Módulo |
|---|---|---|
| `AuthController` | `/api/v1/auth` | Autenticación |
| `PacientesController` | `/api/v1/pacientes` | Consultas Vital |
| `AtencionesController` | `/api/v1/atenciones` | Consultas Vital |
| `DietasCocinaController` | `/api/v1/dietas-cocina` | Dietas |
| `OrdenesCocinaController` | `/api/v1/dietas-cocina/ordenes-cocina` | Cocina |
| `ConciliacionController` | `/api/v1/dietas-cocina/conciliacion` | Conciliación |
| `EtiquetasController` | `/api/v1/dietas-cocina/etiquetas` | Etiquetas |
| `DashboardController` | `/api/v1/dietas-cocina/dashboard` | Dashboards |
| `UsuariosPermisosController` | `/api/v1/dietas-cocina/usuarios` | Usuarios y permisos |
| `ParametrosController` | `/api/v1/dietas-cocina/parametros` | Parámetros operativos |
| `AuditoriaController` | `/api/v1/dietas-cocina/auditoria` | Auditoría |
| `PacientesEncuestasController` | `/api/v1/encuestas/pacientes` | Encuestas |
| `CuestionariosController` | `/api/v1/encuestas/cuestionarios` | Encuestas |
| `ParametrosEncuestasController` | `/api/v1/encuestas/parametros` | Encuestas |
| `EncuestasAdministracionController` | `/api/v1/encuestas` | Admin encuestas |

Documentación detallada por módulo:

- [FRONTEND-API-GUIDE.md](./FRONTEND-API-GUIDE.md) — auth, pacientes, atenciones, health
- [Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md](./Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md)
- [Bital.ApiNegocio/README-ENDPOINTS-ENCUESTAS.md](./Bital.ApiNegocio/README-ENDPOINTS-ENCUESTAS.md)

## Configuración

Archivos por ambiente en `Bital.ApiNegocio/`:

| Archivo | Uso |
|---|---|
| `appsettings.json` | Base |
| `appsettings.Development.json` | Desarrollo local |
| `appsettings.Production.json` | IIS producción |
| `appsettings.Production.example.json` | Plantilla sin secretos |

Claves relevantes:

| Clave | Descripción |
|---|---|
| `ConnectionStrings:BitalDatabase` | SQL Server BitalNegocio |
| `ConnectionStrings:VitalDatabase` | SQL Server Vital (Hosvital_Pruebas) |
| `ConnectionStrings:VitalDatabaseReadOnly` | Vital con ApplicationIntent=ReadOnly |
| `Jwt:Key` | Clave de firma JWT (mín. 32 caracteres) |
| `Jwt:CookieName` | Nombre de cookie (`bital_access_token`) |
| `Cors:AllowedOrigins` | Orígenes del frontend |
| `Kestrel:Endpoints` | En prod: `http://127.0.0.1:8081` |

No commitear credenciales reales. En IIS pueden definirse como variables de entorno en `web.config`.

## Migración SQL Server (BitalNegocio)

- **Guía:** [docs/MIGRACION_SQL_SERVER.md](../docs/MIGRACION_SQL_SERVER.md)
- **Orquestador:** `backend/scripts/Migrate-BitalNegocio.ps1`
- **Datos seed:** `backend/scripts/02-MigrateData.sql`

```powershell
cd backend\scripts
.\Migrate-BitalNegocio.ps1
```

## Esquema legacy Vital

El esquema Vital usa convenciones antiguas (`char(N)` con espacios, tipos ambiguos). La infraestructura aplica trimming explícito en queries de atenciones e ingresos.

Tablas principales:

| Tabla | Propósito |
|---|---|
| `CAPBAS` | Datos demográficos del paciente |
| `MAEPAC` | Maestro de pacientes |
| `INGRESOS` | Ingresos hospitalarios activos |
| `MAEPAB` | Pabellones |

## Despliegue IIS

| Guía | Contenido |
|---|---|
| [DEPLOYMENT-IIS-GUIDE.md](./DEPLOYMENT-IIS-GUIDE.md) | Procedimiento completo |
| [DEPLOYMENT-QUICKSTART.md](./DEPLOYMENT-QUICKSTART.md) | Resumen en 3 pasos |
| [../docs/CIBERSEGURIDAD-PRODUCCION.md](../docs/CIBERSEGURIDAD-PRODUCCION.md) | Seguridad |

Build unificado desde la raíz:

```bash
pnpm build:iis
```

## Workspace Node (placeholder)

El paquete `backend` del monorepo pnpm incluye `src/index.js` (servidor 503 en puerto 3000). **No es el backend institucional**; solo satisface el script `pnpm dev:back`.
