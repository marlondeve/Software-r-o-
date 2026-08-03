# Changelog — RioSoft

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] — 2026-08-03

### Añadido

- Autenticación JWT con cookie de sesión segura (HTTPS, mismo origen).
- Flujo completo de etiquetas: generación, impresión, pre-entrega, entrega, devolución y escáner QR.
- Auditoría operativa del módulo Dietas y Cocina.
- Dashboards por rol (nutricionista, proveedor, enfermera) y reportes exportables (CSV).
- Roles dinámicos y matriz de permisos editable desde la UI.
- Marca comercial **RioSoft** (PWA, footer legal, Swagger).
- Build unificado IIS: `pnpm build:iis` → `deploy/frontend` + `deploy/apinegocio`.
- Manual técnico operativo (`docs/MANUAL-TECNICO.md`).

### Cambiado

- Despliegue producción: frontend HTTPS `:8080` + API interna `127.0.0.1:8081`.
- Endurecimiento de seguridad: HSTS, CSP, rate limiting en login, PBKDF2 para contraseñas.
- Paginación y mejoras UX en pantallas operativas.
- Documentación alineada al estado actual del producto.

### Corregido

- Filtro de atenciones hospitalarias (censo Vital).
- Permisos granulares de etiquetas por rol (enfermera, auxiliar cocina).
- Dimensiones y permisos de cámara en flujos de etiquetas.

## [1.0.0] — 2026-07-28

Versión base de preparación para despliegue:

- Módulo Dietas y Cocina integrado con API (`Bital.ApiNegocio`).
- Censo, solicitud, confirmación y catálogo de dietas.
- Migración SQL Server (`BitalNegocio`) y usuarios seed.
- Roles de sistema y permisos iniciales.

[1.1.0]: https://github.com/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/releases/tag/v1.0.0
