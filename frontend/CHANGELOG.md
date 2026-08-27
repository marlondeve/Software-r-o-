# Changelog — RioSoft

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.7] — 2026-08-26

### Añadido

- Botón **Generar reporte** en Preparación de dietas: descarga Excel (.xlsx) desde el servidor con los filtros activos (estado, pabellón, búsqueda, etc.) y tres hojas — Resumen, Producción (bandejas por tipo de dieta y consistencia) y Bandejas; en modo demo genera CSV local.
- **«Salida clínica» y «Cancelada» son categorías separadas en toda la app**: KPIs de Gestión de dietas, KPIs y filtro de estado de Preparación de dietas, dashboard del nutricionista y reportes. La salida clínica usa además un badge propio (borde discontinuo) para no confundirla con una cancelación manual.
- Consistencia **«Líquido»** disponible al solicitar dieta, registrar novedad y asignar consistencia.
- Reingreso HIS (`IngInSlC = N`): dietas canceladas automáticamente por salida clínica se reactivan (`Pendiente` para solicitar, o `Confirmada` si ya estaban en cocina) y la etiqueta vuelve al flujo; cancelaciones manuales no se revierten.
- Etiqueta de estado **«Salida clínica»** (en lugar de «Cancelada») cuando la baja fue automática por HIS.
- Distintivo **«Salida clínica: enviar (asume la clínica)»** en Gestión de dietas (tabla y detalle) y en Cocina: el paciente egresó pasado el límite de novedades, la dieta conserva su estado, el proveedor la envía y la clínica asume el costo.

### Cambiado

- Versión de producto **1.2.7** (package.json, `Directory.Build.props`, `VITE_APP_VERSION`, docs).
- **Cancelar dieta pasado el límite de novedades:** solo **Administrador**, aceptando la responsabilidad de facturación, con aviso propio («cocina ya inició la producción»). Los demás roles ven el motivo del bloqueo con la hora del límite.
- Registrar novedad usa el límite de novedades estricto (la carga anticipada extiende la solicitud, no los cambios clínicos): el formulario ya no habilita un guardado que el API rechaza.
- Cancelación automática **solo** si `INGRESOS.IngInSlC = 'S'`; ausencia en el snapshot de censo no cancela ni saca del flujo.
- Cancelación por egreso limitada a estados de cocina (`Pendiente` + cancelables normal/tardía); desde `EnRuta` la bandeja se cierra por devolución.
- Una orden de cocina solo se cancela por egreso si **todas** sus dietas quedaron canceladas.
- Salida clínica ignora ingresos con reingreso posterior (`IngCsc` mayor).
- Detección de reactivación por trazabilidad (`dieta_cancelada_egreso` + autor `Sistema`), no por texto de observaciones.
- El estado de cancelación de una bandeja lo manda la dieta (la orden del API ya no cancela ni reactiva bandejas por sí sola).
- Estadísticas del censo no cuentan dietas canceladas; `totalEnCenso` usa `TotalPacientes` del API.
- Estado del ciclo de bandejas en `localStorage` se descarta al cambiar de día operativo (modo API).

### Corregido

- Al sincronizar el censo se revisan cancelaciones automáticas previas: si el paciente sigue o vuelve en censo, la dieta se reactiva al estado correcto.
- Cancelaciones automáticas del sistema anterior («egresado del censo») también se reactivan; se emparejan por cédula aunque el `PacienteId` legado difiera y no se dejan duplicados viejos en el listado.
- «Cancelada» ya no queda pegada en cocina tras un reingreso.
- «Otras dietas del paciente hoy» (detalle de dieta) también muestra «Salida clínica».
- Dashboards de enfermera y nutricionista, donut de estados, KPI y reportes usan la misma etiqueta de estado.
- **Preparación de dietas mostraba «Cancelada» en bandejas dadas de baja por salida clínica:** la tabla ignoraba las observaciones al resolver la etiqueta, así que el listado no coincidía con sus propios KPIs.
- El KPI «Salidas clínicas» de cocina solo miraba la marca del API: ahora también reconoce la baja por observaciones, igual que el resto de la app.
- En Preparación de dietas, una bandeja dada de baja por egreso decía «Esta bandeja fue cancelada»; ahora indica «Salida clínica: el paciente egresó, esta bandeja no se prepara».
- Auditoría: la acción **Reactivar** no existía en el filtro (el backend sí la registraba) y los estados de dieta se mostraban crudos (`ListaEnvio`, `EnRuta`, `NoConsumida`); ahora tienen etiqueta legible.
- Descargas (Excel de cocina, CSV de auditoría, PDF de etiquetas): el enlace no se adjuntaba al documento, por lo que Firefox no descargaba nada. Si el servidor rechaza la descarga, ahora se muestra su mensaje real (p. ej. falta de permiso) y no «Request failed with status code 403».
- **Cocina y reporte del proveedor mostraban dietas canceladas en Guardado/Solicitada** que nunca fueron confirmadas ni enviadas a cocina. Ahora solo entran las que llegaron a Confirmada (orden de cocina creada o cancelación tardía).
- Detección de salida clínica centralizada en un solo helper (antes duplicada en dietas, cocina y mappers, con riesgo de desincronizarse).
- Cancelar una orden de cocina ya no reactiva dietas canceladas por salida clínica.
- Paciente repetido en «Gestión de dietas» (misma cédula y comida, p. ej. «Sin solicitud» + «Despachada»): se deja una sola fila, la de estado visible más avanzado. Se empareja por cédula, no por el formato del `PacienteId`.
- KPIs de dietas y dashboard de nutrición cuentan sobre la lista sin duplicados: el total ya coincide con los registros de la tabla.
- Censo de atenciones: una fila legada con otro formato de `PacienteId` conserva su estado operativo en lugar de crear una fila nueva.
- KPIs de salida clínica y cancelación usan el estado visible, igual que el resto de los indicadores.
- Recepción del proveedor: lista con orden fijo (ya no salta al sincronizar) y filtro por ubicación (pabellón/área) para confirmar solo el área correspondiente.
- **KPIs del inicio nutricionista:** dejan de mostrar totales crudos del API (p. ej. 3545) y usan el censo único del turno, alineados con el donut (activos + salidas clínicas).
- Dieta cancelada: acciones **Solicitar dieta** y **Dejar sin solicitud** para volver a gestionarla sin esperar un reingreso HIS.
- Solicitud fuera de horario: el formulario de Gestión de dietas ya no permite Guardar con la ventana cerrada; el API también rechaza la solicitud fuera de los parámetros de la comida.
- Hora en etiquetas (pantalla y PDF): UTC de `GeneradaEn` se muestra en hora Colombia; ya no aparece `…T12:00 a. m.` por usar `fechaOperativa`.
- Cancelar dieta y ficha de detalle: muestran el **nombre** de quien solicitó la dieta y la fecha/hora reales de la solicitud (antes datos mock / cédula). El detalle no pisa el nombre al refrescar el censo; la novedad también muestra fecha/hora.
- Registrar novedad en modo API: envía motivo y cambio clínico en el contrato del backend; el tipo/consistencia sí se persisten.
- Usuarios y roles: buscador en la barra de filtros (nombre, usuario o correo).

## [1.2.6] — 2026-08-25

### Añadido

- Cancelación automática de dietas y órdenes de cocina no completadas **solo** si `INGRESOS.IngInSlC = 'S'` (salida clínica). Ausencia en el snapshot de censo no cancela.
- Orden estable de la tabla cocina (pabellón → habitación → paciente → id).
- Clasificación de etiquetas respecto al censo (`enFlujo` vs. cancelada / sin solicitud).
- Formato de hitos logísticos en reportes como **HH:MM** (backend y frontend).

### Cambiado

- Versión de producto **1.2.6** (package.json, `Directory.Build.props`, `VITE_APP_VERSION`, docs).
- Generación de etiquetas por lote: parcial tolerante (vinculación, completar, API y UI con cobertura incompleta).
- Filtro de estado cocina: un solo «En gestión» (`por_iniciar` + `en_preparacion`).
- `CrearOrdenAsync` reutiliza orden existente no cancelada; no retrocede dietas ya avanzadas y rechaza dietas canceladas.
- Censo HIS: se restaura la precedencia original del `WHERE` (`fecha sentinel OR …`); solo se excluye `IngInSlC = 'S'`, para no dejar pacientes fuera del listado.

### Corregido

- Solo se preparan y etiquetan dietas con paciente activo en censo y solicitud vigente.
- Generación por lotes: menos etiquetas “perdidas” (refs frescos, reintento, fallback de match).
- Hook condicional en flujo de devolución (`DevolucionFlowPage`).
- Typecheck de `generarEtiquetas` (predicado de tipo inválido).

## [1.2.5] — 2026-08-25

### Añadido

- PDF de etiquetas térmicas (168 × 88 mm) generado en servidor con QuestPDF + QR y logo; endpoints `POST /etiquetas/pdf` y `POST /etiquetas/pdf-prueba`.
- Modal de progreso al generar/descargar PDF en Cocina e Impresión (modo API).
- Seed de desarrollo para censo hospitalizado y órdenes listas para etiquetas (`DevSeedHospitalizadosCount`, endpoint `_test/seed-listas-para-etiquetas`).
- Reportes de **producción** (Proveedor) y **clínicos** (Nutricionista): KPIs y gráficos de **costo de comida** por día, servicio y tiempo de comida (tarifas vigentes × raciones; cancelación tardía en costo por retrasos / canc. tardía).
- Script `07-ProveedorConciliacionPermiso.sql` para BD ya instaladas (añade `ListarConciliacion` al Proveedor).
- Ensure de permisos faltantes de roles de sistema al arrancar la API (`RolModuloDefaultsSeed`).

### Cambiado

- Versión de producto **1.2.5** (package.json, `Directory.Build.props`, `VITE_APP_VERSION`, docs).
- Impresión/reimpresión en modo API usa el PDF del servidor; el mock sigue con html2canvas en cliente.
- Timeout de generación PDF ampliado (Kestrel / IIS) para lotes grandes.
- Censo hospitalario (`AtencionesQueryService`): consulta con CTE al ingreso activo más reciente por paciente, join de `TMPFAC` por `TmCtvIng`/`IngCsc` (ajustes de JuanTroaqueroDev).
- Rol **Proveedor**: acceso de consulta a **Conciliación** (`ListarConciliacion`); seeds SQL `02` / `06` actualizados.
- Reportes (producción y clínicos): layout por secciones (operación → calidad/volumen → costos), gráficas horizontales legibles, valores en **COP**, costos al final; filtro de fechas inicia en **hoy**.

### Corregido

- Errores de build/typecheck y ajustes menores de UI en impresión y reportes.

## [1.2.4] — 2026-08-24

Ver historial en commits previos al desglose detallado de 1.2.5+.

## [1.2.3] — 2026-08-23

### Añadido

- Capacidades y flujos ampliados de etiquetas / logística.

## [1.2.1] — 2026-08-20

### Añadido

- Mejoras de operación diaria en dietas-cocina.

## [1.2.0] — 2026-08-15

### Añadido

- Permisos granulares de etiquetas por rol (enfermera, auxiliar cocina).
- Dimensiones y permisos de cámara en flujos de etiquetas.

## [1.1.0] — 2026-08-01

### Añadido

- Ampliación del módulo Dietas y Cocina.

## [1.0.0] — 2026-07-28

Versión base de preparación para despliegue:

- Módulo Dietas y Cocina integrado con API (`Bital.ApiNegocio`).
- Censo, solicitud, confirmación y catálogo de dietas.
- Migración SQL Server (`BitalNegocio`) y usuarios seed.
- Roles de sistema y permisos iniciales.

[1.2.7]: https://github.com/compare/v1.2.6...v1.2.7
[1.2.6]: https://github.com/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/compare/v1.2.1...v1.2.3
[1.2.1]: https://github.com/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/releases/tag/v1.0.0
