# Bital.ApiNegocio - Guía para levantar en local

Este documento explica cómo ejecutar la API en una máquina de desarrollo para que el equipo frontend pueda probar los endpoints de encuestas y dietas.

## Requisitos

- .NET 8 SDK
- SQL Server 2019 o superior
- SQL Server Management Studio o Azure Data Studio
- Visual Studio 2026 / 2022 o consola PowerShell

## Proyectos involucrados

- `backend/Bital.ApiNegocio`
- `backend/Bital.Infrastructure`
- `backend/Bital.Application`
- `backend/Bital.Domain`
- `backend/Bital.Shared`

## Base de datos local

La API usa dos bases de datos:

- `BitalNegocio` -> base de negocio del módulo
- `Hosvital_Pruebas` -> consultas HIS / atenciones / pacientes

### Crear la base de negocio

Si no tienes la base creada, ejecuta:

```sql
CREATE DATABASE BitalNegocio;
GO
```

Si prefieres crearla con un archivo `.sql` usando el script generado de migraciones, revisa `backend/Bital.Infrastructure/BitalNegocio_AllTables.sql`.

### Restaurar o preparar la base HIS

La base `Hosvital_Pruebas` debe existir en el servidor o en tu SQL local si quieres probar contra una copia.

## Configuración

### Opción recomendada: Development

Revisa `backend/Bital.ApiNegocio/appsettings.Development.json` y ajusta las cadenas de conexión según tu entorno.

Ejemplo:

```json
{
  "ConnectionStrings": {
	"BitalDatabase": "Server=localhost,1433;Database=BitalNegocio;User Id=sa;Password=TU_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true",
	"VitalDatabase": "Server=localhost,1433;Database=Hosvital_Pruebas;User Id=sa;Password=TU_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true",
	"VitalDatabaseReadOnly": "Server=localhost,1433;Database=Hosvital_Pruebas;User Id=sa;Password=TU_PASSWORD;TrustServerCertificate=True;ApplicationIntent=ReadOnly;MultipleActiveResultSets=true"
  }
}
```

> Si usas otro usuario, cambia `User Id` y `Password` por los valores de tu instancia.

## Aplicar migraciones

Desde la raíz del repositorio:

```powershell
cd backend
 dotnet ef database update --project .\Bital.Infrastructure\Bital.Infrastructure.csproj --startup-project .\Bital.ApiNegocio\Bital.ApiNegocio.csproj --context BitalNegocioDbContext
```

Si prefieres, abre la solución en Visual Studio y ejecuta la migración desde la consola del Package Manager o el terminal integrado.

## Ejecutar la API

### Desde Visual Studio

1. Abrir `backend/Bital.sln`
2. Establecer `Bital.ApiNegocio` como proyecto de inicio
3. Seleccionar perfil `http`
4. Ejecutar con F5

### Desde consola

```powershell
cd backend\Bital.ApiNegocio
 dotnet run
```

## Puertos

En desarrollo la API expone el puerto configurado en `launchSettings.json`.

Por defecto:
- HTTP: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`

## Verificación rápida

- `GET /swagger`
- `GET /health`
- `GET /api/v1/encuestas/pacientes/search?termino=...`
- `GET /api/v1/encuestas/realizadas`

## Qué necesita el equipo frontend para probar

- URL base de la API en local o en servidor
- CORS habilitado para el origen del frontend
- Base `BitalNegocio` accesible
- Base `Hosvital_Pruebas` accesible
- Migraciones ejecutadas

## Notas importantes

- El módulo de encuestas ya tiene endpoints reales para captura, realizadas, indicadores, parámetros y administración.
- Si el frontend consume rutas antiguas documentadas, debe cambiarse a las rutas reales del controlador.
- Algunos flujos de dietas todavía tienen `TODO` de autenticación y usuario hardcodeado.
