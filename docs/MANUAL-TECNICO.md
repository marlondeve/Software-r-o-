# Manual técnico — RioSoft

**Cliente:** Clínica del Río (Montería, Colombia)  
**Versión del documento:** 1.2 — RioSoft **1.2.7** — 2026-08-26  
**Alcance:** Componentes **operativos en producción** — módulo **Dietas y Cocina**, autenticación, API, base de datos, despliegue IIS.

> **Fuera de alcance:** Módulo Encuestas SIAO (backend preparado, UI deshabilitada), Administración de plataforma (scaffold).

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Instalación y entornos](#4-instalación-y-entornos)
5. [Autenticación y autorización](#5-autenticación-y-autorización)
6. [Base de datos](#6-base-de-datos)
7. [Módulo Dietas y Cocina](#7-módulo-dietas-y-cocina)
8. [Flujos operativos](#8-flujos-operativos)
9. [Referencia de API](#9-referencia-de-api)
10. [Frontend](#10-frontend)
11. [Despliegue en producción](#11-despliegue-en-producción)
12. [Seguridad](#12-seguridad)
13. [Operación y mantenimiento](#13-operación-y-mantenimiento)
14. [Anexos](#14-anexos)

---

## 1. Visión general

**RioSoft** es una plataforma web para la gestión operativa de **dietas hospitalarias**, **producción en cocina**, **logística de bandejas/etiquetas**, **conciliación** y **administración de usuarios** del servicio de alimentación clínica.

### 1.1 Componentes operativos

| Componente | Tecnología | Estado |
|---|---|---|
| Frontend SPA | React 19 + Vite 8 + TypeScript | Operativo |
| API de negocio | .NET 8 — `Bital.ApiNegocio` | Operativo |
| Base operativa | SQL Server — `BitalNegocio` | Operativo |
| Integración HIS | SQL Server — `Hosvital` (read-only) | Operativo |
| Autenticación | JWT en cookie de sesión segura (HTTPS) | Operativo |

### 1.2 URL de producción

| Recurso | URL |
|---|---|
| Aplicación | `https://riosoft.clinicadelriomonteria.com:8080` |
| Health check | `https://riosoft.clinicadelriomonteria.com:8080/health` |
| API (vía proxy mismo origen) | `https://riosoft.clinicadelriomonteria.com:8080/api/v1/` |

El API **no** está expuesto públicamente; IIS hace proxy interno a `http://127.0.0.1:8081`.

### 1.3 Convenciones de nomenclatura

| Contexto | Nombre |
|---|---|
| Producto / marca | **RioSoft** |
| Proyectos .NET, BD, cookies | Prefijo técnico **`Bital`** (herencia del desarrollo) |
| Repositorio monorepo | `Software-r-o-/` |

---

## 2. Arquitectura del sistema

### 2.1 Diagrama lógico

```text
┌─────────────────────────────────────────────────────────────┐
│  Navegador (HTTPS :8080)                                    │
│  React SPA — RioSoft                                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ /api/v1/*, /health
                            │ Cookie: bital_access_token
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  IIS — Sitio BitalFrontend                                  │
│  • Archivos estáticos (dist/)                               │
│  • URL Rewrite: proxy → 127.0.0.1:8081                      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP localhost
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  IIS — Sitio BitalApiNegocio (Kestrel in-process)           │
│  Bital.ApiNegocio                                           │
│  • Controllers / Services / EF Core                         │
└───────────────┬─────────────────────────┬───────────────────┘
                │ R/W                     │ Read-only
                ▼                         ▼
     ┌──────────────────┐      ┌──────────────────────┐
     │  BitalNegocio    │      │      Hosvital        │
     │  (10.238.97.66)  │      │  (10.238.97.69)      │
     │  Esquemas:       │      │  Tablas Vital:       │
     │  dietas.*, bital.*│     │  INGRESOS, CAPBAS…   │
     └──────────────────┘      └──────────────────────┘
```

### 2.2 Capas backend (Clean Architecture)

```text
Bital.ApiNegocio      → Controllers, Program.cs, middleware
Bital.Application     → DTOs, interfaces de servicios
Bital.Domain          → Entidades, enums, reglas
Bital.Infrastructure  → EF Core, servicios, acceso Vital (ADO.NET)
Bital.Shared          → Contratos compartidos
```

### 2.3 Desarrollo local

```text
Frontend (Vite)  :5173
      │ proxy /api, /health
      ▼
Bital.ApiNegocio :8080
      ▼
BitalNegocio + Hosvital_Pruebas (SQL local o remoto)
```

---

## 3. Stack tecnológico

### 3.1 Frontend

| Tecnología | Versión / notas |
|---|---|
| React | 19 |
| Vite | 8 |
| TypeScript | 6 |
| Tailwind CSS | v4 |
| shadcn/ui + Radix | Componentes UI |
| React Router | 7 |
| Axios | Cliente HTTP (`withCredentials: true`) |
| React Hook Form + Zod | Formularios |
| TanStack Table | Tablas |
| Recharts | Gráficos dashboards |
| vite-plugin-pwa | PWA / instalable |

### 3.2 Backend

| Tecnología | Versión / notas |
|---|---|
| .NET | 8.0.423 (`global.json`) |
| ASP.NET Core Web API | Controllers + versioning |
| Entity Framework Core | 8 — `BitalNegocioDbContext` |
| Serilog | Logging a archivo |
| Swagger / OpenAPI | Documentación API (dev / diagnóstico) |
| JWT Bearer | Validación desde cookie |
| PBKDF2 | Hash de contraseñas |

### 3.3 Infraestructura

| Componente | Detalle |
|---|---|
| Servidor aplicaciones | Windows Server + IIS |
| .NET Hosting Bundle | 8.x obligatorio |
| URL Rewrite + ARR | Proxy frontend → API |
| SQL Server | 2019+ |

---

## 4. Instalación y entornos

### 4.1 Prerrequisitos desarrollo

| Herramienta | Versión |
|---|---|
| Node.js | ≥ 24.18 (`.nvmrc`) |
| pnpm | ≥ 11.15.1 |
| .NET SDK | 8.0.423 |
| SQL Server | 2019+ con `BitalNegocio` y acceso a Vital |

### 4.2 Puesta en marcha local

```bash
# Raíz del monorepo
corepack enable
pnpm install

# Terminal 1 — Frontend
pnpm dev

# Terminal 2 — Backend
dotnet run --project backend/Bital.ApiNegocio
```

Migración inicial de base de datos:

```powershell
cd backend\scripts
.\Migrate-BitalNegocio.ps1
```

Guía detallada: [MIGRACION_SQL_SERVER.md](./MIGRACION_SQL_SERVER.md)

### 4.3 Variables de entorno frontend

Archivo: `frontend/.env.local` (copiar desde `.env.example`)

| Variable | Valor recomendado (dev) | Descripción |
|---|---|---|
| `VITE_BITAL_API_BASE_URL` | `/api/v1` | Base URL API (relativa; proxy Vite) |
| `VITE_BITAL_API_HEALTH_URL` | `/health` | Health check |
| `VITE_DEV_API_PROXY_TARGET` | `http://localhost:8080` | Target del proxy en desarrollo |
| `VITE_DIETAS_COCINA_API` | `true` | **Obligatorio** para modo operativo HTTP |
| `VITE_ENCUESTAS_ENABLED` | `false` | Módulo encuestas oculto |
| `VITE_APP_VERSION` | `1.2.7` | Versión mostrada en UI |

### 4.4 Configuración backend (desarrollo)

Archivo: `backend/Bital.ApiNegocio/appsettings.Development.json`

| Clave | Descripción |
|---|---|
| `ConnectionStrings:BitalDatabase` | SQL Server `BitalNegocio` |
| `ConnectionStrings:VitalDatabase` | SQL Server `Hosvital_Pruebas` |
| `Jwt:Key` | Clave firma JWT (≥ 32 caracteres) |
| `Jwt:CookieName` | `bital_access_token` |
| `Cors:AllowedOrigins` | `http://localhost:5173`, etc. |

### 4.5 Usuarios seed (post-migración)

Contraseña inicial = valor de **`Identificacion`** (login). Se re-hashea a PBKDF2 en el primer acceso.

| Login | Rol |
|---|---|
| `admin` | Administrador |
| `nutricionista` | Nutricionista |
| `cocinero` | Proveedor |
| `enfermera` | Enfermera |

---

## 5. Autenticación y autorización

### 5.1 Modelo de sesión

1. El usuario envía `POST /api/v1/auth/login` con `{ usuario, password }`.
2. El API valida credenciales contra `bital.UsuariosModulo`.
3. Emite JWT en cookie **`bital_access_token`**:
   - Producción: `Secure` + `HttpOnly` + `SameSite=Strict`
   - Desarrollo: `SameSite=Lax`; `Secure` si HTTPS
4. El frontend guarda **solo el perfil** en `sessionStorage` (`bital:session`); **no accede al JWT**.
5. Axios envía la cookie en cada request (`withCredentials: true`).
6. `GET /api/v1/auth/me` rehidrata la sesión al recargar.
7. `POST /api/v1/auth/logout` elimina la cookie.

Implementación: `AuthController.cs`, `AuthCookieExtensions.cs`, `authModulo.service.ts`, `authService.ts`.

### 5.2 Endpoints de autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Anónimo | Inicio de sesión (rate limit 10/min/IP) |
| GET | `/api/v1/auth/me` | Cookie | Sesión actual |
| POST | `/api/v1/auth/logout` | Cookie | Cierre de sesión |
| POST | `/api/v1/auth/cambiar-password` | Anónimo | Cambio de contraseña |

### 5.3 Claims JWT

| Claim | Contenido |
|---|---|
| `NameIdentifier` | GUID usuario |
| `usuario` | Identificación (login) |
| `Email` | Correo |
| `Name` | Nombre completo |
| `rol_modulo_id` | GUID del rol |
| `rol_nombre` | Nombre del rol |
| `debe_cambiar_password` | `"true"` si aplica |

### 5.4 Roles del sistema

| Rol | GUID |
|---|---|
| Administrador | `11111111-1111-1111-1111-111111000001` |
| Nutricionista | `11111111-1111-1111-1111-111111000002` |
| Proveedor | `11111111-1111-1111-1111-111111000003` |
| Enfermera | `11111111-1111-1111-1111-111111000004` |
| Doctor | `11111111-1111-1111-1111-111111000005` |
| Auxiliar de Cocina | `11111111-1111-1111-1111-111111000006` |

Referencia: `RolModuloSeed.cs`. Los roles personalizados se crean desde la UI de usuarios.

### 5.5 Permisos granulares (API)

Código numérico en `RutaDietas` (`backend/Bital.Domain/Enums/RutaDietas.cs`):

| Rango | Área | Códigos |
|---|---|---|
| 1–4 | Dietas (censo/solicitud) | Listar, Crear, Editar, Eliminar |
| 5–8 | Catálogo y tarifas | Listar, Crear, Editar, Eliminar catálogo |
| 10–13 | Órdenes cocina | Listar, Crear, Modificar, Cancelar |
| 20–25 | Etiquetas / logística | Listar, Imprimir, Recepción, Entrega, Rechazo, Recogida |
| 30–32 | Conciliación | Listar, Aprobar, Rechazar |
| 40–41 | Dashboards / reportes | Ver dashboard, Exportar |
| 50–51 | Parámetros | Ver, Editar |
| 60 | Auditoría | Ver |
| 70–71 | Usuarios | Gestionar usuarios, Gestionar permisos |

Persistencia: `bital.PermisosRol` (`RolModuloId`, `Ruta`, `Permitido`).

### 5.6 Permisos por rol (seed default)

| Rol | Acceso operativo principal |
|---|---|
| **Administrador** | Acceso total |
| **Nutricionista** | Censo, catálogo, tarifas, conciliación, reportes clínicos, parámetros, auditoría |
| **Proveedor** | Cocina, impresión etiquetas, reportes producción (con costos), conciliación (consulta) |
| **Enfermera** | Censo (lectura), recepción proveedor |
| **Auxiliar Cocina** | Bandejas piso (entrega, devolución, recogida) |

La matriz completa se consulta en runtime: `GET /api/v1/dietas-cocina/roles/permisos`.

### 5.7 Guards de ruta (frontend)

| Guard | Función |
|---|---|
| `RequireAuth` | Sesión activa |
| `RequireModuleAccess` | Acceso al módulo `dietas-cocina` |
| `RequireDietasRuta` | Permiso sobre ruta UI según rol/matriz |
| `RequireCapacidadEtiqueta` | Capacidad logística (impresión, entrega, etc.) |
| `RutaDietasSectionGuard` | Secciones dentro de una pantalla |

---

## 6. Base de datos

### 6.1 Bases de datos

| Base | Servidor prod. | Rol |
|---|---|---|
| `BitalNegocio` | `10.238.97.66` | Datos operativos RioSoft (R/W) |
| `Hosvital_Pruebas` | `10.238.97.69` | HIS Vital (solo lectura) |

### 6.2 Esquema `dietas.*`

| Tabla | Propósito |
|---|---|
| `FilasDietas` | Censo operativo por paciente × comida × fecha |
| `EventosTrazabilidad` | Historial de cambios por fila |
| `OrdenesCocina` | Órdenes de producción (1:1 con dieta confirmada) |
| `DietasCatalogo` | Tipos de dieta |
| `TarifasHistorico` | Tarifas por dieta y tiempo de comida |
| `ParametrosOperativos` | Configuración global (modo carga, etc.) |

### 6.3 Esquema `bital.*`

| Tabla | Propósito |
|---|---|
| `RolesModulo` | Roles dinámicos |
| `PermisosRol` | Matriz rol → permiso |
| `UsuariosModulo` | Usuarios del módulo |
| `EtiquetasEnfermeria` | Etiquetas y estados logísticos |
| `FilasConciliacion` | Conciliación facturación |
| `EventosAuditoria` | Auditoría forense |
| `TiemposComida` | Ventanas horarias por comida |
| `CategoriasEdad` | Clasificación etaria / porciones |

### 6.4 Sincronización censo desde Vital

Al llamar `GET /dietas-cocina/censo`, el servicio:

1. Lee ingresos activos de Vital (`INGRESOS`, `CAPBAS`, `MAEPAB`).
2. Filtra pabellones 3–7, ingresos sin egreso.
3. Crea/actualiza filas en `dietas.FilasDietas` (estado inicial `Pendiente`).

Script manual de re-sync: `backend/scripts/02-MigrateData.sql`.

### 6.5 Migraciones EF

```powershell
cd backend
dotnet ef database update `
  --project Bital.Infrastructure `
  --startup-project Bital.ApiNegocio `
  --context BitalNegocioDbContext
```

Orquestador completo: `backend/scripts/Migrate-BitalNegocio.ps1`.

---

## 7. Módulo Dietas y Cocina

### 7.1 Mapa de pantallas

| Ruta UI | Funcionalidad |
|---|---|
| `/dietas-cocina/inicio` | Dashboard según rol (nutricionista / proveedor / enfermera) |
| `/dietas-cocina/dietas` | Censo, solicitud, confirmación, novedades, cancelación |
| `/dietas-cocina/dietas-tarifas` | Catálogo de dietas y tarifas históricas |
| `/dietas-cocina/cocina` | Órdenes de producción y seguimiento |
| `/dietas-cocina/impresion-etiquetas` | Generación e impresión de etiquetas |
| `/dietas-cocina/recepcion-proveedor` | Pre-entrega / recepción en piso |
| `/dietas-cocina/bandejas-piso` | Entrega, consulta QR, devolución, recogida |
| `/dietas-cocina/reportes-clinicos` | Reportes nutricionista (export CSV) |
| `/dietas-cocina/reportes-produccion` | Reportes cocina / proveedor |
| `/dietas-cocina/conciliacion` | Conciliación facturación vs producción |
| `/dietas-cocina/parametros/tiempos` | Ventanas por tiempo de comida |
| `/dietas-cocina/parametros/tipos-paciente` | Categorías de edad / porciones |
| `/dietas-cocina/auditoria` | Registro forense de acciones |
| `/dietas-cocina/usuarios` | Usuarios, roles y matriz de permisos |

### 7.2 Tiempos de comida

| Backend (`TiempoComida`) | Frontend | Horario típico |
|---|---|---|
| `Desayuno` | `desayuno` | Mañana |
| `MediaNueve` | `merienda-manana` | Media mañana |
| `Almuerzo` | `almuerzo` | Mediodía |
| `Onces` | `merienda-tarde` | Tarde |
| `Cena` | `cena` | Noche |
| `MediaNoche` | `merienda-noche` | Madrugada |

Mapeo: `frontend/src/modules/dietas-cocina/api/utils.ts`.

### 7.3 Estados de dieta (backend)

| Valor | Nombre | Descripción |
|---|---|---|
| 1 | Pendiente | Sin solicitud |
| 2 | Guardado | Borrador guardado |
| 3 | Solicitada | Solicitud enviada |
| 4 | Confirmada | Confirmada — genera orden cocina |
| 5 | EnPreparacion | En cocina |
| 6 | ListaEnvio | Lista para despacho |
| 7 | EnRuta | Despachada / en tránsito |
| 8 | Entregada | Entregada al paciente |
| 9 | Consumida | Consumida |
| 10 | Cancelada | Cancelada |
| 11 | NoConsumida | No consumida |
| 12 | Devuelta | Devuelta |

### 7.4 Estados logísticos de etiqueta

```text
generada → impresa → pre_entregada → entregada → devuelta
                              ↘ rechazo (antes de entrega)
```

Capacidades por rol en UI: `impresion_proveedor`, `recepcion_proveedor`, `entrega_paciente`, `rechazo_antes_entrega`, `recogida_bandeja`.

---

## 8. Flujos operativos

### 8.1 Flujo principal: censo → dieta confirmada

```text
1. Nutricionista abre /dietas-cocina/dietas
2. GET /dietas-cocina/censo?fecha&comida
   └─ Sincroniza pacientes hospitalizados desde Vital
3. Selecciona paciente → abre formulario solicitud
4. POST /dietas-cocina/dietas/{id}/solicitud
   └─ Estado: Solicitada (incluye tipo dieta, aislamiento, alergias)
5. POST /dietas-cocina/dietas/{id}/confirmar
   └─ Estado: Confirmada
   └─ Crea OrdenCocina 1:1 → devuelve ordenCocinaId
6. (Opcional) POST /dietas-cocina/dietas/bulk/confirmar
```

### 8.2 Flujo cocina

```text
1. Proveedor abre /dietas-cocina/cocina
2. GET /ordenes-cocina?fecha&comida&estado
3. PATCH /ordenes-cocina/{id}/estado
   └─ por_iniciar → en_preparacion → lista → despachada
4. PATCH /ordenes-cocina/{id}/checklist (ítems de preparación)
5. POST /ordenes-cocina/{id}/cancelar (si aplica)
```

### 8.3 Flujo etiquetas y bandejas

```text
1. POST /dietas-cocina/etiquetas/generar (desde orden confirmada)
2. PATCH /dietas-cocina/etiquetas/bulk/impresas
3. PATCH /dietas-cocina/etiquetas/{id}/pre-entrega  (recepción proveedor)
4. PATCH /dietas-cocina/etiquetas/{id}/entrega       (enfermería / auxiliar)
5. PATCH /dietas-cocina/etiquetas/{id}/devolucion      (con motivo)
6. POST /dietas-cocina/etiquetas/pdf                  (PDF térmico 168×88 mm)
7. GET  /dietas-cocina/etiquetas/buscar?codigo=…     (consulta QR)
```

Regla de permiso devolución:
- Estado `pre_entregada` → permiso **RechazoAntesEntrega** (24)
- Estado `entregada` → permiso **RecogidaBandeja** (25)

### 8.4 Flujo conciliación

```text
1. GET /dietas-cocina/conciliacion (+ filtros, paginación)
2. GET /dietas-cocina/conciliacion/kpis
3. PATCH /conciliacion/{id}/conciliado | /pendiente-revision
4. POST  /conciliacion/{id}/factura (adjuntar documento)
5. Export CSV: GET /conciliacion?formato=csv
```

### 8.5 Flujo usuarios

```text
1. GET  /dietas-cocina/usuarios
2. POST /dietas-cocina/usuarios  (password inicial = identificacion)
3. PUT  /dietas-cocina/usuarios/{id}
4. PATCH /usuarios/{id}/rol | /estado
5. POST /usuarios/{id}/restablecer-password
6. GET/PUT /roles/permisos (matriz)
```

Guía migración masiva: [MIGRACION-USUARIOS.md](./MIGRACION-USUARIOS.md)

### 8.6 Dashboards y reportes

| Pantalla | Endpoint | Rol típico |
|---|---|---|
| Inicio (clínico) | `GET /dietas-cocina/dashboard/nutricionista` | Nutricionista, Admin |
| Inicio (cocina) | `GET /dietas-cocina/dashboard/proveedor` | Proveedor |
| Inicio (logística) | `GET /dietas-cocina/dashboard/enfermera` | Enfermera, Auxiliar |
| Reportes clínicos | `GET /dietas-cocina/reportes/nutricionista` | Nutricionista |
| Reportes producción | `GET /dietas-cocina/reportes/proveedor` | Proveedor |

Parámetros comunes: `fecha`, `comida`, `desde`, `hasta`, `formato=csv`.

---

## 9. Referencia de API

**Base URL:** `/api/v1`  
**Autenticación:** Cookie de sesión (excepto login y cambiar-password)

### 9.1 Controladores operativos

| Controlador | Prefijo | Documentación |
|---|---|---|
| `AuthController` | `/auth` | [FRONTEND-API-GUIDE.md](../backend/FRONTEND-API-GUIDE.md) |
| `AtencionesController` | `/atenciones` | Idem (hospitalarias) |
| `PacientesController` | `/pacientes` | Idem |
| `DietasCocinaController` | `/dietas-cocina` | [README-ENDPOINTS-DIETAS.md](../backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md) |
| `OrdenesCocinaController` | `/ordenes-cocina` | Idem |
| `EtiquetasController` | `/dietas-cocina/etiquetas` | Idem |
| `ConciliacionController` | `/dietas-cocina/conciliacion` | Idem |
| `DashboardController` | `/dietas-cocina/dashboard`, `/reportes` | Idem |
| `ParametrosController` | `/dietas-cocina/parametros` | Idem |
| `AuditoriaController` | `/dietas-cocina/auditoria` | Idem |
| `UsuariosPermisosController` | `/dietas-cocina/usuarios`, `/roles` | Idem |

### 9.2 Formato de respuesta

**Éxito:**

```json
{
  "data": { },
  "timestamp": "2026-08-03T12:00:00Z",
  "version": "v1"
}
```

**Error (RFC 7807 Problem Details):**

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Bad Request",
  "status": 400,
  "detail": "Mensaje descriptivo",
  "instance": "/api/v1/..."
}
```

### 9.3 Códigos HTTP frecuentes

| Código | Significado |
|---|---|
| 200 | Operación exitosa |
| 400 | Parámetros inválidos |
| 401 | Sesión expirada o no autenticado |
| 403 | Sin permiso para la acción |
| 404 | Recurso no encontrado |
| 429 | Rate limit (login) |
| 500 | Error interno |
| 503 | Health unhealthy (BD no disponible) |

### 9.4 Swagger

Desarrollo: `http://localhost:8080/swagger`  
Producción: restringir acceso (solo red interna / diagnóstico).

---

## 10. Frontend

### 10.1 Estructura del módulo

```text
frontend/src/modules/dietas-cocina/
├── api/                 # Servicios HTTP, mappers, repositorios
├── inicio/              # Dashboards por rol
├── dietas/              # Censo y ciclo de solicitud
├── dietas-tarifas/      # Catálogo
├── cocina/              # Órdenes producción
├── impresion-etiquetas/ # Generación etiquetas
├── recepcion-proveedor/ # Pre-entrega
├── bandejas-piso/       # Entrega / devolución
├── etiquetas/           # Flujos compartidos QR
├── reportes-clinicos/   # Export nutricionista
├── reportes-produccion/ # Export cocina
├── conciliacion/        # Facturación
├── parametros/          # Tiempos y tipos paciente
├── auditoria/           # Forense
├── usuarios/            # ABM usuarios y roles
├── components/          # Guards, layout módulo
├── context/             # Estado ciclo bandejas, sync cocina
├── lib/                 # Permisos, utilidades
└── types/               # Enums, DTOs UI
```

### 10.2 Patrón mock vs HTTP

Flag: `VITE_DIETAS_COCINA_API=true` → `usarApiDietasCocina()` en `api/flags.ts`.

| Repositorio | Con API=true | Con API=false |
|---|---|---|
| Censo | `censoRepository.http.ts` | `censoRepository.mock.ts` |
| Ciclo bandejas | `cicloBandejasRepository.http.ts` | mock |
| Dietas operativas | HTTP | mock |
| Etiquetas | HTTP | mock |

Servicios que **siempre** usan HTTP cuando la pantalla los invoca con API activa: usuarios, conciliación, auditoría, parámetros, dashboards, reportes, catálogo.

### 10.3 Permisos en runtime

1. Al entrar al módulo: `GET /dietas-cocina/roles/permisos`.
2. Cache en memoria: `permisosMatrizCache.ts`.
3. `RequireDietasRuta` valida acceso a la ruta UI.
4. Administrador puede usar **vista por rol** (`VistaRolAdminContext`) para simular otro rol.

### 10.4 Build producción

```bash
pnpm build:iis
# Salida: deploy/frontend/ + deploy/apinegocio/
```

---

## 11. Despliegue en producción

### 11.1 Resumen

| Paso | Acción |
|---|---|
| 1 | `pnpm build:iis` en máquina de desarrollo |
| 2 | Copiar `deploy/apinegocio/` → `C:\inetpub\wwwroot\bital-api-negocio\` |
| 3 | Copiar `deploy/frontend/` → `C:\inetpub\wwwroot\bital-frontend\` |
| 4 | Sitio API: binding `http://127.0.0.1:8081` |
| 5 | Sitio frontend: HTTPS puerto **8080** + certificado SSL |
| 6 | Habilitar ARR proxy + URL Rewrite |
| 7 | Verificar `/health` y login |

Guías detalladas:

- [DEPLOYMENT-IIS-GUIDE.md](../backend/DEPLOYMENT-IIS-GUIDE.md)
- [PASOS-HTTPS-IIS-FRONTEND.md](./PASOS-HTTPS-IIS-FRONTEND.md)
- [DEPLOYMENT-QUICKSTART.md](../backend/DEPLOYMENT-QUICKSTART.md)

### 11.2 Configuración producción API

Archivo: `backend/Bital.ApiNegocio/appsettings.Production.json`

| Clave | Valor prod. |
|---|---|
| `Kestrel:Endpoints:Http:Url` | `http://127.0.0.1:8081` |
| `ConnectionStrings:BitalDatabase` | `10.238.97.66` |
| `ConnectionStrings:VitalDatabase` | `10.238.97.69` |
| `Cors:AllowedOrigins` | `https://riosoft.clinicadelriomonteria.com:8080` |
| `Jwt:CrossOriginCookies` | `false` |

---

## 12. Seguridad

Resumen de controles implementados. Detalle: [CIBERSEGURIDAD-PRODUCCION.md](./CIBERSEGURIDAD-PRODUCCION.md)

| Control | Implementación |
|---|---|
| HTTPS obligatorio | Redirect HTTP→HTTPS en `web.config` frontend |
| Cookie de sesión | `Secure` + `HttpOnly` + `SameSite=Strict` |
| API no expuesta | Solo `127.0.0.1:8081` |
| Rate limiting | Login y cambio contraseña (10 req/min/IP) |
| Contraseñas | PBKDF2 (100k iteraciones); upgrade desde SHA-256 legacy |
| Headers seguridad | HSTS, CSP, X-Frame-Options, nosniff |
| WebDAV deshabilitado | Evita HTTP 405 en PUT/PATCH |
| Endpoints `_test/*` | Solo ambiente Development |
| CORS | Orígenes explícitos en configuración |

---

## 13. Operación y mantenimiento

### 13.1 Health check

```bash
curl https://riosoft.clinicadelriomonteria.com:8080/health
# Respuesta esperada: Healthy
```

Verifica conectividad a `BitalNegocio`. Si responde `Unhealthy`, revisar connection strings y SQL Server.

### 13.2 Logs

| Origen | Ubicación |
|---|---|
| API (Serilog) | `C:\logs\bital-api-negocio\app-*.log` |
| IIS stdout | `C:\inetpub\wwwroot\bital-api-negocio\logs\stdout*.log` |

### 13.3 Reinicio de servicios

```powershell
Restart-WebAppPool -Name BitalApiNegocioPool
Restart-Website -Name BitalFrontend
Restart-Website -Name BitalApiNegocio
```

### 13.4 Actualización de versión

```powershell
# Dev
pnpm build:iis

# Servidor — detener sitios, copiar deploy/*, reiniciar
```

### 13.5 Re-sincronizar censo (sin migración completa)

```powershell
sqlcmd -S ... -d BitalNegocio -E -C -f 65001 `
  -v VitalDatabase="Hosvital_Pruebas" FechaOperativa="2026-08-03" `
  -i backend\scripts\02-MigrateData.sql
```

### 13.6 Troubleshooting frecuente

| Síntoma | Causa probable | Acción |
|---|---|---|
| 502 en `/api/v1` | API caída o ARR deshabilitado | `curl http://127.0.0.1:8081/health` |
| 401 tras login | CORS / cookie Secure | Acceder solo por HTTPS; verificar `Cors:AllowedOrigins` |
| Censo vacío | Sin hospitalizados en Vital pab. 3–7 | Normal si no hay pacientes; verificar Vital |
| 405 en PUT/PATCH | WebDAV activo en IIS | Confirmar `web.config` deshabilita WebDAV |
| Login falla post-migración | Hash legacy | Usar password = identificacion; migrará a PBKDF2 |
| Caracteres corruptos en BD | sqlcmd sin UTF-8 | Usar `-f 65001` |

---

## 14. Anexos

### Anexo A — Matriz permisos seed por rol

#### Nutricionista (códigos API)

`1, 2, 3, 5, 6, 7, 8, 10, 30, 40, 41, 50, 60`

Rutas UI inferidas: inicio, dietas, dietas-tarifas, cocina (listar), conciliacion, reportes-clinicos, parametros, auditoria.

#### Proveedor

`10, 11, 12, 13, 20, 21, 30, 40, 41`

Rutas UI: cocina, impresion-etiquetas, reportes-produccion, conciliacion, inicio.

#### Enfermera

`1, 20, 22, 40`

Rutas UI: dietas (listar), recepcion-proveedor, inicio.

#### Auxiliar de Cocina

`20, 23, 24, 25, 40`

Rutas UI: bandejas-piso, inicio.

> La matriz en producción puede diferir si un administrador editó permisos vía UI.

### Anexo B — Motivos de devolución (UI)

Paciente no estaba en habitación · Paciente en NVO o ayuno · Paciente se negó antes de recibir · Bandeja incorrecta · Bandeja dañada o contaminada · Temperatura inadecuada · Se consumió · Consumo parcial · No se consumió · Bandeja sin abrir.

### Anexo C — Documentación complementaria

| Documento | Contenido |
|---|---|
| [README.md](../README.md) | Índice del monorepo |
| [frontend/README.md](../frontend/README.md) | Stack y variables frontend |
| [backend/README.md](../backend/README.md) | Arquitectura backend |
| [FRONTEND-API-GUIDE.md](../backend/FRONTEND-API-GUIDE.md) | Auth, pacientes, atenciones |
| [README-ENDPOINTS-DIETAS.md](../backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md) | Endpoints detallados dietas |
| [MIGRACION_SQL_SERVER.md](./MIGRACION_SQL_SERVER.md) | Migración BD |
| [MIGRACION-USUARIOS.md](./MIGRACION-USUARIOS.md) | Migración usuarios |
| [CIBERSEGURIDAD-PRODUCCION.md](./CIBERSEGURIDAD-PRODUCCION.md) | Seguridad |

### Anexo D — Contacto soporte

**Equipo RioSoft — Clínica del Río**  
Correo: soporte@clinicadelrio.com

---

*Fin del manual técnico operativo RioSoft v1.2.7*
