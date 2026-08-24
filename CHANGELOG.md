# Changelog — RioSoft

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.4] — 2026-08-24

### Añadido

- Botón **Etiqueta de prueba** en Impresión de etiquetas: genera el mismo PDF del flujo real (`EtiquetaLabelFace` + html2canvas + jsPDF).

### Cambiado

- Tipografía de etiqueta térmica: valores en mayúsculas con el mismo peso que el código de etiqueta.
- Checklist de cocina: el detalle usa el estado del contexto (no el snapshot del GET) para evitar que el tick se desmarque.

### Corregido

- Sync de checklist: fusión con lo local, no reemplazo; se ignora el poll mientras hay PATCH en vuelo.
- Build IIS: propiedades duplicadas `codigo`/`qrPayload` en la etiqueta de prueba.

## [1.2.3] — 2026-08-23

### Añadido

- Búsqueda en topbar con sugerencias en vivo (rutas y acciones del módulo).
- Sincronización de tiempos de comida desde API hacia `localStorage` al entrar a Dietas y Cocina, para alinear solicitud/novedades con Parámetros.

### Cambiado

- Gestión de dietas: filtros siempre en cliente sobre el censo; filtro de ubicación por pabellón; orden estable (“Sin solicitud” primero, luego por último cambio).
- Horas en UI en formato 12 h (a. m. / p. m.) en ventanas, turnos y actividad reciente.
- Servicio clínico: el pabellón manda en especialidades (p. ej. UCI) frente a códigos genéricos del HIS.

### Corregido

- Ventana de solicitud: tras el cierre del día muestra “Ventana cerrada” en lugar de “Abre en 21h…” hasta el día siguiente.
- Rangos horarios que cruzan medianoche y formato `HH:mm` (0–23) al exponer tiempos desde el API de parámetros.
- Build IIS: import type-only de `FormEvent` en topbar y búsqueda de dietas sin campo `cama` inexistente en `FilaDieta`.

## [1.2.1] — 2026-08-21

### Cambiado

- Captura PDF de etiquetas térmicas: DPI acotado a 2400 y escalas DOM/html2canvas recalculadas para no superar el tope de canvas del navegador; QR fuente a 8192 px.

### Corregido

- Filtro de censo hospitalario: se elimina el código `MPCodP = 7` en ApiConsultas e Infrastructure.
- Scripts de instalación/migración de `BitalNegocio` alineados con SQL Server 2019 y el censo Vital actual (TMPFAC, fecha mínima, INGATNACT, catálogo FCR / TiempoComida).

### Seguridad

- `appsettings.Production.json` deja de versionarse y se añade a `.gitignore`.

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

[1.2.4]: https://github.com/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/compare/v1.2.1...v1.2.3
[1.2.1]: https://github.com/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/releases/tag/v1.0.0
