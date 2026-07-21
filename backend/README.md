# Backend BITAL

API institucional de **BITAL** para Clínica del Río.

## Estado

Carpeta reservada para el backend. El frontend consume actualmente un mock de autenticación en `frontend/src/servicios/authService.ts`.

## Próximos pasos

1. Definir stack (Node.js, .NET, etc.).
2. Implementar autenticación y autorización por módulo/rol.
3. Exponer endpoints REST o GraphQL para Dietas y Cocina, Encuestas y Administración.
4. Configurar variables de entorno (`.env.example`).

## Scripts

```bash
# Desde la raíz del monorepo
pnpm dev:back

# Desde esta carpeta
pnpm dev
```
