# Bital API Negocio - Configuración

## Requisitos Previos

- .NET 8 SDK
- SQL Server 2019+
- Visual Studio 2022+ o VS Code con extensiones C#

## Base de Datos

### 1. Crear Base de Datos

```sql
CREATE DATABASE BitalNegocio;
GO
```

### 2. Actualizar Connection String

Editar `backend/Bital.ApiNegocio/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
	"BitalDatabase": "Server=localhost;Database=BitalNegocio;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### 3. Aplicar Migraciones

```bash
cd backend/Bital.Infrastructure
dotnet ef database update --startup-project ../Bital.ApiNegocio/Bital.ApiNegocio.csproj
```

### 4. Datos Iniciales (Opcional)

Ejecutar el script `backend/Bital.Infrastructure/Data/SeedData.sql` en SQL Server Management Studio o Azure Data Studio.

## Configuración de APIs

### ApiNegocio (Business Logic)

Corre por defecto en el puerto **5042** (HTTP).

## Ejecutar la API

### Desde Visual Studio

1. Establecer `Bital.ApiNegocio` como proyecto de inicio
2. Presionar F5

### Desde CLI

```bash
cd backend/Bital.ApiNegocio
dotnet run
```

La API estará disponible en:
- **Swagger**: http://localhost:5042/swagger
- **Health Check**: http://localhost:5042/health

## Endpoints Principales - Dietas y Cocina

### Obtener Censo de Dietas
```
GET /api/v1/dietas-cocina/censo?fecha=2025-01-25&comida=Almuerzo
```

### Obtener Catálogo de Dietas
```
GET /api/v1/dietas-cocina/catalogo
```

### Solicitar Dieta
```
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/solicitud
Body:
{
  "tipoDietaId": "guid-del-tipo",
  "consistencia": "Blanda",
  "observaciones": "Sin lactosa",
  "guardar": false
}
```

### Confirmar Dieta
```
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/confirmar
```

### Confirmación Masiva
```
POST /api/v1/dietas-cocina/dietas/bulk/confirmar
Body:
{
  "dietasIds": ["guid1", "guid2", "guid3"],
  "usuario": "Juan.Perez"
}
```

### Cancelar Dieta
```
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/cancelar
Body: "Motivo de cancelación"
```

## Estructura del Proyecto

```
backend/
├── Bital.Domain/              # Entidades y enums
│   ├── Entities/
│   │   └── DietasCocina/
│   ├── Enums/
│   └── Common/
├── Bital.Application/         # DTOs e interfaces
│   ├── DTOs/
│   │   └── DietasCocina/
│   └── Interfaces/
├── Bital.Infrastructure/      # EF Core, servicios
│   ├── Data/
│   │   ├── Configurations/
│   │   └── Migrations/
│   └── Services/
└── Bital.ApiNegocio/          # API Web
	└── Controllers/
```

## Logs

Los logs se guardan en:
- **Desarrollo**: `logs/bital-api-negocio-*.log`
- **Producción**: Configurado en `appsettings.json`

## Próximos Pasos

1. ✅ Modelo de datos Dietas-Cocina
2. ✅ Endpoints core de dietas
3. ⏳ Implementar autenticación JWT
4. ⏳ Validaciones de negocio (ventanas de confirmación, cancelación tardía)
5. ⏳ Órdenes de cocina (agrupación y envío)
6. ⏳ Trazabilidad completa de eventos
7. ⏳ Módulo de Encuestas SIAO

## Notas

- El usuario que confirma/solicita dietas actualmente está hardcodeado como `"TestUser"`.
- Se debe implementar autenticación JWT y extraer el usuario del token.
- Las validaciones de negocio (horarios, cancelación tardía) están pendientes.
