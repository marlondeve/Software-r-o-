# BITAL — Monorepo

**BITAL** es el nombre código del software en desarrollo para **Clínica del Río**. La institución aún no ha definido el nombre comercial definitivo de la plataforma.

Monorepo con frontend React y backend .NET 8, gestionado con **pnpm workspaces**.

## Documentación

| Documento | Contenido |
|---|---|
| [frontend/README.md](./frontend/README.md) | Stack, módulos, auth mock, despliegue IIS, variables de entorno |
| [backend/README.md](./backend/README.md) | Arquitectura .NET, ejecución local, configuración |
| [backend/FRONTEND-API-GUIDE.md](./backend/FRONTEND-API-GUIDE.md) | Referencia de endpoints de ApiConsultas (Vital HIS) |

## Estructura

```text
bital/
├── frontend/              # SPA React (Vite + TypeScript)
├── backend/               # Solución .NET 8 (ApiNegocio + ApiConsultas)
├── package.json           # Scripts del monorepo
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

# Frontend → http://localhost:5173
pnpm dev

# Backend .NET (en terminales separadas)
dotnet run --project backend/Bital.ApiConsultas   # → http://localhost:5013
dotnet run --project backend/Bital.ApiNegocio     # → http://localhost:5042
```

## Scripts del monorepo

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo del frontend |
| `pnpm dev:front` | Igual que `pnpm dev` |
| `pnpm dev:back` | Placeholder Node del workspace backend (puerto 3000, no es el backend .NET) |
| `pnpm build` | Build de producción del frontend |
| `pnpm build:front` | Igual que `pnpm build` |
| `pnpm build:back` | Build del workspace backend (placeholder) |
| `pnpm lint` | Lint del frontend (oxlint) |
| `pnpm preview` | Preview del build del frontend |

## Arquitectura

```text
Frontend (React/Vite, puerto 5173)
      ↓
Bital.ApiNegocio (puerto 5042)     ← único punto de entrada del frontend
      ↓
Bital.ApiConsultas (puerto 5013)   ← bridge read-only hacia Vital HIS
      ↓
SQL Server (Vital)
```

## Estado del proyecto

| Componente | Estado |
|---|---|
| Módulo Dietas y Cocina | Prototipo funcional (único módulo con flujos operativos completos) |
| Módulos Encuestas y Administración | Scaffold de pantallas; no son prototipos funcionales |
| Frontend React | Shell compartido (auth, layout, routing); ver detalle en [frontend/README.md](./frontend/README.md) |
| ApiConsultas | Implementada (pacientes, atenciones, health, Swagger) |
| ApiNegocio | Scaffold; pendiente exposición de endpoints de negocio |
| Autenticación real | Pendiente (mock en frontend) |
| Integración frontend ↔ backend | Preparada en repositorios HTTP; activación progresiva |

## Desarrollo por paquete

```bash
# Solo frontend
cd frontend && pnpm dev

# Solo backend .NET
cd backend && dotnet run --project Bital.ApiConsultas
```

Detalle de módulos, usuarios de prueba e IIS: [frontend/README.md](./frontend/README.md)
