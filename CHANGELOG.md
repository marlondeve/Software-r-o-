# Changelog — RioSoft

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.8] — 2026-08-27

### Añadido

- **Tiempo real en Dietas y Cocina (SignalR):** hub autenticado `/hubs/dietas-cocina` que avisa a todas las sesiones abiertas tras persistir y auditar (no sustituye REST/EF ni la trazabilidad).
- Eventos de push: `FilaActualizada`, `CensoActualizado`, `OrdenActualizada`, `EtiquetasActualizadas`, `ParametrosActualizados`, `CatalogoActualizado`, `ConciliacionActualizada`, `PermisosActualizados`.
- Sync HIS en servidor (`CensoHisSyncHostedService`) con candado SQL (`sp_getapplock` por fecha+comida) compartido con `GET /censo`: un solo writer aunque haya varias pestañas o workers IIS.
- Cliente `@microsoft/signalr` en el layout del módulo: reconexión automática; **cero poll** con hub conectado; fallback de censo cada **60 s** solo si el socket está caído.
- HTTP **409** (`ConflictoEstadoOperativo`) si otro usuario ya cambió dieta, orden o etiqueta; la UI reemplaza por id o identidad (cédula+comida+fecha) y no concatena duplicados.
- Refetch en vivo de dashboards, reportes (vista), auditoría y conciliación al recibir eventos; permisos y parámetros se recargan en sesiones abiertas.
- Reloj de ventanas operativas a **1 s** (Dietas, solicitud/novedad, dashboard nutricionista).
- WebSockets habilitados en `web.config` de ApiNegocio (requisito IIS).

### Cambiado

- Versión de producto **1.2.8** (package.json, `Directory.Build.props`, `VITE_APP_VERSION`, docs).
- El poll de censo cada **15 s** del navegador deja de ser el writer: el hosted service sincroniza el HIS; `GET /censo` queda para carga inicial, botón «Actualizar» y fallback.
- «Hoy» operativo, textos embebidos y prefijo de código de etiqueta usan día/hora **Colombia**; los instantes siguen guardándose en **UTC** (`DateTime.UtcNow`).
- Parsers del front (`auditoria`, `catálogo`, actividad enfermería) interpretan ISO sin zona como UTC vía `parsearFechaApi`.

### Corregido

- Residuales que mostraban hora UTC o tomaban el día UTC como «hoy» (catálogo/tarifas, marcas de tiempo, códigos de etiqueta tras las 19:00 COT).

## [1.2.7] — 2026-08-26

### Añadido

- Reporte Excel de **Preparación de dietas** generado en servidor (`GET /dietas-cocina/cocina/reporte?formato=xlsx`), con los filtros activos de la pantalla y tres hojas: **Resumen** (KPIs del turno, bandejas con aislamiento y con alergias), **Producción** (bandejas por tipo de dieta y consistencia, solo activas — es lo que cocina debe preparar) y **Bandejas** (estado, ubicación, paciente, dieta, aislamiento, alergias, alertas, etiqueta y orden de cocina, con las bajas al final).
- **«Salida clínica» y «Cancelada» son categorías separadas en toda la app**: KPIs de Gestión de dietas, KPIs y filtro de estado de Preparación de dietas, dashboard del nutricionista, reportes y el Excel del proveedor. La salida clínica usa además un badge propio (borde discontinuo) para no confundirla con una cancelación manual.
- Consistencia **«Líquido»** disponible al solicitar dieta, registrar novedad y asignar consistencia.
- Reingreso HIS (`IngInSlC = N`): dietas canceladas automáticamente por salida clínica se reactivan (`Pendiente` para solicitar, o `Confirmada` si ya estaban en cocina) y la etiqueta vuelve al flujo; cancelaciones manuales no se revierten.
- Etiqueta de estado **«Salida clínica»** (en lugar de «Cancelada») cuando la baja fue automática por HIS.
- Distintivo **«Salida clínica: enviar (asume la clínica)»** en censo, detalle y cocina para la dieta cuyo paciente egresó pasado el límite de novedades: conserva su estado real, el proveedor la envía y la clínica asume el costo.

### Cambiado

- Versión de producto **1.2.7** (package.json, `Directory.Build.props`, `VITE_APP_VERSION`, docs).
- **El límite de novedades manda sobre la cancelación:** pasada esa hora cocina ya inició la producción aunque el proveedor no haya movido el estado, así que cancelar cualquier dieta solicitada queda reservado al **Administrador** con aceptación de facturación. **Salida clínica pasada la ventana** ya no cancela la dieta solicitada: se sostiene en el flujo (`SalidaClinicaSostenida`) para que el proveedor la envíe. **Dentro del límite**, la salida clínica **sí cancela** para evitar desperdicio. Reportes, dashboard nutricionista y hallazgos distinguen **«Salida clínica»** (cancelada) y **«Salida clínica sostenida»** (activa en producción); los costos incluyen las sostenidas.
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
- Hallazgo de reportes: el texto distinguía salidas clínicas de cancelaciones manuales pero el número destacado sumaba ambas. Ahora son dos hallazgos, cada uno con su propia cantidad.
- Auditoría: la acción **Reactivar** no existía en el filtro (el backend sí la registraba) y los estados de dieta se mostraban crudos (`ListaEnvio`, `EnRuta`, `NoConsumida`); ahora tienen etiqueta legible.
- **Reporte del proveedor podía fallar (500) o clasificar distinto que la pantalla:** una devolución sin motivo registrado rompía el catálogo de motivos, y las devueltas sin motivo catalogado no entraban en «Rechazadas» ni en «Recogidas». Ahora la clasificación replica la de la pantalla (manda el motivo y, si no está catalogado, si la bandeja llegó al paciente).
- Reporte del proveedor: el filtro de consistencia comparaba contra el texto de presentación («No aplica» / «Sin asignar») en vez del valor guardado, y la búsqueda no cubría cédula ni número de orden. Sin resultados, las hojas conservan encabezados en lugar de romper el archivo.
- **Cocina y reporte del proveedor mostraban dietas canceladas en Guardado/Solicitada** que nunca fueron confirmadas ni enviadas a cocina. Ahora solo entran las que llegaron a Confirmada (orden de cocina creada o cancelación tardía).
- Descargas (Excel de cocina, CSV de auditoría, PDF de etiquetas): el enlace no se adjuntaba al documento, por lo que Firefox no descargaba nada. Si el servidor rechaza la descarga, ahora se muestra su mensaje real (p. ej. falta de permiso) y no «Request failed with status code 403».
- Detección de salida clínica centralizada en un solo helper (antes duplicada en dietas, cocina y mappers, con riesgo de desincronizarse).
- Cancelar una orden de cocina ya no reactiva dietas canceladas por salida clínica.
- Paciente repetido en «Gestión de dietas» (misma cédula y comida, p. ej. «Sin solicitud» + «Despachada»): se deja una sola fila, la de estado visible más avanzado. Se empareja por cédula, no por el formato del `PacienteId`, y el backend tampoco devuelve la fila legada duplicada.
- KPIs de dietas y dashboard de nutrición cuentan sobre la lista sin duplicados: el total ya coincide con los registros de la tabla.
- Censo de atenciones: una fila legada con otro formato de `PacienteId` conserva su estado operativo en lugar de crear una fila nueva.
- KPIs de salida clínica y cancelación usan el estado visible, igual que el resto de los indicadores.
- Recepción del proveedor: lista con orden fijo (ya no salta al sincronizar) y filtro por ubicación (pabellón/área) para confirmar solo el área correspondiente.
- **Censo incompleto (decía «22 pacientes» y mostraba 3):** `INGRESOS.IngCsc` es un consecutivo **por paciente** (vale 1 en casi todos), no un id global. Se dejó de usar como identidad suelta, así que ya no se colapsan pacientes distintos en una sola fila ni se emparejan dietas con el paciente equivocado.
- Salida clínica: se consulta siempre por documento (`MPTDoc` + `MPcedu`) y el ingreso se registra como «documento#IngCsc». Antes un `IngCsc IN (…)` sin documento alcanzaba ingresos de otras personas y podía cancelar dietas de pacientes activos.
- **KPIs del inicio nutricionista (3545 vs donut de 25):** el API contaba filas crudas de BD (duplicados legados). El dashboard usa el censo único del turno: «Pacientes activos» = vigentes (21), «Salidas / canceladas» = 4, y el donut suma 25. Ya no se mezclan totales históricos encima del periodo operativo.
- **Reportes clínicos/producción inflados (p. ej. 12.408 dietas / 12.230 sin solicitud):** misma causa: filas duplicadas en BD. El reporte cuenta una dieta por paciente, comida y día; costos y «estado de dietas» usan esa lista.
- Limpieza one-shot de duplicados en `dietas.FilasDietas`: script `backend/scripts/08-LimpiarFilasDietasDuplicadas.sql` (diagnóstico con `@Aplicar = 0`, borrado con `1`). Conserva orden/etiqueta y el estado más avanzado; reasigna eventos y conciliación.
- Dieta **cancelada**: desde el menú de acciones se puede **Solicitar dieta** (abre el formulario y reactiva al guardar) o **Dejar sin solicitud** (vuelve a Pendiente sin pedirla todavía).
- Solicitud fuera de los parámetros de tiempo: en Gestión de dietas se podía guardar aunque la ventana estuviera cerrada (la vista previa de enfermería sí bloqueaba). Ahora Guardar queda deshabilitado y el API valida la ventana de la comida.
- Hora en etiquetas (pantalla y PDF): UTC de `GeneradaEn` se muestra en hora Colombia; ya no aparece `…T12:00 a. m.` por usar `fechaOperativa`.
- Diálogo **Cancelar dieta** y ficha de detalle: muestran el nombre de quien solicitó la dieta y la fecha/hora reales (antes mock / cédula en `SolicitadoPor`). El lookup cubre usuario de login, no solo dígitos; `SolicitadoEn` se serializa como UTC.
- **Registrar novedad:** el API acepta el payload del formulario (motivo + cambio de dieta/consistencia/alergias), aplica el cambio clínico y no responde 400/500 por `tipoNovedad` obligatorio.
- Usuarios y roles: buscador por nombre, usuario o correo (filtro en API con la paginación).

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

[1.2.8]: https://github.com/compare/v1.2.7...v1.2.8
[1.2.7]: https://github.com/compare/v1.2.6...v1.2.7
[1.2.6]: https://github.com/compare/v1.2.5...v1.2.6
[1.2.5]: https://github.com/compare/v1.2.4...v1.2.5
[1.2.4]: https://github.com/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/compare/v1.2.1...v1.2.3
[1.2.1]: https://github.com/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/releases/tag/v1.0.0
