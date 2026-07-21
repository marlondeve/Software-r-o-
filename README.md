# BITAL — Monorepo

Plataforma institucional de **BITAL** para **Clínica del Río**. Este repositorio contiene el **frontend** (React) y el **backend** (API, pendiente de implementación) en un monorepo gestionado con **pnpm workspaces**.

## Estructura

```text
bital/
├── frontend/          # Aplicación web React (Vite + TypeScript)
├── backend/           # API institucional (placeholder)
├── package.json       # Scripts del monorepo
├── pnpm-workspace.yaml
└── README.md
```

| Paquete | Descripción | Documentación |
|---|---|---|
| [`frontend/`](./frontend/) | SPA React con módulos Dietas y Cocina, Encuestas y Administración | [frontend/README.md](./frontend/README.md) |
| [`backend/`](./backend/) | API REST (por implementar) | [backend/README.md](./backend/README.md) |

## Requisitos

- **Node.js** 20+
- **pnpm** 9+

## Inicio rápido

```bash
# Instalar dependencias (raíz + workspaces)
pnpm install

# Frontend — http://localhost:5173
pnpm dev
# alias: pnpm dev:front

# Backend — http://localhost:3000 (placeholder)
pnpm dev:back
```

## Scripts del monorepo

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo del frontend |
| `pnpm dev:front` | Igual que `pnpm dev` |
| `pnpm dev:back` | Servidor placeholder del backend |
| `pnpm build` | Build de producción del frontend |
| `pnpm build:front` | Igual que `pnpm build` |
| `pnpm build:back` | Build del backend (cuando exista) |
| `pnpm lint` | Lint del frontend (oxlint) |
| `pnpm preview` | Preview del build del frontend |

## Frontend

Aplicación SPA desplegable en **IIS**. Incluye:

- Autenticación mock con roles por módulo
- Selección de módulo post-login
- Layout responsive (sidebar + topbar)
- Módulos **Dietas y Cocina** y **Encuestas SIAO**
- Permisos de administrador integrados en el sidebar

### Usuarios de prueba (mock)

La contraseña puede ser cualquier valor no vacío mientras dure el mock.

| Correo | Acceso |
|---|---|
| `admin@clinicadelrio.com.co` | Dietas y Cocina + Encuestas + permisos de administrador |
| `dietas@clinicadelrio.com.co` | Solo Dietas y Cocina |
| `encuestas@clinicadelrio.com.co` | Solo Encuestas SIAO |
| `otro@clinicadelrio.com.co` | Dietas y Cocina + Encuestas (operador) |

> **Nota:** `admin@` tiene acceso a ambos módulos operativos y permisos extra de administración (Usuarios y roles, etc.) en el sidebar. Administración no es un módulo seleccionable en `/modulos`.

### Despliegue IIS (frontend)

1. `pnpm build:front`
2. Copiar `frontend/dist/` al sitio IIS
3. Verificar `web.config` y módulo **URL Rewrite**
4. Probar `/login`, `/dietas-cocina/inicio`, `/encuestas/inicio` con F5

## Backend

Reservado para la API institucional. El frontend usa actualmente `frontend/src/servicios/authService.ts` como mock; al implementar el backend, ese servicio debe apuntar a los endpoints reales.

Puerto por defecto: **3000** (`PORT`).

## Tecnologías

### Frontend

React 19 · Vite 8 · TypeScript 6 · Tailwind CSS v4 · shadcn/ui · React Router 7 · React Hook Form · Zod

### Backend

Por definir (Node.js placeholder incluido).

## Flujo de la aplicación

```text
/login → /modulos (si aplica) → /dietas-cocina/* | /encuestas/*
                                      ↓
                            /administracion/* (solo admin)
```

## Alcance actual

**Incluido:** scaffold frontend completo, monorepo front/back, auth mock, layout responsive, pantallas placeholder por sección, SPA para IIS.

**Pendiente:** API real, permisos granulares, pantallas de negocio, tests automatizados.

## Desarrollo por paquete

```bash
# Trabajar solo en frontend
cd frontend && pnpm dev

# Trabajar solo en backend
cd backend && pnpm dev
```
