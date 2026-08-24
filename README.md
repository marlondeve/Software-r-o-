# RioSoft — Monorepo

**RioSoft** es la plataforma de gestión hospitalaria de **Clínica del Río** (dietas, cocina, encuestas SIAO y administración).

Monorepo con frontend React y backend .NET 8, gestionado con **pnpm workspaces**.

**Versión actual del producto:** `1.2.2` — ver [CHANGELOG.md](./CHANGELOG.md)

> Los proyectos .NET y la base de datos conservan el prefijo técnico `Bital` del desarrollo inicial (`Bital.ApiNegocio`, `BitalNegocio`).
## Documentación

| Documento | Contenido |
|---|---|
| [CHANGELOG.md](./CHANGELOG.md) | Historial de versiones |
| **[docs/MANUAL-TECNICO.md](./docs/MANUAL-TECNICO.md)** | **Manual técnico completo (parte operativa)** |
| [frontend/README.md](./frontend/README.md) | Stack, módulos, variables de entorno, despliegue IIS |
| [backend/README.md](./backend/README.md) | Arquitectura .NET, ejecución local, configuración |
| [backend/FRONTEND-API-GUIDE.md](./backend/FRONTEND-API-GUIDE.md) | Endpoints compartidos (auth, pacientes, atenciones) |
| [backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md](./backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md) | Endpoints del módulo Dietas y Cocina |
| [backend/Bital.ApiNegocio/README-ENDPOINTS-ENCUESTAS.md](./backend/Bital.ApiNegocio/README-ENDPOINTS-ENCUESTAS.md) | Endpoints del módulo Encuestas SIAO |
| [backend/DEPLOYMENT-IIS-GUIDE.md](./backend/DEPLOYMENT-IIS-GUIDE.md) | Despliegue completo en IIS (frontend + API) |
| [backend/DEPLOYMENT-QUICKSTART.md](./backend/DEPLOYMENT-QUICKSTART.md) | Despliegue rápido |
| [docs/PASOS-HTTPS-IIS-FRONTEND.md](./docs/PASOS-HTTPS-IIS-FRONTEND.md) | HTTPS en IIS para el frontend |
| [docs/CIBERSEGURIDAD-PRODUCCION.md](./docs/CIBERSEGURIDAD-PRODUCCION.md) | Checklist de seguridad en producción |
| [docs/MIGRACION_SQL_SERVER.md](./docs/MIGRACION_SQL_SERVER.md) | Migración de base de datos BitalNegocio |
| [docs/MIGRACION-USUARIOS.md](./docs/MIGRACION-USUARIOS.md) | Migración de usuarios institucionales |

## Estructura

```text
Software-r-o-/
├── frontend/              # SPA React (Vite + TypeScript)
├── backend/               # Solución .NET 8 (Bital.ApiNegocio)
├── scripts/               # build-iis.ps1 y utilidades de despliegue
├── deploy/                # Salida de publicación (generada, no versionada)
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Prerrequisitos

| Herramienta | Versión | Referencia |
|---|---|---|
| Node.js | 24.18+ | `.nvmrc` |
| pnpm | 11.15+ | `packageManager` en `package.json` |
| .NET SDK | 8.0.423 | `backend/global.json` |

Con [Corepack](https://nodejs.org/api/corepack.html) habilitado:

```bash
corepack enable
corepack prepare pnpm@11.15.1 --activate
```

## Inicio rápido

```bash
# Instalar dependencias (raíz + workspaces)
pnpm install

# Terminal 1 — Frontend → http://localhost:5173
pnpm dev

# Terminal 2 — Backend → http://localhost:8080
dotnet run --project backend/Bital.ApiNegocio
```

El frontend en desarrollo usa proxy Vite hacia `http://localhost:8080` (configurable con `VITE_DEV_API_PROXY_TARGET` en `.env.local`).

## Scripts del monorepo

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo del frontend |
| `pnpm build:iis` | Build frontend + publicación API en `deploy/` |
| `pnpm build:iis:frontend` | Solo build del frontend |
| `pnpm build:iis:apinegocio` | Solo publicación de la API |
| `pnpm lint` | Lint del frontend (oxlint) |
| `pnpm preview` | Preview del build del frontend |

## Arquitectura

```text
Frontend (React/Vite, puerto 5173 en dev)
      ↓  /api/v1, /health
Bital.ApiNegocio (puerto 8080 en dev, 127.0.0.1:8081 en prod IIS)
      ↓
SQL Server BitalNegocio + SQL Server Vital (Hosvital_Pruebas, read-only)
```

En producción IIS el frontend es público en **HTTPS :8080** y hace proxy interno al API en **127.0.0.1:8081**. El navegador nunca accede al API directamente.

## Estado del proyecto

| Componente | Estado |
|---|---|
| Módulo Dietas y Cocina | Operativo con backend (`VITE_DIETAS_COCINA_API=true`) |
| Módulo Encuestas SIAO | Backend implementado; frontend deshabilitado por defecto (`VITE_ENCUESTAS_ENABLED=false`) |
| Administración plataforma | Scaffold de pantallas |
| Bital.ApiNegocio | Implementada — API backend de RioSoft (único punto de entrada del frontend) |
| Autenticación | Cookie de sesión segura en HTTPS mismo origen (`/api/v1/auth/*`) |
| Integración Vital HIS | Read-only vía capa de infraestructura |

## Desarrollo por paquete

```bash
# Solo frontend
cd frontend && pnpm dev

# Solo backend .NET
cd backend && dotnet run --project Bital.ApiNegocio
```

Detalle de módulos, login institucional e IIS: [frontend/README.md](./frontend/README.md)
