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
│   ├── modules/         # Módulos de negocio (dietas-cocina, encuestas)
│   ├── servicios/       # Servicios globales (auth mock)
│   ├── lib/             # Utilidades
│   ├── hooks/
│   ├── tipos/
│   └── estilos/
├── vite.config.ts       # Alias @/ → src/
└── components.json      # Configuración shadcn/ui
```

## Scripts

```bash
# Desde la raíz del monorepo
pnpm dev
pnpm build
pnpm lint
pnpm preview

# Desde esta carpeta
pnpm dev
pnpm build
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

La autenticación actual es mock (`src/servicios/authService.ts`). La contraseña puede ser cualquier valor no vacío.

| Correo | Acceso |
|---|---|
| `admin@clinicadelrio.com.co` | Dietas y Cocina + Encuestas + permisos de administrador |
| `dietas@clinicadelrio.com.co` | Solo Dietas y Cocina |
| `encuestas@clinicadelrio.com.co` | Solo Encuestas SIAO |
| `otro@clinicadelrio.com.co` | Dietas y Cocina + Encuestas (operador) |

Guards de ruta en `src/features/autenticacion/components/`: `RequireAuth`, `RequireModuleAccess`, `RequireAdmin`, `RequireDietasRuta`.

## Patrón de datos (mock / HTTP)

Los módulos usan repositorios con implementaciones mock y HTTP en `modules/*/api/`. El selector elige la implementación según variables de entorno:

```typescript
// modules/dietas-cocina/api/index.ts
import.meta.env.VITE_DIETAS_COCINA_API === "true" ? http : mock
```

| Variable | Efecto |
|---|---|
| `VITE_DIETAS_COCINA_API=true` | Activa repositorios HTTP del módulo Dietas y Cocina |

Crear un archivo `.env.local` en `frontend/` para activar variables en desarrollo.

## Integración con backend

El frontend consume **solo `Bital.ApiNegocio`** como punto de entrada. No debe llamar a `Bital.ApiConsultas` directamente.

Documentación del backend: [backend/README.md](../backend/README.md)

Estado actual: Dietas y Cocina opera con datos mock (y repositorios HTTP preparados). Encuestas y Administración usan mock estático sin flujos completos. La integración HTTP se activará conforme ApiNegocio exponga los endpoints de negocio.

## Despliegue IIS

1. Generar build de producción:

```bash
pnpm build
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
