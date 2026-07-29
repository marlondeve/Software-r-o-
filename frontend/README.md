# Frontend BITAL

Aplicación web React del proyecto **BITAL** (nombre código) para Clínica del Río. SPA desplegable en IIS.

El único módulo con **prototipo funcional** es **Dietas y Cocina**. Encuestas SIAO y Administración existen como scaffold de pantallas y navegación, pero sus flujos aún no están operativos.

Documentación general del monorepo: [README.md](../README.md)

## Stack

React 19 · Vite 8 · TypeScript 6 · Tailwind CSS v4 · shadcn/ui · React Router 7 · React Hook Form · Zod · Recharts · TanStack Table

## Estructura

```text
frontend/
├── public/              # Assets estáticos, web.config (IIS)
├── src/
│   ├── app/             # Router principal
│   ├── components/      # Layout (sidebar, topbar), UI compartida (shadcn)
│   ├── features/        # Autenticación, administración transversal
│   ├── api/             # Capa global HTTP (Axios → Bital.ApiConsultas)
│   ├── modules/         # Módulos de negocio (dietas-cocina, encuestas)
│   ├── services/        # Global services (auth mock)
│   ├── lib/             # Utilidades
│   ├── hooks/
│   ├── types/
│   └── estilos/
├── vite.config.ts       # Alias @/ → src/
└── components.json      # Configuración shadcn/ui
```

## Scripts

```bash
# Desde la raíz del monorepo
pnpm dev
pnpm build
pnpm build:hostinger
pnpm build:iis
pnpm lint
pnpm preview

# Desde esta carpeta
pnpm dev
pnpm build
pnpm build:hostinger
pnpm build:iis
pnpm lint
pnpm preview
```

Servidor de desarrollo: `http://localhost:5173`

## Flujo de navegación

```text
/login → /modulos → /dietas-cocina/* | /encuestas/*
                         ↓
              /administracion/* (solo admin)
```

- `/modulos` — selección de módulo post-login (si el usuario tiene acceso a más de uno)
- Administración no es un módulo seleccionable; aparece en el sidebar solo para usuarios admin

## Módulos

| Módulo | Ruta base | Estado | Subsecciones |
|---|---|---|---|
| **Dietas y Cocina** | `/dietas-cocina` | Prototipo funcional | inicio, dietas, dietas-tarifas, cocina, etiquetas, reportes, conciliación, parámetros, auditoría, usuarios |
| **Encuestas SIAO** | `/encuestas` | Scaffold | inicio, identificación, captura (presencial/teléfono), cuestionarios, editor, indicadores, brechas, parámetros, auditoría, usuarios |
| **Administración** | `/administracion` | Scaffold | usuarios, roles, permisos (solo admin) |

## Autenticación (mock)

La autenticación actual es mock (`src/services/authService.ts`). La contraseña puede ser cualquier valor no vacío.

| Correo | Acceso |
|---|---|
| `admin@clinicadelrio.com.co` | Dietas y Cocina + Encuestas + permisos de administrador |
| `dietas@clinicadelrio.com.co` | Solo Dietas y Cocina |
| `encuestas@clinicadelrio.com.co` | Solo Encuestas SIAO |
| `otro@clinicadelrio.com.co` | Dietas y Cocina + Encuestas (operador) |

Guards de ruta en `src/features/autenticacion/components/`: `RequireAuth`, `RequireModuleAccess`, `RequireAdmin`, `RequireDietasRuta`.

## Capa API global (`src/api/`)

Transporte HTTP compartido por ambos módulos. Cliente Axios único, tipos y servicios alineados con [`backend/API-FRONTEND-PRODUCCION.md`](../backend/API-FRONTEND-PRODUCCION.md).

```typescript
import { getAtencionesHospitalarias, searchPacientes } from "@/api"
```

| Archivo | Contenido |
|---|---|
| `src/api/client.ts` | Instancia Axios + manejo de errores |
| `src/api/pacientes.service.ts` | `searchPacientes` |
| `src/api/atenciones.service.ts` | Atenciones, hospitalarias, por paciente |
| `src/api/health.service.ts` | Health check |

Los módulos **no duplican Axios**: sus repositorios en `modules/*/api/` delegan a `@/api`.

## Patrón de datos (mock / HTTP)

Cada módulo adapta la respuesta del API global a su dominio con repositorios mock/HTTP:

```typescript
// modules/dietas-cocina/api/index.ts
import.meta.env.VITE_DIETAS_COCINA_API === "true" ? censoRepositoryHttp : censoRepositoryMock
```

| Variable | Efecto |
|---|---|
| `VITE_BITAL_API_BASE_URL` | Base URL ApiConsultas (default: producción del doc Back) |
| `VITE_BITAL_API_HEALTH_URL` | URL del health check |
| `VITE_DIETAS_COCINA_API=true` | Censo y ciclo bandejas usan HTTP (vía `@/api`) |
| `VITE_ENCUESTAS_API=true` | Repositorio de pacientes Encuestas usa HTTP (vía `@/api`) |

Copiar [`frontend/.env.example`](.env.example) a `.env.local` para desarrollo. Para Hostinger: `.env.hostinger.example` → `.env.hostinger`.

## Integración con backend

Integración vía **Bital.ApiNegocio** en producción:

- API directa: `http://api.clinicadelriomonteria.com:8080`
- Health: `http://api.clinicadelriomonteria.com:8080/health`

Documentación: [backend/API-FRONTEND-PRODUCCION.md](../backend/API-FRONTEND-PRODUCCION.md)

Encuestas tiene repositorio HTTP preparado (`modules/encuestas/api/`); las pantallas siguen en mock hasta conectar identificación de paciente.

## Despliegue Hostinger (recomendado)

Frontend en **Hostinger** (`https://riosoft.clinicadelriomonteria.com`) y API en el **servidor de la clínica** (`http://api.clinicadelriomonteria.com:8080`). El navegador usa rutas relativas; Apache en Hostinger hace proxy al API.

### DNS

| Subdominio | Apunta a |
|---|---|
| `riosoft.clinicadelriomonteria.com` | Hostinger (frontend) |
| `api.clinicadelriomonteria.com` | `186.190.254.230` (API, puerto 8080) |

### Build y subida

```bash
cp .env.hostinger.example .env.hostinger
pnpm build:hostinger
```

Subir el contenido de `frontend/dist/` a la carpeta del subdominio `riosoft` en Hostinger.

### Verificación

1. `https://riosoft.clinicadelriomonteria.com/health` → debe responder `Healthy` (proxy OK)
2. `https://riosoft.clinicadelriomonteria.com/login` → recarga directa (SPA)
3. Login y llamadas a `/api/v1/...`

Si `/health` falla, el plan de Hostinger puede no tener `mod_proxy` habilitado (flag `[P]` en `.htaccess`). Contactar soporte Hostinger.

Guía completa: [docs/DEPLOYMENT-HOSTINGER.md](../docs/DEPLOYMENT-HOSTINGER.md)

## Despliegue IIS (clínica, frontend + API en el mismo servidor)

1. Generar build de producción:

```bash
pnpm build:iis
```

2. Copiar el contenido de `frontend/dist/` al sitio IIS.

3. Verificar que `web.config` esté presente en la raíz del sitio y que el módulo **URL Rewrite** esté instalado.

4. Probar rutas con recarga directa (F5):
   - `/login`
   - `/dietas-cocina/inicio`
   - `/encuestas/inicio`

## Alias de importación

Vite resuelve `@/` hacia `src/` (configurado en `vite.config.ts`).

```typescript
import { Button } from "@/components/ui/button"
```
