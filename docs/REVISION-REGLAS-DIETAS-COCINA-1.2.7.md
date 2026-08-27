# Revisión de reglas y cambios — Dietas y Cocina v1.2.7

**Versión:** RioSoft 1.2.7 — 2026-08-26  
**Propósito:** Documento de referencia para validar que las reglas de negocio, la separación de estados y los procesos automáticos están implementados de forma coherente en backend, frontend y reportes. Usar como checklist antes de desplegar o cuando surja una duda operativa.

---

## Tabla de contenidos

1. [Resumen de lo implementado en 1.2.7](#1-resumen-de-lo-implementado-en-127)
2. [Estados de una dieta](#2-estados-de-una-dieta)
3. [Ventanas de tiempo operativas](#3-ventanas-de-tiempo-operativas)
4. [Cancelación manual](#4-cancelación-manual)
5. [Salida clínica, cancelada y sostenida](#5-salida-clínica-cancelada-y-sostenida)
6. [Visibilidad en cocina y reporte del proveedor](#6-visibilidad-en-cocina-y-reporte-del-proveedor)
7. [Procesos automáticos del sistema](#7-procesos-automáticos-del-sistema)
8. [Procesos manuales (usuario)](#8-procesos-manuales-usuario)
9. [Reporte Excel del proveedor](#9-reporte-excel-del-proveedor)
10. [KPIs, dashboards y reportes](#10-kpis-dashboards-y-reportes)
11. [Etiquetas y logística](#11-etiquetas-y-logística)
12. [Validaciones clínicas y catálogo](#12-validaciones-clínicas-y-catálogo)
13. [Checklist de revisión](#13-checklist-de-revisión)
14. [Decisiones intencionales](#14-decisiones-intencionales)
15. [Archivos clave y pruebas](#15-archivos-clave-y-pruebas)
16. [Ejemplos prácticos paso a paso](#16-ejemplos-prácticos-paso-a-paso)

---

## 1. Resumen de lo implementado en 1.2.7

### Nuevo

| Funcionalidad | Descripción |
|---|---|
| **Reporte Excel cocina** | `GET /api/v1/dietas-cocina/cocina/reporte?formato=xlsx` — generado en servidor con MiniExcel, respeta filtros activos de la pantalla |
| **Separación Salida clínica / Cancelada** | KPIs, filtros, badges, dashboards, reportes y Excel distinguen las tres categorías: salida clínica cancelada, cancelada manual, salida clínica sostenida |
| **Salida clínica sostenida** | Dieta activa cuyo paciente egresó **fuera** del límite de novedades; el proveedor sigue el flujo normal |
| **Consistencia «Líquido»** | Disponible en solicitud, novedad y asignación de consistencia |
| **Reingreso HIS** | Dietas canceladas automáticamente por salida clínica se reactivan al volver el paciente al censo |

### Corregido (highlights)

- Cocina y reporte **no muestran** dietas canceladas en Guardado/Solicitada que nunca llegaron a Confirmada
- Etiquetas «Salida clínica» vs «Cancelada» alineadas en toda la app (incl. cocina, que antes ignoraba observaciones)
- Reporte Excel: clasificación de devoluciones, filtro consistencia, búsqueda por cédula/orden, hojas vacías con encabezados
- Descargas Firefox (Excel, CSV, PDF) y mensajes de error legibles en 403
- KPIs nutricionista alineados con censo único (sin duplicados legados)
- Deduplicación paciente/comida en censo, dietas y dashboards

---

## 2. Estados de una dieta

### Flujo principal

```text
Pendiente → Guardado → Solicitada → Confirmada → EnPreparacion → ListaEnvio
    → EnRuta → Entregada → Consumida / NoConsumida / Devuelta
                    ↘ Cancelada (en varios puntos, según reglas)
```

### Grupos usados en reglas

| Grupo | Estados | Uso |
|---|---|---|
| **Sin solicitud** | `Pendiente` | Paciente en censo, aún no pidió dieta |
| **Cancelación normal** | `Guardado`, `Solicitada` | Cancelable por cualquier rol con ventana abierta |
| **Cancelación tardía** | `Confirmada`, `EnPreparacion`, `ListaEnvio` | Solo **Administrador** + aceptación de facturación |
| **Dieta solicitada** | Guardado + Solicitada + Confirmada + EnPreparacion + ListaEnvio | Comprometida con cocina o en camino |
| **Activos en cocina** | Confirmada … Devuelta | Visible en pantalla cocina si cumple regla de compromiso |
| **Novedad permitida** | Guardado, Solicitada, Confirmada, EnPreparacion, Devuelta | Puede registrar novedad clínica |
| **Etiqueta permitida** | Confirmada, EnPreparacion, ListaEnvio, EnRuta, Entregada | Puede generar etiqueta |

### Desde `EnRuta` en adelante

- **No** se cancela por salida clínica automática
- La bandeja se cierra por **devolución** (rechazo o recogida), no por egreso HIS

---

## 3. Ventanas de tiempo operativas

Configuración por comida en `TiemposComida` (HoraPreparacion, HoraCierre, HoraEntrega).

| Regla | Condición |
|---|---|
| **Ventana de novedades abierta** | Config activa **y** `HoraPreparacion ≤ ahora ≤ HoraCierre` (soporta cruce de medianoche) |
| **Ventana para fecha operativa futura** | Siempre abierta (carga anticipada) |
| **Ventana para fecha operativa pasada** | Siempre cerrada |
| **Ventana de solicitud (modo normal)** | Igual que ventana de novedades |
| **Ventana de solicitud (carga anticipada)** | Desde HoraPreparacion hasta **HoraEntrega** |

### Implicaciones

- **Dentro del límite de novedades:** cocina aún no «cerró» el turno clínico; cancelaciones normales permitidas; salida clínica **cancela** dietas solicitadas (evita desperdicio).
- **Fuera del límite:** cocina ya inició producción aunque el proveedor no haya cambiado estados; cancelar dietas solicitadas = **cancelación tardía** (solo Admin); salida clínica **sostiene** la dieta (no la cancela).

### Parámetros de ejemplo (Almuerzo)

Los ejemplos de este documento usan esta configuración ficticia pero realista:

| Parámetro | Valor | Significado operativo |
|---|---|---|
| HoraPreparacion | 06:00 | Abre solicitud / novedades |
| HoraCierre | 10:00 | **Límite de novedades** — después cocina ya produce |
| HoraEntrega | 12:30 | Fin de distribución (modo carga anticipada) |

```text
06:00          10:00                    12:30
  |--- ventana ABIERTA ---|--- CERRADA ---|
  Solicitar / cancelar      Solo Admin (tardía)
  normal                    Salida clínica → SOSTENER
```

---

## 4. Cancelación manual

### Resolución del tipo (`ResolverTipoCancelacion`)

```
SI ventana abierta Y estado ∈ {Guardado, Solicitada}
  → Cancelación NORMAL

SI NO es dieta solicitada
  → NO cancelable (null)

SI rol = Administrador
  → Cancelación TARDÍA (marca CancelacionTardia = true)

SI NO
  → NO cancelable
```

### Qué implica cada tipo

| Tipo | Quién | Facturación | Visible en cocina si cancela |
|---|---|---|---|
| **Normal** | Cualquier rol autorizado | No | Solo si nunca llegó a Confirmada → **NO aparece** en cocina |
| **Tardía** | Solo Administrador | Sí (`CancelacionTardia`) | **Sí aparece** (estuvo comprometida) |

### Reactivación manual

- Desde menú de acciones en dieta **Cancelada**: «Solicitar dieta» o «Dejar sin solicitud»
- Cancelaciones **manuales** no se revierten automáticamente al reingreso HIS
- Cancelaciones por **Sistema** (salida clínica) sí se revierten al reingreso (ver §7)

---

## 5. Salida clínica, cancelada y sostenida

### Fuente de verdad HIS

- Solo se considera egreso si `INGRESOS.IngInSlC = 'S'`
- Consulta **por documento** (`MPTDoc` + `MPcedu`) + `IngCsc`
- **Ausencia en snapshot de censo NO cancela** (protección ante censo incompleto, TMPFAC, etc.)
- Si falla la consulta HIS → **no se cancela nada** automáticamente
- Se ignoran ingresos con reingreso posterior (IngCsc mayor)

### Tres categorías en UI/KPIs/reportes

| Categoría | Estado DB | Etiqueta UI | Criterio |
|---|---|---|---|
| **Salida clínica** | `Cancelada` | «Salida clínica» | Cancelada + observaciones/flag de egreso HIS |
| **Cancelada manual** | `Cancelada` | «Cancelada» | Cancelada sin patrón de salida clínica |
| **Salida clínica sostenida** | Activa (Confirmada, etc.) | «Salida clínica sostenida» / badge «Se envía» | `SalidaClinicaSostenida = true` y NO cancelada |

### Detección de salida clínica (`EsObservacionSalidaClinica`)

Incluye texto con: «salida clínica», `IngInSlC=S`, «egreso del paciente», «egresado del censo», etc.

**Excluye** el texto de sostenida: *«Salida clínica fuera del límite de novedades…»*

Frontend centralizado en `labelEstadoOperativo.ts` — misma lógica que backend.

### Comportamiento según ventana

| Situación | Ventana | Acción automática |
|---|---|---|
| Dieta `Pendiente` + egreso | Cualquiera | **Cancelar** |
| Dieta solicitada (Guardado…ListaEnvio) + egreso | **Abierta** | **Cancelar** (+ `CancelacionTardia` si Confirmada+) |
| Dieta solicitada + egreso | **Cerrada** | **Sostener** (`SalidaClinicaSostenida = true`, estado NO cambia) |
| Dieta `EnRuta`+ | Cualquiera | **No cancelar** por egreso |

**Ejemplo (Merienda noche):** límite novedades 15:00, egreso 17:10 con dieta confirmada (orden #157) → **sostenida**, badge «enviar (asume la clínica)», cocina sigue. **No** debe quedar «Salida clínica» cancelada ni bloquear el checklist.

Si se canceló por error (p. ej. hora del servidor distinta a Colombia), el sync corrige automáticamente al sostener.

### Reingreso (`IngInSlC = N`, paciente vuelve al censo)

| Ventana | Estado al cancelar | Estado tras reactivación |
|---|---|---|
| **Abierta** | Confirmada / EnPreparacion / ListaEnvio | **Confirmada** (retoma cocina) |
| **Abierta** | Guardado / Solicitada | Mismo estado |
| **Abierta** | Otros | **Pendiente** |
| **Cerrada** | Cualquiera (comprometida o no) | **Pendiente** — cocina ya cerró; **no** vuelve a «En gestión» |

- Solo reactiva si `ModificadoPor = Sistema` o trazabilidad `dieta_cancelada_egreso`
- Cancelaciones **manuales** no se revierten
- Al volver al censo: limpia `SalidaClinicaSostenida = false`
- Si ya se reactivó mal fuera de ventana, el próximo sync corrige a Pendiente y quita la orden de cocina

---

## 6. Visibilidad en cocina y reporte del proveedor

### Regla central: `EstuvoComprometidaConCocina`

```
SI estado = Cancelada
  → visible SOLO SI OrdenCocinaId existe O CancelacionTardia = true

SI NO
  → visible SI estado ∈ {Confirmada, EnPreparacion, ListaEnvio, EnRuta,
                         Entregada, Consumida, NoConsumida, Devuelta}
```

### Consecuencia clave (decisión de negocio)

> Una dieta cancelada desde **Guardado** o **Solicitada** (nunca confirmada) **NO aparece** en Preparación de dietas ni en el Excel del proveedor.

### Filtros adicionales (reporte y mapper cocina)

Además de la regla anterior, la fila debe tener:
- Tipo de dieta asignado (`TipoDietaId` o `DescripcionDieta`)
- Consistencia obligatoria si la comida la requiere (no meriendas)

### Orden en listados

- **Activas primero**, canceladas al final
- Orden estable: pabellón → habitación → paciente → id

---

## 7. Procesos automáticos del sistema

> **No hay jobs/cron en el backend.** La automatización se dispara por llamadas al API (principalmente sync de censo) y efectos colaterales en confirmación/cancelación.

### 7.1 Sync de censo HIS

| Aspecto | Detalle |
|---|---|
| **Disparador** | Frontend: cada **15 s** (`SincronizarCocinaDesdeDietas`) + al recuperar foco de ventana + botón «Actualizar censo» + tras confirmar/cancelar |
| **Endpoint** | `GET /api/v1/dietas-cocina/censo?fecha=&comida=` |
| **Autor sistema** | `ModificadoPor = "Sistema"` |

**Qué hace en cada sync:**

1. Lee pacientes hospitalizados del HIS (Hosvital, read-only)
2. Crea filas `Pendiente` para pacientes nuevos
3. Actualiza ubicación (pabellón, cama, servicio)
4. Deduplica: una fila por paciente + comida + día
5. **Cancela o sostiene** dietas por salida clínica (`IngInSlC=S`) — ver §5
6. **Reactiva** dietas canceladas por Sistema si el paciente reaparece
7. Limpia flag `SalidaClinicaSostenida` si el paciente volvió
8. Conserva filas vigentes aunque falten en un snapshot puntual
9. Estadísticas: canceladas no cuentan en totales operativos

**Protecciones:**

- Censo vacío → no cancela masivamente
- Error al consultar `IngInSlC` → omite cancelación automática (log warning)
- Paciente ausente del snapshot pero sin `IngInSlC=S` → **conserva** la dieta

### 7.2 Sync cocina ← dietas (frontend)

| Aspecto | Detalle |
|---|---|
| **Intervalo** | 15 s (mismo timer que censo) |
| **Componente** | `SincronizarCocinaDesdeDietas.tsx` |
| **Qué hace** | Remapea filas de dietas → órdenes de cocina; filtra con `estuvoComprometidaConCocina` |

### 7.3 Al confirmar dieta(s)

| Acción | Automático |
|---|---|
| Crear orden de cocina | Sí, si no existe `OrdenCocinaId` (`CrearOrdenAsync`) |
| Reutilizar orden existente | Sí, si hay orden no cancelada del mismo turno |
| Validar tarifa vigente | Sí |
| Refresh censo | Sí (frontend solicita sync) |

### 7.4 Al cancelar dieta(s)

| Acción | Automático |
|---|---|
| Marcar `CancelacionTardia` | Sí, si aplica |
| Cancelar orden de cocina | Solo si **todas** las dietas de la orden quedaron canceladas (no si orden ya Completada/Cancelada) |
| Reactivar dietas canceladas por salida clínica | **No** al cancelar orden manualmente |

### 7.5 Propagación estado orden ↔ dietas

| Evento orden | Efecto en dietas |
|---|---|
| Orden → Completada | Dietas → ListaEnvio |
| Orden → Despachada | Dietas → EnRuta |
| Orden → EnPreparacion | Dietas → EnPreparacion |

### 7.6 Reloj UI (ventanas)

- Formularios de solicitud/novedad y dashboard nutricionista: timer **60 s** para recalcular si ventana abierta/cerrada
- No modifica datos; solo UI

### 7.7 Al arrancar API

- Seed de permisos faltantes en roles de sistema (`RolModuloDefaultsSeed`)
- No es específico de dietas pero afecta acceso a rutas nuevas (p. ej. `ExportarReportes`)

### 7.8 Persistencia local (frontend, modo API)

- Estado del ciclo de bandejas en `localStorage` — se descarta al cambiar de día operativo
- Filas operativas persistidas localmente para resiliencia offline parcial

---

## 8. Procesos manuales (usuario)

| Acción | Rol típico | Endpoint / UI |
|---|---|---|
| Solicitar / guardar dieta | Enfermera, Nutricionista | `POST .../solicitud` — valida ventana |
| Confirmar (individual/masivo) | Nutricionista | `POST .../confirmar`, `.../bulk/confirmar` |
| Cancelar | Según tipo | `POST .../cancelar` |
| Reactivar cancelada | Enfermera/Nutricionista | `POST .../reactivar` o vía solicitud |
| Registrar novedad | Enfermera/Nutricionista | `POST .../novedad` |
| Asignar consistencia masiva | Nutricionista | UI Gestión de dietas |
| Flujo cocina (prep, lista, etiqueta, despacho) | Proveedor | UI Preparación de dietas |
| Generar/imprimir etiquetas PDF | Proveedor, Enfermera | `POST .../etiquetas/pdf` |
| Recepción / entrega / devolución | Enfermera | Flujos de etiquetas |
| Descargar Excel cocina | Nutricionista, Proveedor | Botón en Preparación de dietas |
| Actualizar censo | Cualquier rol con acceso | Botón «Actualizar censo» |

---

## 9. Reporte Excel del proveedor

### Acceso

- **Endpoint:** `GET /api/v1/dietas-cocina/cocina/reporte`
- **Parámetros:** `fecha`, `comida`, filtros de pantalla (`pabellon`, `habitacion`, `tipoDieta`, `consistencia`, `estadoCocina`, `seguimiento`, `soloAislados`, `busqueda`), `formato=xlsx`
- **Permiso:** `RutaDietas.ExportarReportes`

### Hojas

| Hoja | Contenido | Notas |
|---|---|---|
| **Resumen** | KPIs del turno: activas, en gestión, listas, tránsito, aislamiento, alergias, salidas clínicas, canceladas manuales, sostenidas | Totales sobre filas filtradas |
| **Producción** | Agrupación tipo dieta × consistencia | **Solo activas** — lo que cocina debe preparar |
| **Bandejas** | Detalle fila a fila: estado visible, seguimiento, alertas, flags | Canceladas al final; incluye «Salida clínica: enviar (asume la clínica)» |

### Alineación con pantalla

- Mismos filtros que `CocinaProveedorView`
- Clasificación devoluciones: «Rechazada» vs «Recogida» según motivo y si `EntregadaEn` existe (igual que UI)
- Filtro consistencia compara **valor crudo** (`liquido`, `blanda`, etc.), no etiqueta «No aplica»
- Búsqueda: paciente, documento, habitación, id, nº orden, código etiqueta
- Sin resultados: hojas con encabezados (no rompe MiniExcel)

---

## 10. KPIs, dashboards y reportes

### Gestión de dietas (KPIs barra superior)

Cuentan sobre lista deduplicada por paciente+comida, usando **estado visible**:
- Pendientes, confirmadas, novedades
- **Salidas clínicas** (canceladas por egreso)
- **Canceladas** (manuales)
- **Salidas clínicas sostenidas** (activas con flag)

### Preparación de dietas (KPIs proveedor)

Separados:
- `salida_clinica` → cancelada por egreso
- `cancelada` → cancelada manual
- Total activas **excluye** todas las canceladas

### Dashboard nutricionista

| KPI | Cálculo |
|---|---|
| Pacientes activos | Filas no canceladas del turno |
| Salidas clínicas | `esSalidaClinicaCancelada` |
| Canceladas | `esCanceladaManual` |
| Sostenidas | `esSalidaClinicaSostenida` — variante `muted` si valor = 0 |
| Fuera de horario | `cancelacionTardia = true` |

Donut de estados usa `labelEstadoDietaVisible` — incluye las tres categorías distintas.

### Reportes de periodo (nutricionista / proveedor)

Hallazgos separados:
- `dietas_salida_clinica`
- `dietas_canceladas`
- `dietas_sostenidas_salida_clinica`

Costos de producción incluyen dietas sostenidas (activas en flujo).

### Deduplicación

Clave: `fecha | comida | documento` — prefiere fila no cancelada o estado más avanzado.

---

## 11. Etiquetas y logística

| Regla | Detalle |
|---|---|
| Generar etiqueta | Solo estados aptos (Confirmada → Entregada) |
| Clasificación vs censo | `clasificarEtiquetaCenso.ts`: `enFlujo` si hay fila activa |
| Devolución rechazada | Antes de entrega al paciente (`esRechazoAntesEntrega`) |
| Devolución recogida | Post-entrega (`esRecogidaPostEntrega`) |
| PDF etiquetas | Servidor QuestPDF 168×88 mm + QR |

---

## 12. Validaciones clínicas y catálogo

| Validación | Cuándo |
|---|---|
| Tipo de dieta obligatorio | Solicitud, novedad, confirmación |
| Consistencia obligatoria | Todas las comidas **excepto** meriendas (MediaNueve, Onces, MediaNoche) |
| Aislamiento → observación | Si `Aislado = true` |
| Alergias → texto | Si `Alergico = true` |
| Tarifa vigente | Al confirmar, según catálogo y comida |
| Ventana de solicitud | API rechaza guardar fuera de ventana |

### Consistencias disponibles

Incluye **Líquido** además de las demás del catálogo.

---

## 13. Checklist de revisión

Usar esta lista para validar en ambiente de prueba antes de producción.

### Salida clínica

- [ ] Paciente con `IngInSlC=S` **dentro** de ventana → dieta solicitada se **cancela** y muestra «Salida clínica»
- [ ] Paciente con `IngInSlC=S` **fuera** de ventana → dieta solicitada se **sostiene** (badge «Se envía»), NO cancelada
- [ ] Dieta `Pendiente` + egreso → cancelada en cualquier ventana
- [ ] Dieta `EnRuta` + egreso → **no** se cancela automáticamente
- [ ] Paciente ausente del censo pero sin `IngInSlC=S` → dieta **conservada**
- [ ] HIS caído al consultar egreso → **ninguna** cancelación automática
- [ ] Reingreso → dieta cancelada por Sistema vuelve a Confirmada o Pendiente según caso
- [ ] Reingreso → dieta cancelada **manualmente** NO se reactiva sola

### Visibilidad cocina / reporte

- [ ] Cancelada en Guardado/Solicitada (sin orden) → **no** en cocina ni Excel
- [ ] Cancelada tardía (Confirmada+) → **sí** en cocina y Excel, al final
- [ ] Salida clínica cancelada → etiqueta «Salida clínica», no «Cancelada»
- [ ] Sostenida → aparece como activa con alerta «Salida clínica: enviar (asume la clínica)»

### Cancelación manual

- [ ] Fuera de ventana: solo Admin puede cancelar dietas solicitadas
- [ ] Cancelación tardía exige aceptación de facturación
- [ ] KPI «Canceladas» no incluye salidas clínicas
- [ ] KPI «Salidas clínicas» no incluye canceladas manuales

### Reporte Excel

- [ ] Filtros de pantalla se reflejan en las 3 hojas
- [ ] Hoja Producción solo tiene activas
- [ ] Devolución sin motivo se clasifica igual que pantalla
- [ ] Descarga funciona en Firefox
- [ ] Sin permiso → mensaje claro, no error genérico

### Sync automático

- [ ] Cada ~15 s refresca censo con pestaña visible
- [ ] Al volver foco a la ventana, sync inmediato
- [ ] Órdenes de cocina se actualizan al cambiar filas

### Dashboards

- [ ] Suma activos + salidas + canceladas = total donut (mismo universo deduplicado)
- [ ] «Salidas clínicas sostenidas» con estilo atenuado cuando = 0

---

## 14. Decisiones intencionales

Estas conductas son **por diseño**, no bugs:

1. **Reactivación manual** de dieta cancelada por salida clínica — permitida (reingreso antes de que HIS actualice)
2. **No hay cron backend** — la automatización depende del frontend conectado (15 s) o del botón manual
3. **Cancelada Guardado/Solicitada oculta en cocina** — nunca comprometió producción
4. **Salida clínica sostenida sigue flujo completo** — el proveedor debe enviar y conciliar
5. **Orden de cocina no cancela/reactiva dietas por sí sola** — manda el estado de la dieta
6. **Duplicados legados en BD** — script de limpieza one-shot: `backend/scripts/08-LimpiarFilasDietasDuplicadas.sql` (`@Aplicar = 0` diagnóstico, `1` borrado)

---

## 15. Archivos clave y pruebas

### Backend

| Archivo | Responsabilidad |
|---|---|
| `Bital.Infrastructure/DietasCocina/DietasReglasNegocio.cs` | Reglas puras: ventanas, cancelación, egreso, visibilidad |
| `Bital.Infrastructure/DietasService.cs` | Sync censo, egreso, reactivación, CRUD dietas |
| `Bital.Infrastructure/DietasCocina/ReporteCocinaHelper.cs` | Filtros, etiquetas, alertas reporte |
| `Bital.Infrastructure/Services/CocinaReporteService.cs` | Generación Excel |
| `Bital.Infrastructure/Services/DashboardService.cs` | KPIs y hallazgos reportes |
| `Bital.Infrastructure/OrdenesCocinaService.cs` | Órdenes y propagación estados |
| `Bital.Infrastructure/Services/AtencionesQueryService.cs` | Censo HIS, `IngInSlC` |
| `Bital.ApiNegocio/Controllers/CocinaController.cs` | Endpoint reporte |
| `Bital.ApiNegocio/Controllers/DietasCocinaController.cs` | Censo, dietas, confirmar, cancelar |

### Frontend

| Archivo | Responsabilidad |
|---|---|
| `lib/labelEstadoOperativo.ts` | Etiquetas y clasificación salida/cancelada/sostenida |
| `cocina/lib/cocinaVisibilidad.ts` | Regla `estuvoComprometidaConCocina` |
| `cocina/lib/cocinaFiltros.ts` | Filtros estado cocina separados |
| `cocina/lib/cocinaAccionPrincipal.ts` | Mensajes acción según tipo baja |
| `lib/construirDashboardNutricionista.ts` | KPIs dashboard |
| `context/SincronizarCocinaDesdeDietas.tsx` | Timer 15 s |
| `context/DietasOperativasContext.tsx` | Sync censo, acciones API |
| `api/mappers/ordenCocina.mapper.ts` | Filtro visibilidad al mapear |
| `cocina/views/CocinaProveedorView.tsx` | UI + botón Excel |
| `inicio/components/KpiCard.tsx` | Variante `muted` para sostenidas |

### Pruebas automatizadas

| Suite | Archivos |
|---|---|
| Backend (~50 tests) | `DietasReglasNegocioSalidaClinicaTests.cs`, `ReporteCocinaHelperTests.cs`, `CocinaReporteServiceTests.cs` |
| Frontend (~126+ tests) | `labelEstadoOperativo.test.ts`, `cocinaVisibilidad.test.ts`, `cocinaFiltros.salidaClinica.test.ts`, `construirDashboardNutricionista.test.ts` |

Ejecutar:

```powershell
# Backend
dotnet test backend/Bital.UnitTests/Bital.UnitTests.csproj

# Frontend
cd frontend && pnpm test
```

---

## 16. Ejemplos prácticos paso a paso

> Todos los ejemplos asumen **Almuerzo del 26/08/2026** con ventana 06:00–10:00 (ver §3).  
> Paciente ficticio: **María López**, CC 1.234.567, Pabellón 2, Hab. 201.

---

### Ejemplo 1 — Solicitud y confirmación normal

| Paso | Hora | Acción | Estado resultante | ¿Visible en cocina? |
|---|---|---|---|---|
| 1 | 07:30 | Paciente aparece en censo (sync automático) | `Pendiente` | No |
| 2 | 07:45 | Enfermera solicita dieta blanda | `Solicitada` | No |
| 3 | 08:00 | Nutricionista confirma | `Confirmada` + `OrdenCocinaId=42` | **Sí** |
| 4 | 08:30 | Proveedor marca en preparación | `EnPreparacion` | **Sí** |

**Qué hizo el sistema solo:** paso 1 (crear fila Pendiente al sync censo); paso 3 (crear orden de cocina #42 al confirmar).

---

### Ejemplo 2 — Cancelación normal (dentro de ventana, sin llegar a cocina)

| Paso | Hora | Acción | Estado | ¿Visible en cocina? | KPI |
|---|---|---|---|---|---|
| 1 | 08:00 | Enfermera guarda borrador | `Guardado` | No | — |
| 2 | 08:30 | Enfermera cancela (ventana abierta) | `Cancelada` | **No** | Cancelada manual +1 |

**Por qué no aparece en cocina:** nunca llegó a `Confirmada`, no hay `OrdenCocinaId` ni `CancelacionTardia`.

**Observaciones:** texto libre del usuario, p. ej. *«Paciente no desea almuerzo»* → etiqueta UI: **«Cancelada»**.

---

### Ejemplo 3 — Cancelación tardía (fuera de ventana, Admin)

| Paso | Hora | Acción | Estado | ¿Visible en cocina? |
|---|---|---|---|---|
| 1 | 09:00 | Nutricionista confirma | `Confirmada`, orden #55 | **Sí** |
| 2 | 11:30 | Admin cancela + acepta facturación | `Cancelada`, `CancelacionTardia=true` | **Sí** (al final) |

**Enfermera a las 11:30:** el botón cancelar **no aparece** (solo Admin fuera de ventana).

**KPIs:** «Canceladas» +1 (manual). «Salidas clínicas» sin cambio. Costos/reportes pueden incluir cargo por cancelación tardía.

---

### Ejemplo 4 — Salida clínica DENTRO de ventana (cancela)

| Paso | Hora | Situación | Resultado |
|---|---|---|---|
| 1 | 09:00 | Dieta `Confirmada`, orden #55 | En cocina, proveedor preparando |
| 2 | 09:15 | HIS marca `IngInSlC=S` para María López | — |
| 3 | 09:15 | Próximo sync censo (~15 s) | Estado → `Cancelada` |
| 4 | — | Sistema escribe observación | *«Paciente con salida clínica»* |
| 5 | — | UI cocina | Etiqueta **«Salida clínica»**, acción deshabilitada |
| 6 | — | KPI cocina | Salidas clínicas +1 (no suma en Canceladas) |

**Flags:** `CancelacionTardia=false` (aún dentro de ventana). `ModificadoPor=Sistema`.

**Orden #55:** se cancela solo si **todas** las dietas de esa orden quedaron canceladas.

---

### Ejemplo 5 — Salida clínica FUERA de ventana (sostiene, no cancela)

| Paso | Hora | Situación | Resultado |
|---|---|---|---|
| 1 | 09:30 | Dieta `Confirmada`, orden #60 | En cocina (aún dentro de ventana) |
| 2 | 10:30 | Ventana **cerrada** (pasó HoraCierre 10:00); dieta sigue `Confirmada` | Cocina ya inició producción |
| 3 | 10:45 | HIS marca `IngInSlC=S` | — |
| 4 | 10:45 | Sync censo | Estado sigue **`Confirmada`** |
| 5 | — | Sistema marca | `SalidaClinicaSostenida=true` |
| 6 | — | Observación añadida | *«Salida clínica fuera del límite de novedades: la dieta se mantiene y el proveedor la envía»* |
| 7 | — | UI | Badge **«Salida clínica: enviar (asume la clínica)»** + estado real «En gestión» |
| 8 | — | Proveedor | Sigue flujo normal: prep → etiqueta → despacho → entrega |

**KPIs:** «Salidas clínicas sostenidas» +1. **No** suma en «Salidas clínicas» ni «Canceladas».

**Hoja Producción Excel:** **sí cuenta** esta bandeja (está activa).

---

### Ejemplo 6 — Reingreso tras salida clínica automática

**Continúa Ejemplo 4** (María cancelada a las 09:15 por Sistema, estaba `Confirmada`):

| Paso | Hora | Ventana | Resultado |
|---|---|---|---|
| 1 | 14:00 | **Abierta** | Estado → **`Confirmada`** (retoma cocina) |
| 1b | 14:00 | **Cerrada** (p. ej. 18:00, cena) | Estado → **`Pendiente`** — no aparece en cocina |
| 2 | — | Cerrada | `OrdenCocinaId` = null, observación de reingreso fuera de ventana |
| 3 | — | — | Caso Ariel: tras el fix, el próximo «Actualizar censo» corrige filas mal reactivadas |

**Si en cambio estaba `Solicitada` al cancelar y ventana abierta:** vuelve a **`Solicitada`**.  
**Fuera de ventana:** siempre **`Pendiente`**, aunque antes estuviera Confirmada.

**Cancelación manual previa:** si Enfermera canceló a las 08:00 por decisión clínica, el reingreso **no** reactiva sola.

---

### Ejemplo 7 — Paciente ausente del censo pero NO egresó (protección)

| Paso | Situación | Resultado |
|---|---|---|
| 1 | Dieta `Confirmada`, orden #70 | Normal en cocina |
| 2 | Snapshot censo no trae a María (error TMPFAC, censo parcial) | — |
| 3 | Consulta `IngInSlC` → **NO** es `'S'` | Dieta **conservada** |
| 4 | Sync censo | Sin cambios de estado |

**Log backend:** *«Ninguna dieta se cancela por salida clínica… N ausentes del snapshot se conservan»*.

---

### Ejemplo 8 — Bandeja ya despachada (`EnRuta`) + egreso

| Paso | Situación | Resultado |
|---|---|---|
| 1 | Dieta `EnRuta`, etiqueta generada | En tránsito |
| 2 | HIS marca `IngInSlC=S` | — |
| 3 | Sync censo | **No cancela** la dieta |
| 4 | Cierre | Enfermería registra **devolución** (rechazo o recogida) |

**Motivo:** desde `EnRuta` la bandeja ya salió; el cierre es logístico, no clínico-automático.

---

### Ejemplo 9 — Cómo se ven los KPIs (censo del turno)

Supón **25 pacientes** en almuerzo, lista deduplicada:

| # | Paciente | Estado visible | Cuenta en… |
|---|---|---|---|
| 1–18 | Varios | Confirmada / En gestión / Despachada… | **Activos** (18) |
| 19–21 | A, B, C | Pendiente / Sin solicitud | Activos (3) |
| 22 | D | Cancelada manual | **Canceladas** (1) |
| 23 | E | Salida clínica (cancelada) | **Salidas clínicas** (1) |
| 24 | F | Salida clínica sostenida (Confirmada) | **Sostenidas** (1) + Activos |
| 25 | G | Guardado cancelado (nunca confirmada) | **No** en cocina; en dietas puede verse como Cancelada manual |

**Dashboard nutricionista (donut):** 25 segmentos con etiquetas distintas — «Salida clínica», «Cancelada» y «Salida clínica sostenida» **no** se mezclan.

**Preparación de dietas — total activas:** 18 + 3 + 1 (sostenida) = **22** (excluye las 2 canceladas y la Guardado cancelada sin orden).

---

### Ejemplo 10 — Filtros en cocina y Excel

**Escenario:** Proveedor filtra Almuerzo, Pabellón 2, estado **«Salida clínica»**.

| Fila | Estado DB | Observaciones | ¿Aparece? |
|---|---|---|---|
| María | Cancelada | *«Paciente con salida clínica»* | **Sí** |
| Pedro | Cancelada | *«No tolera dieta»* | **No** (es cancelada manual) |
| Ana | Confirmada | *«Salida clínica fuera del límite…»* | **No** (filtro salida_clinica = canceladas; Ana es **sostenida**) |
| Luis | Cancelada en Solicitada, sin orden | *«Paciente con salida clínica»* | **No** (nunca llegó a cocina) |

**Filtro «Cancelada»:** solo Pedro (manual, y solo si estuvo comprometida con cocina).

**Excel descargado:** mismas filas que la tabla filtrada; hoja **Producción** excluye todas las canceladas.

---

### Ejemplo 11 — Línea de tiempo del sync automático

```text
09:00:00  Usuario abre Gestión de dietas (pestaña visible)
09:00:00  Sync censo #1 (carga inicial)
09:00:15  Sync censo #2 (timer 15 s)
09:00:30  Sync censo #3
          ...
09:05:00  Usuario cambia a otra app (pestaña oculta)
09:05:15  Timer dispara pero NO sync (visibilityState ≠ visible)
09:10:00  Usuario vuelve a la pestaña → sync inmediato (evento focus)
09:10:00  Si IngInSlC=S detectado → cancelación/sostenimiento aplicada
```

**Importante:** si nadie tiene la app abierta, **no hay sync automático** hasta que alguien entre o pulse «Actualizar censo».

---

### Ejemplo 12 — Devolución: Rechazada vs Recogida

| Caso | Etiqueta llegó al paciente | Motivo devolución | Etiqueta UI | Seguimiento Excel |
|---|---|---|---|---|
| A | No (`EntregadaEn` vacío) | Cualquiera / sin motivo | **Rechazada** | Rechazada |
| B | Sí | Motivo catalogado «No desea» | **Recogida** | Recogida |
| C | Sí | Motivo no catalogado | **Recogida** (manda si llegó) | Recogida |

**Alineación:** reporte y pantalla usan la misma regla (`EsRechazoAntesEntrada` / `EntregadaEn`).

---

### Ejemplo 13 — Flujo completo con salida clínica sostenida

```text
07:00  Censo → Pendiente
07:30  Solicitud → Solicitada
08:00  Confirmación → Confirmada, orden #80 creada
10:30  (fuera ventana) IngInSlC=S → SOSTENIDA, badge «Se envía»
11:00  Proveedor: lista p/ despacho
11:15  Etiqueta generada e impresa
11:45  Despacho → EnRuta
12:15  Enfermería entrega → Entregada
       Conciliación: bandeja facturable aunque paciente ya egresó
```

**Contraste:** si el egreso hubiera sido a las **09:00** (dentro ventana), paso 10:30 no existiría — la dieta se habría **cancelado** a las 09:00 y el proveedor **no** prepararía.

---

### Ejemplo 14 — Reactivación manual vs automática

| Casión inicial | Reingreso HIS | ¿Se reactiva sola? | Alternativa manual |
|---|---|---|---|
| Cancelada por Sistema (salida clínica) | Sí | **Sí** | También puede usar «Solicitar dieta» |
| Cancelada por Enfermera (manual) | Sí | **No** | Menú → «Solicitar dieta» o «Dejar sin solicitud» |
| Sostenida (`SalidaClinicaSostenida`) | Sí | Limpia flag sostenida; sigue activa | — |

---

### Ejemplo 15 — Merienda vs comida principal (consistencia)

| Comida | Tipo | Consistencia | ¿Válido? |
|---|---|---|---|
| Almuerzo | General | *(vacío)* | **No** — API rechaza |
| Almuerzo | General | Líquido | **Sí** |
| Onces (merienda) | General | *(vacío)* | **Sí** — no requiere consistencia |
| Almuerzo | General | Líquido | Aparece en Producción Excel como «General × Líquido» |

---

## Referencias

- Changelog producto: `CHANGELOG.md` — sección [1.2.7]
- Manual técnico general: `docs/MANUAL-TECNICO.md`
- **Ejemplos y checklist de reglas:** `docs/REVISION-REGLAS-DIETAS-COCINA-1.2.7.md` (§16)
- Despliegue IIS: `backend/DEPLOYMENT-IIS-GUIDE.md`
- Limpieza duplicados BD: `backend/scripts/08-LimpiarFilasDietasDuplicadas.sql`

---

*Documento generado para revisión interna. Si alguna regla no coincide con lo observado en producción, anotar el escenario (paciente, comida, hora, estado) y contrastar con los archivos listados en §15.*
