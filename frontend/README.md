# Frontend BITAL

Aplicación web React de **BITAL** para Clínica del Río.

Documentación general del monorepo: [README.md](../README.md)

## Scripts

```bash
# Desde la raíz del monorepo
pnpm dev

# Desde esta carpeta
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

## Despliegue

El build genera `frontend/dist/` listo para IIS. Ver instrucciones en el README raíz.

## Usuarios de prueba (mock)

La contraseña puede ser cualquier valor no vacío.

| Correo | Acceso |
|---|---|
| `admin@clinicadelrio.com.co` | Dietas y Cocina + Encuestas + permisos de administrador |
| `dietas@clinicadelrio.com.co` | Solo Dietas y Cocina |
| `encuestas@clinicadelrio.com.co` | Solo Encuestas SIAO |
| `otro@clinicadelrio.com.co` | Dietas y Cocina + Encuestas (operador) |
