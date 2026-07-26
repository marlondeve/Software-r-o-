# Guía de Consumo del API de Negocio para Frontend

**Fecha:** 2026-01-26  
**API Base URL (Producción):** `http://186.190.254.230:8080`  
**API Base URL (Desarrollo Local):** `http://localhost:5042`  
**Versión:** v1

---

## 📋 Índice

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Flujo de Trabajo: Dietas y Cocina](#flujo-de-trabajo-dietas-y-cocina)
5. [Modelos de Datos](#modelos-de-datos)
6. [Ejemplos de Integración](#ejemplos-de-integración)
7. [Manejo de Errores](#manejo-de-errores)
8. [Consideraciones de Rendimiento](#consideraciones-de-rendimiento)

---

## 📌 Información General

### Arquitectura

```
┌─────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Frontend   │────────▶│  API Negocio     │────────▶│  API Consultas   │
│  (React/    │  HTTP   │  Puerto: 8080    │  HTTP   │  (Interna)       │
│   Angular)  │         │  Pública         │ Interno │  Puerto: 5000    │
└─────────────┘         └──────────────────┘         └──────────────────┘
							   │
							   ▼
						┌──────────────┐
						│  BitalNegocio│
						│  (SQL Server)│
						└──────────────┘
```

### Características

- ✅ API REST sobre HTTP/JSON
- ✅ Versionamiento de API: `/api/v1`
- ✅ Documentación Swagger: `http://186.190.254.230:8080/swagger`
- ✅ Health Check: `http://186.190.254.230:8080/health`
- ⏳ Autenticación JWT (en desarrollo - por ahora no requerida)
- ⏳ CORS configurado para permitir orígenes autorizados

### Formato de Respuesta Estándar

**Exitosa (200 OK):**
```json
{
  "id": "abc123",
  "nombre": "Paciente Test",
  "estado": "Confirmada"
}
```

**Error (400/404/500):**
```json
{
  "error": "Descripción corta del error",
  "message": "Mensaje detallado del error"
}
```

---

## 🔐 Autenticación

### Estado Actual (MVP)

**Temporalmente sin autenticación requerida** mientras se completa el sistema de usuarios.

### Próximamente (Producción Final)

Se requerirá JWT Bearer Token en todas las peticiones:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Login endpoint (futuro):**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "usuario": "nutricionista01",
  "password": "******"
}
```

**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expira": "2026-01-27T10:00:00Z",
  "usuario": {
	"id": "user123",
	"nombre": "María Pérez",
	"rol": "Nutricionista"
  }
}
```

---

## 🌐 Endpoints Disponibles

### 1. Health Check

**Verificar salud de la API**

```http
GET /health
```

**Respuesta (200 OK):**
```json
{
  "status": "Healthy",
  "totalDuration": "00:00:00.1234567",
  "entries": {
	"database": {
	  "status": "Healthy",
	  "description": "Database connection is healthy"
	}
  }
}
```

---

### 2. Catálogo de Dietas

**Obtener tipos de dietas disponibles con tarifas vigentes**

```http
GET /api/v1/dietas-cocina/catalogo
```

**Respuesta (200 OK):**
```json
[
  {
	"id": 1,
	"codigo": "DN001",
	"nombre": "Dieta Normal",
	"tipo": "Normal",
	"descripcion": "Dieta balanceada completa",
	"activo": true,
	"tarifaActual": 25000.00
  },
  {
	"id": 2,
	"codigo": "DB001",
	"nombre": "Dieta Blanda",
	"tipo": "Terapéutica",
	"descripcion": "Para pacientes con dificultad digestiva",
	"activo": true,
	"tarifaActual": 28000.00
  }
]
```

**Uso típico:**
- Cargar dropdown/select para selección de tipo de dieta
- Mostrar precios estimados al usuario
- Validar que códigos de dieta existan antes de solicitar

---

### 3. Obtener Censo de Dietas

**Consultar pacientes hospitalizados y sus dietas para una fecha/comida específica**

```http
GET /api/v1/dietas-cocina/censo?fecha=2026-01-26&comida=Almuerzo
```

**Parámetros Query:**
- `fecha` (requerido): Formato `YYYY-MM-DD`
- `comida` (requerido): `Desayuno` | `Almuerzo` | `Cena` | `Refrigerio`

**Respuesta (200 OK):**
```json
{
  "fecha": "2026-01-26",
  "comida": "Almuerzo",
  "total": 15,
  "filasDietas": [
	{
	  "id": "550e8400-e29b-41d4-a716-446655440001",
	  "pacienteId": "PAC001",
	  "cedula": "1234567890",
	  "tipoDocumento": "CC",
	  "idIngreso": "ING2026001",
	  "paciente": "PÉREZ GÓMEZ JUAN",
	  "edad": 45,
	  "servicio": "Medicina Interna",
	  "pabellon": "A",
	  "habitacion": "201",
	  "fechaOperativa": "2026-01-26",
	  "comida": "Almuerzo",
	  "estado": "Pendiente",
	  "tipoDietaId": null,
	  "tipoDieta": null,
	  "consistencia": null,
	  "descripcionDieta": null,
	  "observaciones": null,
	  "solicitadoPor": null,
	  "solicitadoEn": null
	}
  ]
}
```

**Estados posibles de una dieta:**
- `Pendiente`: Sin solicitud aún
- `Guardado`: Guardado temporal sin confirmar
- `Solicitada`: Solicitada por nutrición (esperando confirmación)
- `Confirmada`: Confirmada y enviada a cocina
- `EnPreparacion`: En preparación en cocina
- `ListaEnvio`: Lista para envío
- `EnRuta`: En ruta a pabellón
- `Entregada`: Entregada al paciente
- `Consumida`: Consumida por el paciente
- `Cancelada`: Cancelada

**Uso típico:**
- Pantalla principal del censo diario
- Refrescar cada X minutos para ver cambios
- Filtrar por estado para ver pendientes/confirmadas
- Indicar visualmente estado con colores

---

### 4. Solicitar/Actualizar Dieta

**Registrar la solicitud de dieta para un paciente**

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/solicitar
Content-Type: application/json

{
  "tipoDietaId": 1,
  "consistencia": "Blanda",
  "descripcionDieta": "Dieta normal sin azúcar",
  "observaciones": "Paciente con diabetes tipo 2"
}
```

**Parámetros Path:**
- `filaDietaId`: GUID de la fila obtenida del censo

**Body (JSON):**
```typescript
{
  tipoDietaId?: number;          // ID del tipo de dieta del catálogo
  consistencia?: string;         // "Líquida" | "Blanda" | "Normal" | etc.
  descripcionDieta?: string;     // Descripción libre
  observaciones?: string;        // Observaciones adicionales
}
```

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "pacienteId": "PAC001",
  "cedula": "1234567890",
  "paciente": "PÉREZ GÓMEZ JUAN",
  "fechaOperativa": "2026-01-26",
  "comida": "Almuerzo",
  "estado": "Solicitada",
  "tipoDietaId": 1,
  "tipoDieta": {
	"id": 1,
	"codigo": "DN001",
	"nombre": "Dieta Normal"
  },
  "consistencia": "Blanda",
  "descripcionDieta": "Dieta normal sin azúcar",
  "observaciones": "Paciente con diabetes tipo 2",
  "solicitadoPor": "TestUser",
  "solicitadoEn": "2026-01-26T14:30:00Z"
}
```

**Errores:**
- `404`: Fila de dieta no encontrada
- `400`: Datos inválidos

**Uso típico:**
- Formulario de solicitud de dieta
- Validar tipo de dieta contra catálogo
- Mostrar confirmación visual tras solicitar

---

### 5. Confirmar Dieta Individual

**Confirmar una dieta solicitada (cambia estado a Confirmada)**

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/confirmar
Content-Type: application/json

{
  "tipoDietaId": 2,
  "consistencia": "Líquida",
  "observaciones": "Cambio a dieta líquida por indicación médica"
}
```

**Parámetros Path:**
- `filaDietaId`: GUID de la fila en estado `Solicitada`

**Body (JSON) - Opcional:**
```typescript
{
  tipoDietaId?: number;      // Cambiar tipo de dieta al confirmar
  consistencia?: string;     // Cambiar consistencia al confirmar
  observaciones?: string;    // Agregar observaciones finales
}
```

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "estado": "Confirmada",
  "modificadoPor": "TestUser",
  "modificadoEn": "2026-01-26T15:00:00Z"
}
```

**Errores:**
- `404`: Dieta no encontrada
- `400`: "La dieta debe estar en estado Solicitada para ser confirmada. Estado actual: Pendiente"

**Uso típico:**
- Pantalla de revisión/confirmación de dietas solicitadas
- Permitir ajustes menores antes de confirmar
- Bloqueo: solo dietas en estado `Solicitada` pueden confirmarse

---

### 6. Confirmar Múltiples Dietas

**Confirmar varias dietas de forma masiva**

```http
POST /api/v1/dietas-cocina/dietas/bulk/confirmar
Content-Type: application/json

{
  "dietasIds": [
	"550e8400-e29b-41d4-a716-446655440001",
	"550e8400-e29b-41d4-a716-446655440002",
	"550e8400-e29b-41d4-a716-446655440003"
  ],
  "usuario": "TestUser"
}
```

**Body (JSON):**
```typescript
{
  dietasIds: string[];    // Array de GUIDs de dietas
  usuario: string;        // Usuario que confirma
}
```

**Respuesta (200 OK):**
```json
{
  "confirmadas": 3,
  "total": 3,
  "message": "3 dietas confirmadas exitosamente"
}
```

**Respuesta parcial (algunas dietas no confirmadas):**
```json
{
  "confirmadas": 2,
  "total": 3,
  "message": "2 dietas confirmadas exitosamente de 3 intentadas"
}
```

**Uso típico:**
- Botón "Confirmar todas las dietas pendientes"
- Selección múltiple con checkbox y botón "Confirmar seleccionadas"
- Mostrar resumen de éxito/errores

---

### 7. Cancelar Dieta

**Cancelar una dieta solicitada o confirmada**

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/cancelar
Content-Type: application/json

{
  "motivo": "Paciente dado de alta"
}
```

**Parámetros Path:**
- `filaDietaId`: GUID de la fila en estado `Solicitada` o `Confirmada`

**Body (JSON):**
```typescript
{
  motivo: string;    // Motivo obligatorio de la cancelación
}
```

**Respuesta (200 OK):**
```json
{
  "message": "Dieta cancelada exitosamente",
  "dietaId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Errores:**
- `404`: Dieta no encontrada
- `400`: "La dieta debe estar en estado Solicitada o Confirmada para ser cancelada. Estado actual: Entregada"

**Uso típico:**
- Bot��n "Cancelar" con modal para ingresar motivo
- Validar ventana permitida de cancelación (antes de preparación, idealmente)
- Mostrar confirmación de cancelación

---

### 8. Consultar Dietas de un Paciente

**Obtener el historial de dietas de un paciente específico**

```http
GET /api/v1/dietas-cocina/paciente/{pacienteId}/dietas?fecha=2026-01-26
```

**Parámetros Path:**
- `pacienteId`: ID del paciente (ej: `PAC001`)

**Parámetros Query:**
- `fecha` (requerido): Formato `YYYY-MM-DD`

**Respuesta (200 OK):**
```json
[
  {
	"id": "550e8400-e29b-41d4-a716-446655440001",
	"fechaOperativa": "2026-01-26",
	"comida": "Desayuno",
	"estado": "Entregada",
	"tipoDieta": {
	  "codigo": "DN001",
	  "nombre": "Dieta Normal"
	},
	"consistencia": "Normal"
  },
  {
	"id": "550e8400-e29b-41d4-a716-446655440002",
	"fechaOperativa": "2026-01-26",
	"comida": "Almuerzo",
	"estado": "Confirmada",
	"tipoDieta": {
	  "codigo": "DB001",
	  "nombre": "Dieta Blanda"
	},
	"consistencia": "Blanda"
  }
]
```

**Uso típico:**
- Detalle/perfil del paciente
- Historial de dietas por día
- Seguimiento de consumo

---

### 9. Registrar Novedad en Dieta

**Registrar una novedad o cambio importante en una dieta**

```http
POST /api/v1/dietas-cocina/dietas/{filaDietaId}/novedad
Content-Type: application/json

{
  "tipoNovedad": "cambio_dieta",
  "descripcion": "Paciente rechaza dieta por consistencia",
  "observaciones": "Solicita cambio a consistencia líquida",
  "requiereAccion": true
}
```

**Parámetros Path:**
- `filaDietaId`: GUID de la fila de dieta

**Body (JSON):**
```typescript
{
  tipoNovedad: string;       // Tipo: "cambio_dieta", "alergia_descubierta", "rechazo_paciente", etc.
  descripcion: string;       // Descripción detallada
  observaciones?: string;    // Observaciones adicionales
  requiereAccion: boolean;   // Si requiere acción inmediata
}
```

**Respuesta (200 OK):**
Retorna la dieta actualizada con las observaciones registradas.

**Errores:**
- `404`: Dieta no encontrada

**Uso típico:**
- Registrar cambios importantes durante la preparación/entrega
- Auditoría y seguimiento de novedades
- Alertas para el equipo de nutrición

---

### 10. Obtener Detalle de Dieta

**Consultar el detalle completo de una dieta específica**

```http
GET /api/v1/dietas-cocina/dietas/{filaDietaId}
```

**Parámetros Path:**
- `filaDietaId`: GUID de la fila de dieta

**Respuesta (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "pacienteId": "PAC001",
  "cedula": "1234567890",
  "paciente": "PÉREZ GÓMEZ JUAN",
  "edad": 45,
  "servicio": "Medicina Interna",
  "pabellon": "A",
  "habitacion": "201",
  "fechaOperativa": "2026-01-26",
  "comida": "Almuerzo",
  "estado": "Confirmada",
  "tipoDietaId": 1,
  "consistencia": "Blanda",
  "descripcionDieta": "Dieta normal sin azúcar",
  "observaciones": "Paciente con diabetes tipo 2",
  "solicitadoPor": "NutricionistaX",
  "solicitadoEn": "2026-01-26T14:30:00Z"
}
```

**Errores:**
- `404`: Dieta no encontrada

**Uso típico:**
- Vista de detalle de una dieta
- Modal de información completa
- Edición de dieta existente

---

### 11. Obtener Historial de Trazabilidad

**Consultar el historial de eventos de una dieta específica**

```http
GET /api/v1/dietas-cocina/dietas/{filaDietaId}/historial
```

**Parámetros Path:**
- `filaDietaId`: GUID de la fila de dieta

**Respuesta (200 OK):**
```json
[
  {
    "id": "event-001",
    "tipoEvento": "solicitud_creada",
    "descripcion": "Dieta solicitada por nutrición",
    "estadoAnterior": "Pendiente",
    "estadoNuevo": "Solicitada",
    "usuario": "NutricionistaX",
    "fechaEvento": "2026-01-26T14:30:00Z",
    "datosAdicionales": null
  },
  {
    "id": "event-002",
    "tipoEvento": "dieta_confirmada",
    "descripcion": "Dieta confirmada y enviada a cocina",
    "estadoAnterior": "Solicitada",
    "estadoNuevo": "Confirmada",
    "usuario": "CoordinadoraCocina",
    "fechaEvento": "2026-01-26T15:00:00Z",
    "datosAdicionales": null
  },
  {
    "id": "event-003",
    "tipoEvento": "novedad_registrada",
    "descripcion": "Paciente rechaza dieta por consistencia",
    "estadoAnterior": "Confirmada",
    "estadoNuevo": "Confirmada",
    "usuario": "AuxiliarEnfermeria",
    "fechaEvento": "2026-01-26T16:30:00Z",
    "datosAdicionales": "Solicita cambio a consistencia líquida"
  }
]
```

**Errores:**
- `404`: Dieta no encontrada

**Uso típico:**
- Vista de auditoría y trazabilidad
- Timeline de eventos de la dieta
- Seguimiento detallado de cambios de estado

---

### 12. Buscar Dietas con Filtros Avanzados

**Búsqueda avanzada de dietas con múltiples criterios**

```http
POST /api/v1/dietas-cocina/dietas/buscar
Content-Type: application/json

{
  "fecha": "2026-01-26",
  "comida": "Almuerzo",
  "servicio": "Medicina Interna",
  "pabellon": "A",
  "estado": "Confirmada",
  "busqueda": "PÉREZ",
  "soloPendientes": false,
  "soloConNovedades": false
}
```

**Body (JSON):**
```typescript
{
  fecha?: Date;              // Fecha operativa
  comida?: string;           // Tiempo de comida
  servicio?: string;         // Servicio hospitalario
  pabellon?: string;         // Pabellón
  estado?: string;           // Estado de la dieta
  busqueda?: string;         // Búsqueda por nombre o cédula
  soloPendientes?: boolean;  // Filtrar solo pendientes de confirmar
  soloConNovedades?: boolean;// Filtrar solo con novedades registradas
}
```

**Respuesta (200 OK):**
```json
{
  "fechaOperativa": "2026-01-26",
  "comida": "Almuerzo",
  "totalPacientes": 15,
  "dietasSolicitadas": 3,
  "dietasPendientes": 2,
  "dietasConfirmadas": 10,
  "filas": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "paciente": "PÉREZ GÓMEZ JUAN",
      "servicio": "Medicina Interna",
      "estado": "Confirmada",
      ...
    }
  ]
}
```

**Uso típico:**
- Búsqueda avanzada en la interfaz del censo
- Filtrado dinámico por múltiples criterios
- Reportes personalizados
- Identificación rápida de casos especiales (novedades, pendientes)

---

## 🍳 Órdenes de Cocina

### 13. Obtener Órdenes de Cocina

**Lista todas las órdenes de cocina con filtros opcionales**

```http
GET /api/v1/ordenes-cocina?fecha=2026-01-26&comida=Almuerzo&estado=Pendiente
```

**Parámetros Query (todos opcionales):**
- `fecha`: Fecha operativa (formato `YYYY-MM-DD`)
- `comida`: Tiempo de comida (`Desayuno`, `Almuerzo`, `Cena`, `Merienda`)
- `estado`: Estado de la orden (`Pendiente`, `EnPreparacion`, `Completada`, `Cancelada`)

**Respuesta (200 OK):**
```json
[
  {
    "id": "orden-001",
    "numeroOrden": 1,
    "comida": "Almuerzo",
    "fechaOperativa": "2026-01-26",
    "totalDietas": 35,
    "estado": "EnPreparacion",
    "generadoPor": "CoordinadoraCocina",
    "generadoEn": "2026-01-26T10:00:00Z",
    "observaciones": null
  },
  {
    "id": "orden-002",
    "numeroOrden": 2,
    "comida": "Cena",
    "fechaOperativa": "2026-01-26",
    "totalDietas": 28,
    "estado": "Pendiente",
    "generadoPor": "CoordinadoraCocina",
    "generadoEn": "2026-01-26T14:30:00Z",
    "observaciones": null
  }
]
```

**Uso típico:**
- Panel de control de órdenes activas en cocina
- Monitoreo del estado de preparación
- Listado histórico de órdenes del día

---

### 14. Obtener Detalle de Orden

**Consulta el detalle completo de una orden con todas sus dietas**

```http
GET /api/v1/ordenes-cocina/{ordenId}
```

**Parámetros Path:**
- `ordenId`: GUID de la orden

**Respuesta (200 OK):**
```json
{
  "id": "orden-001",
  "numeroOrden": 1,
  "comida": "Almuerzo",
  "fechaOperativa": "2026-01-26",
  "totalDietas": 35,
  "estado": "EnPreparacion",
  "generadoPor": "CoordinadoraCocina",
  "generadoEn": "2026-01-26T10:00:00Z",
  "observaciones": null,
  "dietas": [
    {
      "id": "dieta-001",
      "paciente": "PÉREZ GÓMEZ JUAN",
      "pabellon": "A",
      "habitacion": "201",
      "tipoDieta": "Dieta Normal",
      "consistencia": "Blanda",
      "estado": "EnPreparacion",
      ...
    },
    ...
  ]
}
```

**Errores:**
- `404`: Orden no encontrada

**Uso típico:**
- Vista detallada de una orden específica
- Impresión de hoja de producción para cocina
- Verificación de dietas incluidas

---

### 15. Crear Orden de Cocina

**Crea una nueva orden de cocina a partir de dietas confirmadas**

```http
POST /api/v1/ordenes-cocina
Content-Type: application/json

{
  "fechaOperativa": "2026-01-26",
  "comida": "Almuerzo",
  "dietasIds": [
    "550e8400-e29b-41d4-a716-446655440001",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440003"
  ],
  "observaciones": "Orden prioritaria - pacientes críticos"
}
```

**Body (JSON):**
```typescript
{
  fechaOperativa: Date;      // Fecha operativa de la orden
  comida: string;            // Tiempo de comida
  dietasIds: string[];       // Array de IDs de dietas confirmadas
  observaciones?: string;    // Observaciones opcionales
}
```

**Respuesta (201 Created):**
Retorna la orden creada con estado `Pendiente` y todas las dietas actualizadas a estado `EnPreparacion`.

**Errores:**
- `400`: "Algunas dietas no fueron encontradas"
- `400`: "X dietas no están confirmadas"

**Validaciones:**
- Todas las dietas deben existir
- Todas las dietas deben estar en estado `Confirmada`
- Se asigna automáticamente el siguiente número de orden del día

**Efectos secundarios:**
- Las dietas pasan de `Confirmada` → `EnPreparacion`
- Se establece la relación `OrdenCocinaId` en cada dieta
- Se registran eventos de trazabilidad en cada dieta

**Uso típico:**
- Botón "Generar Orden de Cocina" después de confirmar dietas
- Agrupa dietas por comida para facilitar preparación
- Inicia el ciclo de producción en cocina

---

### 16. Actualizar Estado de Orden

**Cambia el estado de una orden de cocina**

```http
PATCH /api/v1/ordenes-cocina/{ordenId}/estado
Content-Type: application/json

{
  "estado": "Completada",
  "observaciones": "Todas las dietas preparadas correctamente"
}
```

**Parámetros Path:**
- `ordenId`: GUID de la orden

**Body (JSON):**
```typescript
{
  estado: string;           // Nuevo estado: "Pendiente", "EnPreparacion", "Completada"
  observaciones?: string;   // Observaciones del cambio
}
```

**Respuesta (200 OK):**
Retorna la orden actualizada.

**Estados válidos:**
- `Pendiente`: Orden creada, pendiente de iniciar preparación
- `EnPreparacion`: Cocina está preparando las dietas
- `Completada`: Todas las dietas preparadas y listas para envío

**Efectos secundarios al marcar como "Completada":**
- Todas las dietas de la orden pasan a `ListaEnvio`
- Se registran eventos de trazabilidad en cada dieta

**Errores:**
- `404`: Orden no encontrada

**Uso típico:**
- Actualización del progreso de preparación
- "Iniciar Preparación" → cambia a `EnPreparacion`
- "Marcar como Completada" → cambia a `Completada` y mueve dietas a `ListaEnvio`

---

### 17. Cancelar Orden de Cocina

**Cancela una orden de cocina y revierte las dietas**

```http
POST /api/v1/ordenes-cocina/{ordenId}/cancelar
Content-Type: application/json

"Error en el censo - se debe regenerar la orden"
```

**Parámetros Path:**
- `ordenId`: GUID de la orden

**Body:**
String simple con el motivo de cancelación.

**Respuesta (200 OK):**
```json
{
  "message": "Orden cancelada exitosamente",
  "ordenId": "orden-001"
}
```

**Efectos secundarios:**
- Orden cambia a estado `Cancelada`
- Todas las dietas regresan de `EnPreparacion` → `Confirmada`
- Se limpia la relación `OrdenCocinaId` de cada dieta
- Se registran eventos de trazabilidad

**Errores:**
- `404`: Orden no encontrada
- `400`: "No se puede cancelar una orden completada"

**Uso típico:**
- Corrección de errores antes de iniciar preparación
- Cambios en el censo que requieren regenerar la orden
- Solo debe permitirse si la orden no está `Completada`

---

## 🔄 Flujo de Trabajo: Dietas y Cocina

### Diagrama de Estados

```
┌──────────┐     Solicitar     ┌────────────┐    Confirmar    ┌────────────┐
│Pendiente │ ──────────────────▶│ Solicitada │ ───────────────▶│ Confirmada │
└──────────┘                    └────────────┘                 └────────────┘
	 │                                │                               │
	 │                                │ Cancelar                       │
	 │                                └──────────┐                    │
	 │                                           ▼                    │
	 │                                      ┌──────────┐              │
	 └──────────────────────────────────────│Cancelada │◀─────────────┘
											└──────────┘
```

### Flujo Típico del Frontend

**1. Inicio del Día - Nutricionista**

```javascript
// 1. Cargar catálogo (una vez al iniciar sesión)
const catalogoDietas = await fetch('http://186.190.254.230:8080/api/v1/dietas-cocina/catalogo')
  .then(res => res.json());

// 2. Cargar censo del día
const censo = await fetch('http://186.190.254.230:8080/api/v1/dietas-cocina/censo?fecha=2026-01-26&comida=Almuerzo')
  .then(res => res.json());

// Mostrar tabla con censo.filasDietas
// Filtrar por: estado === 'Pendiente'
```

**2. Solicitar Dieta para un Paciente**

```javascript
// Usuario selecciona paciente del censo y llena formulario
const dietaId = '550e8400-e29b-41d4-a716-446655440001';

const solicitudDieta = {
  tipoDietaId: 1, // Dieta Normal
  consistencia: 'Normal',
  descripcionDieta: 'Sin restricciones',
  observaciones: ''
};

const response = await fetch(
  `http://186.190.254.230:8080/api/v1/dietas-cocina/dietas/${dietaId}/solicitar`,
  {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(solicitudDieta)
  }
);

const dietaSolicitada = await response.json();
// Actualizar UI: cambiar estado visual a 'Solicitada'
```

**3. Revisar y Confirmar Dietas Solicitadas**

```javascript
// Filtrar censo por: estado === 'Solicitada'
const dietasSolicitadas = censo.filasDietas.filter(d => d.estado === 'Solicitada');

// Usuario revisa cada dieta y confirma
for (const dieta of dietasSolicitadas) {
  await fetch(
	`http://186.190.254.230:8080/api/v1/dietas-cocina/dietas/${dieta.id}/confirmar`,
	{
	  method: 'POST',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({}) // Body vacío si no hay cambios
	}
  );
}

// Mostrar notificación: "X dietas confirmadas"
```

**4. Confirmar Múltiples Dietas (Opción Rápida)**

```javascript
// Usuario selecciona múltiples dietas con checkbox
const dietasSeleccionadas = ['guid1', 'guid2', 'guid3'];

const response = await fetch(
  'http://186.190.254.230:8080/api/v1/dietas-cocina/dietas/bulk/confirmar',
  {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
	  dietasIds: dietasSeleccionadas,
	  usuario: 'TestUser' // Reemplazar con usuario autenticado
	})
  }
);

const resultado = await response.json();
// Mostrar: "2 de 3 dietas confirmadas exitosamente"
```

**5. Cancelar Dieta**

```javascript
const dietaId = '550e8400-e29b-41d4-a716-446655440001';

const response = await fetch(
  `http://186.190.254.230:8080/api/v1/dietas-cocina/dietas/${dietaId}/cancelar`,
  {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
	  motivo: 'Paciente dado de alta'
	})
  }
);

if (response.ok) {
  // Actualizar UI: marcar dieta como cancelada
}
```

---

## 📊 Modelos de Datos

### FilaDietaDto (Fila de Dieta)

```typescript
interface FilaDietaDto {
  id: string;                    // GUID
  pacienteId: string;            // Identificador único del paciente
  cedula: string;                // Cédula del paciente
  tipoDocumento: string;         // CC, CE, PA, etc.
  idIngreso: string;             // ID del ingreso hospitalario
  paciente: string;              // Nombre completo del paciente
  edad: number;                  // Edad del paciente
  servicio: string;              // Ej: "Medicina Interna"
  pabellon: string;              // Ej: "A", "B", "C"
  habitacion: string;            // Número de habitación/cama
  fechaOperativa: string;        // Fecha ISO "2026-01-26"
  comida: string;                // "Desayuno" | "Almuerzo" | "Cena" | "Refrigerio"
  estado: string;                // Ver estados en sección anterior
  tipoDietaId?: number;          // ID del tipo de dieta (null si no asignada)
  tipoDieta?: DietaCatalogoDto;  // Objeto del catálogo (null si no asignada)
  consistencia?: string;         // "Líquida" | "Blanda" | "Normal" | etc.
  descripcionDieta?: string;     // Descripción libre
  observaciones?: string;        // Observaciones adicionales
  solicitadoPor?: string;        // Usuario que solicitó
  solicitadoEn?: string;         // Timestamp ISO
  modificadoPor?: string;        // Usuario última modificación
  modificadoEn?: string;         // Timestamp ISO
}
```

### DietaCatalogoDto (Tipo de Dieta)

```typescript
interface DietaCatalogoDto {
  id: number;
  codigo: string;           // Ej: "DN001"
  nombre: string;           // Ej: "Dieta Normal"
  tipo: string;             // "Normal" | "Terapéutica" | "Especial"
  descripcion?: string;     // Descripción del tipo de dieta
  activo: boolean;          // Si está habilitada
  tarifaActual?: number;    // Tarifa vigente en COP
}
```

### CensoDietasDto (Censo Completo)

```typescript
interface CensoDietasDto {
  fecha: string;               // "2026-01-26"
  comida: string;              // "Desayuno" | "Almuerzo" | "Cena" | "Refrigerio"
  total: number;               // Total de filas
  filasDietas: FilaDietaDto[]; // Array de dietas
}
```

### SolicitudDietaDto (Request Body)

```typescript
interface SolicitudDietaDto {
  tipoDietaId?: number;
  consistencia?: string;
  descripcionDieta?: string;
  observaciones?: string;
}
```

### ConfirmacionMasivaDto (Request Body)

```typescript
interface ConfirmacionMasivaDto {
  dietasIds: string[];   // Array de GUIDs
  usuario: string;       // Usuario que confirma
}
```

### CancelacionDietaDto (Request Body)

```typescript
interface CancelacionDietaDto {
  motivo: string;  // Motivo obligatorio
}
```

---

## 💻 Ejemplos de Integración

### React + Axios

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://186.190.254.230:8080/api/v1';

// Cliente Axios configurado
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
	'Content-Type': 'application/json',
  }
});

// Agregar interceptor para JWT (cuando esté disponible)
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
	config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ejemplo: Obtener censo
export const obtenerCenso = async (fecha, comida) => {
  try {
	const response = await apiClient.get('/dietas-cocina/censo', {
	  params: { fecha, comida }
	});
	return response.data;
  } catch (error) {
	console.error('Error al obtener censo:', error.response?.data);
	throw error;
  }
};

// Ejemplo: Solicitar dieta
export const solicitarDieta = async (dietaId, solicitud) => {
  try {
	const response = await apiClient.post(
	  `/dietas-cocina/dietas/${dietaId}/solicitar`,
	  solicitud
	);
	return response.data;
  } catch (error) {
	console.error('Error al solicitar dieta:', error.response?.data);
	throw error;
  }
};

// Ejemplo: Confirmar dieta individual
export const confirmarDieta = async (dietaId, ajustes = {}) => {
  try {
	const response = await apiClient.post(
	  `/dietas-cocina/dietas/${dietaId}/confirmar`,
	  ajustes
	);
	return response.data;
  } catch (error) {
	console.error('Error al confirmar dieta:', error.response?.data);
	throw error;
  }
};
```

### Angular + HttpClient

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DietasService {
  private apiBaseUrl = 'http://186.190.254.230:8080/api/v1/dietas-cocina';

  constructor(private http: HttpClient) {}

  obtenerCenso(fecha: string, comida: string): Observable<CensoDietasDto> {
	const params = new HttpParams()
	  .set('fecha', fecha)
	  .set('comida', comida);

	return this.http.get<CensoDietasDto>(`${this.apiBaseUrl}/censo`, { params });
  }

  solicitarDieta(dietaId: string, solicitud: SolicitudDietaDto): Observable<FilaDietaDto> {
	return this.http.post<FilaDietaDto>(
	  `${this.apiBaseUrl}/dietas/${dietaId}/solicitar`,
	  solicitud
	);
  }

  confirmarDieta(dietaId: string, ajustes?: SolicitudDietaDto): Observable<FilaDietaDto> {
	return this.http.post<FilaDietaDto>(
	  `${this.apiBaseUrl}/dietas/${dietaId}/confirmar`,
	  ajustes || {}
	);
  }

  confirmarDietasMasivas(dietasIds: string[], usuario: string): Observable<any> {
	return this.http.post(`${this.apiBaseUrl}/dietas/bulk/confirmar`, {
	  dietasIds,
	  usuario
	});
  }

  cancelarDieta(dietaId: string, motivo: string): Observable<any> {
	return this.http.post(`${this.apiBaseUrl}/dietas/${dietaId}/cancelar`, {
	  motivo
	});
  }
}
```

### Vanilla JavaScript (Fetch)

```javascript
const API_BASE = 'http://186.190.254.230:8080/api/v1';

async function obtenerCatalogoDietas() {
  const response = await fetch(`${API_BASE}/dietas-cocina/catalogo`);
  if (!response.ok) throw new Error('Error al obtener catálogo');
  return await response.json();
}

async function obtenerCenso(fecha, comida) {
  const url = `${API_BASE}/dietas-cocina/censo?fecha=${fecha}&comida=${comida}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al obtener censo');
  return await response.json();
}

async function solicitarDieta(dietaId, solicitud) {
  const response = await fetch(`${API_BASE}/dietas-cocina/dietas/${dietaId}/solicitar`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(solicitud)
  });

  if (!response.ok) {
	const error = await response.json();
	throw new Error(error.message || 'Error al solicitar dieta');
  }

  return await response.json();
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Acción Recomendada |
|--------|-------------|-------------------|
| `200` | OK | Procesar respuesta exitosa |
| `400` | Bad Request | Validar datos enviados, mostrar mensaje de error |
| `401` | Unauthorized | Redirigir a login (cuando JWT esté activo) |
| `403` | Forbidden | Usuario sin permisos, mostrar mensaje |
| `404` | Not Found | Recurso no encontrado, actualizar UI |
| `500` | Internal Server Error | Error del servidor, reintentar o contactar soporte |

### Ejemplo de Manejo de Errores

```javascript
async function solicitarDietaConManejo(dietaId, solicitud) {
  try {
	const response = await fetch(
	  `http://186.190.254.230:8080/api/v1/dietas-cocina/dietas/${dietaId}/solicitar`,
	  {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(solicitud)
	  }
	);

	if (response.status === 404) {
	  alert('La dieta especificada no existe. Recargue el censo.');
	  return null;
	}

	if (response.status === 400) {
	  const error = await response.json();
	  alert(`Error de validación: ${error.message}`);
	  return null;
	}

	if (!response.ok) {
	  throw new Error('Error del servidor. Intente nuevamente.');
	}

	const dieta = await response.json();
	console.log('Dieta solicitada exitosamente:', dieta);
	return dieta;

  } catch (error) {
	console.error('Error de red:', error);
	alert('No se pudo conectar con el servidor. Verifique su conexión.');
	return null;
  }
}
```

### Validaciones Importantes en Frontend

**Antes de Solicitar Dieta:**
- ✅ Verificar que el `tipoDietaId` exista en el catálogo
- ✅ `consistencia` no debe estar vacía
- ✅ Validar que la fila esté en estado `Pendiente`

**Antes de Confirmar Dieta:**
- ✅ Verificar que la dieta esté en estado `Solicitada`
- ✅ Consistencia debe estar definida

**Antes de Cancelar Dieta:**
- ✅ Verificar que esté en estado `Solicitada` o `Confirmada`
- ✅ Motivo de cancelación es obligatorio (mínimo 10 caracteres recomendado)

---

## ⚡ Consideraciones de Rendimiento

### Caché de Datos

**Catálogo de Dietas:**
- ✅ Cachear en memoria del frontend (cambia muy poco)
- ✅ Recargar solo al iniciar sesión o 1 vez al día

**Censo:**
- ⚠️ No cachear, refrescar cada 2-5 minutos
- ⚠️ Puede cambiar si se agregan/modifican pacientes

### Peticiones Concurrentes

**Evitar:**
```javascript
// ❌ Solicitar dietas una por una (lento)
for (const dieta of dietas) {
  await solicitarDieta(dieta.id, datos);
}
```

**Recomendado:**
```javascript
// ✅ Solicitar en paralelo con Promise.all
const promesas = dietas.map(dieta => solicitarDieta(dieta.id, datos));
const resultados = await Promise.all(promesas);
```

### Optimización de UI

- Mostrar **spinners** durante llamadas largas (censo, confirmación masiva)
- Implementar **paginación** si el censo supera 50 filas
- Usar **refrescos parciales** en lugar de recargar toda la tabla
- **Debouncing** en búsquedas por nombre de paciente (si aplica)

### Timeout de Peticiones

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

try {
  const response = await fetch(url, {
	signal: controller.signal
  });
  clearTimeout(timeoutId);
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
	alert('La petición tardó demasiado. Intente nuevamente.');
  }
  throw error;
}
```

---

## 📞 Soporte y Contacto

**Documentación Adicional:**
- Swagger UI: `http://186.190.254.230:8080/swagger`
- Health Check: `http://186.190.254.230:8080/health`

**Archivo de Changelog:**
Ver `docs/CHANGELOG.md` para historial de cambios del API.

**Equipo de Desarrollo:**
- Backend API: Equipo Backend Bital
- Consultas Técnicas: Revisar documentación en `/docs`

---

## 🚀 Próximas Funcionalidades

### En Desarrollo
- 🔒 Autenticación JWT con roles (Nutricionista, Cocina, Auxiliar)
- 📱 Websockets para actualizaciones en tiempo real
- 📊 Endpoints de reportes y estadísticas
- 🔔 Sistema de notificaciones

### Roadmap Q1 2026
- Módulo de Cocina (preparación y despacho)
- App móvil para entrega (auxiliares de enfermería)
- Dashboard de métricas de consumo
- Integración con facturación

---

**Última actualización:** 2026-01-26  
**Versión del documento:** 1.0  
**API Version:** v1
