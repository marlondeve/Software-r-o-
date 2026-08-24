# Frontend RioSoft

Aplicación web React de **RioSoft** para Clínica del Río. SPA desplegable en IIS con PWA.

Documentación general del monorepo: [README.md](../README.md)

## Stack

React 19 · Vite 8 · TypeScript 6 · Tailwind CSS v4 · shadcn/ui · React Router 7 · React Hook Form · Zod · Recharts · TanStack Table · vite-plugin-pwa

## Estructura

```text
frontend/
├── public/              # Assets estáticos, web.config (IIS + proxy al API)
├── src/
│   ├── app/             # Router principal
│   ├── components/      # Layout (sidebar, topbar), UI compartida (shadcn)
│   ├── features/        # Autenticación, administración transversal
│   ├── api/             # Capa HTTP global (Axios → Bital.ApiNegocio)
│   ├── modules/         # Módulos de negocio (dietas-cocina, encuestas)
│   ├── services/        # authService (sesión + cookies JWT)
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── estilos/
├── vite.config.ts       # Alias @/ → src/, proxy dev, PWA
└── components.json      # Configuración shadcn/ui
```

## Scripts

```bash
# Desde la raíz del monorepo
pnpm dev
pnpm build:iis
pnpm lint
pnpm preview
pnpm test

# Desde esta carpeta
pnpm dev
pnpm build:iis
pnpm lint
```

Servidor de desarrollo: `http://localhost:5173`

## Flujo de navegación

```text
/login → /modulos → /dietas-cocina/* | /encuestas/*
                         ↓
              /administracion/* (solo admin)
```

- `/modulos` — selección de módulo post-login (si el usuario tiene acceso a más de uno)
- Administración no es un módulo seleccionable; aparece en el sidebar solo para administradores

## Módulos

| Módulo | Ruta base | Estado | Notas |
|---|---|---|---|
| **Dietas y Cocina** | `/dietas-cocina` | **Operativo** | Integrado con API (`VITE_DIETAS_COCINA_API=true`) |
| **Encuestas SIAO** | `/encuestas` | Backend listo, UI parcial | Deshabilitado por defecto (`VITE_ENCUESTAS_ENABLED=false`) |
| **Administración** | `/administracion` | Scaffold | usuarios, roles, permisos (solo admin) |

## Autenticación

La autenticación es contra `Bital.ApiNegocio`. En **producción (HTTPS, mismo origen)** el login devuelve una **cookie de sesión segura** (`bital_access_token`: `Secure`, `HttpOnly`, `SameSite=Strict`). El navegador la envía sola en cada request (`withCredentials: true`); el frontend **no lee ni guarda el JWT** — solo datos de perfil en `sessionStorage`.

En **desarrollo**, Vite hace proxy de `/api` y `/health` al backend local, así el flujo de cookie es equivalente a mismo origen.

| Endpoint | Uso |
|---|---|
| `POST /api/v1/auth/login` | Inicio de sesión |
| `GET /api/v1/auth/me` | Rehidratar sesión |
| `POST /api/v1/auth/logout` | Cerrar sesión |
| `POST /api/v1/auth/cambiar-password` | Cambio de contraseña |

Implementación: `src/api/authModulo.service.ts` · `src/services/authService.ts`

### Usuarios seed (después de migración SQL)

Contraseña inicial = valor de `Identificacion` (login). Se migra automáticamente a PBKDF2 en el primer acceso.

| Login (`Identificacion`) | Rol |
|---|---|
| `admin` | Administrador |
| `nutricionista` | Nutricionista |
| `cocinero` | Proveedor |
| `enfermera` | Enfermera |

Ver [docs/MIGRACION_SQL_SERVER.md](../docs/MIGRACION_SQL_SERVER.md) para el listado completo.

Guards de ruta: `RequireAuth`, `RequireModuleAccess`, `RequireAdmin`, `RequireDietasRuta` en `src/features/autenticacion/components/`.

## Capa API global (`src/api/`)

Cliente Axios único con `withCredentials: true` para cookies de sesión.

Documentación de endpoints:

- Compartidos: [backend/FRONTEND-API-GUIDE.md](../backend/FRONTEND-API-GUIDE.md)
- Dietas: [backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md](../backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md)
- Encuestas: [backend/Bital.ApiNegocio/README-ENDPOINTS-ENCUESTAS.md](../backend/Bital.ApiNegocio/README-ENDPOINTS-ENCUESTAS.md)

```typescript
import { getAtencionesHospitalarias, searchPacientes } from "@/api"
import { loginModulo } from "@/api/authModulo.service"
```

| Archivo | Contenido |
|---|---|
| `src/api/client.ts` | Instancia Axios + manejo de errores + redirect 401 |
| `src/api/config.ts` | Base URL y health URL |
| `src/api/authModulo.service.ts` | Login, logout, sesión, cambio de contraseña |
| `src/api/pacientes.service.ts` | Búsqueda de pacientes |
| `src/api/atenciones.service.ts` | Atenciones hospitalarias |
| `src/api/health.service.ts` | Health check |

Los módulos delegan a `@/api` desde repositorios en `modules/*/api/`.

## Variables de entorno

Copiar [`.env.example`](.env.example) → `.env.local` para desarrollo.

| Variable | Default / producción | Efecto |
|---|---|---|
| `VITE_BITAL_API_BASE_URL` | `/api/v1` | Base URL del API |
| `VITE_BITAL_API_HEALTH_URL` | `/health` | URL del health check |
| `VITE_DEV_API_PROXY_TARGET` | `http://localhost:8080` | Target del proxy Vite en dev |
| `VITE_DIETAS_COCINA_API` | `true` | Repositorios HTTP en dietas-cocina |
| `VITE_ENCUESTAS_ENABLED` | `false` | Muestra/oculta módulo Encuestas en UI |
| `VITE_ENCUESTAS_API` | `false` | Repositorios HTTP en encuestas |
| `VITE_APP_VERSION` | `1.2.3` | Versión mostrada en la app |

En producción IIS las URLs son relativas (`/api/v1`, `/health`); el proxy en `public/web.config` las reenvía a `127.0.0.1:8081`.

## Patrón mock / HTTP por módulo

```typescript
// modules/dietas-cocina/api/index.ts
import.meta.env.VITE_DIETAS_COCINA_API === "true"
  ? censoRepositoryHttp
  : censoRepositoryMock
```

## Integración con backend

En producción el frontend y el API corren en el **mismo servidor IIS**:

| Componente | Binding | Acceso |
|---|---|---|
| Frontend (SPA) | `https://riosoft.clinicadelriomonteria.com:8080` | Público |
| API (Kestrel + IIS) | `http://127.0.0.1:8081` | Solo localhost |

El `web.config` del frontend hace proxy de `/api/v1/*` y `/health` al API interno.

Documentación: [backend/DEPLOYMENT-IIS-GUIDE.md](../backend/DEPLOYMENT-IIS-GUIDE.md) · [docs/PASOS-HTTPS-IIS-FRONTEND.md](../docs/PASOS-HTTPS-IIS-FRONTEND.md)

## Despliegue IIS

### Build

```bash
# Desde la raíz del monorepo (frontend + API)
pnpm build:iis

# Solo frontend
pnpm build:iis:frontend
```

Salida: `deploy/frontend/` y `deploy/apinegocio/`

### Pasos en el servidor

1. Copiar `deploy/apinegocio/` → `C:\inetpub\wwwroot\bital-api-negocio\`
2. Copiar `deploy/frontend/` → `C:\inetpub\wwwroot\bital-frontend\`
3. Sitio API: binding `http://127.0.0.1:8081` (sin acceso externo)
4. Sitio frontend: binding HTTPS puerto **8080** con certificado SSL
5. Instalar **URL Rewrite** y **ARR**; habilitar proxy
6. Verificar `web.config` en la raíz del frontend (proxy + SPA fallback)

### Verificación

```text
https://riosoft.clinicadelriomonteria.com:8080/login
https://riosoft.clinicadelriomonteria.com:8080/health   → Healthy
https://riosoft.clinicadelriomonteria.com:8080/dietas-cocina/inicio
```

Recargar con F5 en rutas profundas para confirmar el fallback SPA.

## Alias de importación

Vite resuelve `@/` hacia `src/`:

```typescript
import { Button } from "@/components/ui/button"
```
