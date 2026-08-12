# Changelog — RioSoft

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.0] — 2026-08-12

### Añadido

- Scripts de instalación limpia de BD (`00-DropAndCreateDatabase`, `05-QuestionnaireBootstrap`, `06-SeedCleanInstall`, `Initialize-BitalNegocioClean.ps1`) con catálogo FCR, parámetros, 5 roles predefinidos y usuario admin inicial.
- Ruta operativa `VerBandejasPiso` y normalización de roles del módulo (`RolModuloDefaultsSeed`, migración `NormalizarRolesModuloDefault`).
- Utilidades de identificación y layout de etiquetas para impresión térmica (`textoIdentificacionEtiqueta`, conversión px/mm).

### Cambiado

- Etiquetas: tamaño de impresión 168×88 mm, QR de mayor resolución/corrección de error y escalado DOM/html2canvas para mejor legibilidad en impresoras térmicas.
- Consulta de atenciones hospitalarias (ApiConsultas / censo Vital): filtros SQL refinados, cama y asignación de servicio clínico.
- Conexiones de producción Vital: `Hosvital_Pruebas` → `Hosvital_Produccion`.
- Consistencias dietéticas por defecto alineadas a “Normal” en mocks y diálogos.

### Corregido

- Permisos de bandejas: toggles editables y mensaje en piso cuando no hay flujos operativos.
- Sidebar con doble ítem activo en rutas anidadas (`dietas` vs `dietas-tarifas`).
- Migración `AddChecklistAndParametrosOperativos` con columnas condicionales.
- Campo `servicio` eliminado de la respuesta hospitalaria (contrato limpio).

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

[1.2.0]: https://github.com/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/releases/tag/v1.0.0
