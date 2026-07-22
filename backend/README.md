# Backend BITAL (.NET 8)

Backend institucional de **BITAL** para Clínica del Río, organizado con arquitectura por capas y dos APIs:

- `Bital.ApiConsultas` (bridge read-only hacia Vital)
- `Bital.ApiNegocio` (reglas de negocio de Bital)

## Estado actual

Estructura base creada y compilando en `.NET 8` dentro de `backend/`.

## Prerrequisitos

- Windows 10/11
- Git for Windows
- .NET SDK **8.0.423**
- Visual Studio 2022 Community (17.8 o superior) con workloads:
  - ASP.NET and web development
  - Data storage and processing

> Nota: puede coexistir .NET 10 instalado. El backend queda fijado en .NET 8 con `global.json`.

## Estructura actual

```text
backend/
├── Bital.sln
├── global.json
├── Bital.ApiConsultas/
├── Bital.ApiNegocio/
├── Bital.Application/
├── Bital.Domain/
├── Bital.Infrastructure/
├── Bital.Shared/
├── Bital.UnitTests/
└── Bital.IntegrationTests/
```

## Decisiones de arquitectura aplicadas

1. Solución única `Bital.sln` para backend.
2. Separación en capas (`Domain`, `Application`, `Infrastructure`, `Shared`).
3. APIs independientes (`ApiConsultas` y `ApiNegocio`).
4. Referencias entre proyectos definidas según dirección de dependencias de Clean Architecture.
5. Rama de trabajo para desarrollo de API de consultas: `feature/api-consultas-juandev`.

---

## 🎯 Guía de Integración para Frontend

### Arquitectura de comunicación

El frontend **solo debe consumir `Bital.ApiNegocio`**. Esta API es el único punto de entrada para todas las operaciones del sistema Bital.

```
Frontend (React/Vite)
    ↓
Bital.ApiNegocio (puerto 5001/5000)
    ↓
Bital.ApiConsultas (puerto 5003/5002) → Vital (HIS)
    ↓
SQL Server Bital
```

### URLs Base por Ambiente

#### Development (local)
- **API Negocio**: `https://localhost:5001` o `http://localhost:5000`
- **API Consultas**: `https://localhost:5003` o `http://localhost:5002` *(solo para referencia, no consumir directamente)*

#### Testing/Staging
- **API Negocio**: `https://bital-api-test.clinicadelrio.com`

#### Production
- **API Negocio**: `https://bital-api.clinicadelrio.com`

### Versionado de API

Todas las APIs usan versionado en URL:

```
https://localhost:5001/api/v1/{recurso}
```

- Versión actual: **v1**
- Header alternativo (opcional): `Api-Version: 1.0`

### Formato de Respuesta Estándar

#### ✅ Respuesta Exitosa

```json
{
  "data": {
    // Objeto o array con los datos solicitados
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "v1"
}
```

#### ❌ Respuesta de Error (RFC 7807 - Problem Details)

```json
{
  "type": "https://bital.clinicadelrio.com/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Uno o más campos de validación fallaron",
  "instance": "/api/v1/ordenes",
  "traceId": "00-abc123...",
  "errors": {
    "pacienteId": ["El campo pacienteId es requerido"],
    "menu": ["El menú seleccionado no está disponible"]
  }
}
```

#### Códigos HTTP Comunes

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa (GET, PUT, PATCH) |
| 201 | Created | Recurso creado exitosamente (POST) |
| 204 | No Content | Operación exitosa sin contenido (DELETE) |
| 400 | Bad Request | Datos inválidos o validación fallida |
| 401 | Unauthorized | No autenticado |
| 403 | Forbidden | No autorizado para este recurso |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto de negocio (ej: orden duplicada) |
| 500 | Internal Server Error | Error del servidor |

### Headers Requeridos

#### Request Headers

```http
Content-Type: application/json
Accept: application/json
Api-Version: 1.0 (opcional, por defecto v1)
Authorization: Bearer {token} (cuando se implemente autenticación)
```

#### Response Headers

```http
Content-Type: application/json; charset=utf-8
X-Correlation-Id: {guid}
X-Api-Version: v1
```

### Endpoints Principales (API Negocio)

#### 🏥 Módulo de Órdenes de Alimentación

```http
# Consultar órdenes activas
GET /api/v1/ordenes?fecha={yyyy-MM-dd}&servicioId={id}

# Crear nueva orden
POST /api/v1/ordenes
{
  "atencionId": "12345",
  "pacienteId": "P001",
  "tipoComida": "Almuerzo",
  "menuId": "M-001",
  "restricciones": ["Sin sal", "Diabético"],
  "observaciones": "Paciente prefiere porciones pequeñas"
}

# Actualizar orden
PUT /api/v1/ordenes/{id}

# Cancelar orden
DELETE /api/v1/ordenes/{id}
```

#### 👤 Módulo de Pacientes (consulta desde Vital)

```http
# Buscar paciente
GET /api/v1/pacientes?numeroDocumento={cc}&tipoDocumento={tipo}

# Obtener atenciones activas de un paciente
GET /api/v1/pacientes/{id}/atenciones
```

#### 🍽️ Módulo de Menús

```http
# Listar menús disponibles por tipo de comida
GET /api/v1/menus?tipoComida={tipo}&fecha={yyyy-MM-dd}

# Obtener detalle de menú
GET /api/v1/menus/{id}
```

#### 🏢 Módulo de Servicios/Habitaciones

```http
# Listar servicios hospitalarios
GET /api/v1/servicios

# Listar habitaciones por servicio
GET /api/v1/servicios/{id}/habitaciones

# Listar camas por habitación
GET /api/v1/habitaciones/{id}/camas
```

### Ejemplos de Integración

#### Ejemplo 1: Consultar atenciones activas para tomar orden

```javascript
// Frontend (React/Vite)
const fetchAtencionesActivas = async (servicioId) => {
  try {
    const response = await fetch(
      `https://localhost:5001/api/v1/atenciones?servicioId=${servicioId}&estado=activa`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Error al consultar atenciones');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

#### Ejemplo 2: Crear orden de alimentación

```javascript
const crearOrden = async (ordenData) => {
  try {
    const response = await fetch('https://localhost:5001/api/v1/ordenes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(ordenData)
    });

    if (!response.ok) {
      const error = await response.json();
      // Manejar errores de validación
      if (error.status === 400 && error.errors) {
        console.error('Errores de validación:', error.errors);
      }
      throw new Error(error.detail || 'Error al crear orden');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

### Paginación

Para endpoints que retornan colecciones grandes:

```http
GET /api/v1/ordenes?page=1&pageSize=20

Response:
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 98
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Filtrado y Búsqueda

```http
# Filtros múltiples
GET /api/v1/ordenes?fecha=2025-01-15&servicioId=3&estado=pendiente

# Búsqueda por texto
GET /api/v1/pacientes?search=Juan&page=1&pageSize=10
```

### Caché y Optimización

- Usar `ETag` headers para caché condicional cuando esté disponible
- Implementar debouncing en búsquedas (mínimo 300ms)
- Considerar usar React Query o SWR para caché de datos

### Swagger/OpenAPI

Cuando el backend esté corriendo, acceder a la documentación interactiva:

```
https://localhost:5001/swagger
```

### Autenticación (próximamente)

Se implementará autenticación basada en JWT. El flujo será:

1. Login → obtener token
2. Incluir token en header `Authorization: Bearer {token}`
3. Renovar token antes de expiración

### Manejo de Errores Recomendado

```javascript
const handleApiError = (error) => {
  if (error.status === 401) {
    // Redirigir a login
    window.location.href = '/login';
  } else if (error.status === 403) {
    // Mostrar mensaje de permisos insuficientes
    toast.error('No tienes permisos para realizar esta acción');
  } else if (error.status === 400 && error.errors) {
    // Mostrar errores de validación en formulario
    Object.keys(error.errors).forEach(field => {
      showFieldError(field, error.errors[field][0]);
    });
  } else {
    // Error genérico
    toast.error(error.detail || 'Ocurrió un error inesperado');
  }
};
```

---

## Registro de instalación y bootstrap

Comandos usados para crear la base técnica:

```bash
cd backend
dotnet new globaljson --sdk-version 8.0.423 --roll-forward latestPatch
dotnet new sln --name Bital

dotnet new webapi -n Bital.ApiConsultas --framework net8.0 --no-openapi false
dotnet new webapi -n Bital.ApiNegocio --framework net8.0 --no-openapi false
dotnet new classlib -n Bital.Domain --framework net8.0
dotnet new classlib -n Bital.Application --framework net8.0
dotnet new classlib -n Bital.Infrastructure --framework net8.0
dotnet new classlib -n Bital.Shared --framework net8.0
dotnet new xunit -n Bital.UnitTests --framework net8.0
dotnet new xunit -n Bital.IntegrationTests --framework net8.0
```

Agregar proyectos a la solución:

```bash
dotnet sln Bital.sln add Bital.ApiConsultas/Bital.ApiConsultas.csproj
dotnet sln Bital.sln add Bital.ApiNegocio/Bital.ApiNegocio.csproj
dotnet sln Bital.sln add Bital.Domain/Bital.Domain.csproj
dotnet sln Bital.sln add Bital.Application/Bital.Application.csproj
dotnet sln Bital.sln add Bital.Infrastructure/Bital.Infrastructure.csproj
dotnet sln Bital.sln add Bital.Shared/Bital.Shared.csproj
dotnet sln Bital.sln add Bital.UnitTests/Bital.UnitTests.csproj
dotnet sln Bital.sln add Bital.IntegrationTests/Bital.IntegrationTests.csproj
```

Referencias entre proyectos:

```bash
dotnet add Bital.Application/Bital.Application.csproj reference Bital.Domain/Bital.Domain.csproj
dotnet add Bital.Application/Bital.Application.csproj reference Bital.Shared/Bital.Shared.csproj

dotnet add Bital.Infrastructure/Bital.Infrastructure.csproj reference Bital.Application/Bital.Application.csproj
dotnet add Bital.Infrastructure/Bital.Infrastructure.csproj reference Bital.Domain/Bital.Domain.csproj
dotnet add Bital.Infrastructure/Bital.Infrastructure.csproj reference Bital.Shared/Bital.Shared.csproj

dotnet add Bital.ApiNegocio/Bital.ApiNegocio.csproj reference Bital.Application/Bital.Application.csproj
dotnet add Bital.ApiNegocio/Bital.ApiNegocio.csproj reference Bital.Infrastructure/Bital.Infrastructure.csproj
dotnet add Bital.ApiNegocio/Bital.ApiNegocio.csproj reference Bital.Shared/Bital.Shared.csproj

dotnet add Bital.ApiConsultas/Bital.ApiConsultas.csproj reference Bital.Shared/Bital.Shared.csproj

dotnet add Bital.UnitTests/Bital.UnitTests.csproj reference Bital.Application/Bital.Application.csproj
dotnet add Bital.UnitTests/Bital.UnitTests.csproj reference Bital.Domain/Bital.Domain.csproj
dotnet add Bital.IntegrationTests/Bital.IntegrationTests.csproj reference Bital.ApiNegocio/Bital.ApiNegocio.csproj
dotnet add Bital.IntegrationTests/Bital.IntegrationTests.csproj reference Bital.Infrastructure/Bital.Infrastructure.csproj
```

## Paquetes instalados inicialmente en `Bital.ApiConsultas`

```bash
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 8.0.13
dotnet add package Serilog.AspNetCore --version 8.0.3
dotnet add package Serilog.Sinks.Console --version 6.0.0
dotnet add package Serilog.Sinks.File --version 6.0.0
dotnet add package Asp.Versioning.Mvc --version 8.1.0
dotnet add package Asp.Versioning.Mvc.ApiExplorer --version 8.1.0
```

## Verificación mínima local

```bash
dotnet restore
dotnet build Bital.sln
```

Resultado esperado: `0 Warning(s)` y `0 Error(s)`.

## Siguientes pasos técnicos

1. Configurar `appsettings` por ambiente para `Bital.ApiConsultas`.
2. Configurar logging estructurado con Serilog.
3. Definir acceso read-only a SQL Server Vital.
4. Crear endpoints iniciales de consulta (`atenciones activas`, `pacientes`, `servicios/habitaciones/camas`).
