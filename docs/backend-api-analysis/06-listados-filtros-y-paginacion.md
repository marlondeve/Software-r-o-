# 06 — Listados, filtros y paginación

> **Alcance:** Tablas y listados en `dietas-cocina/` y `encuestas/`. Para cada uno: columnas, filtros UI, query params sugeridos para backend, y qué filtra hoy el frontend vs qué debería delegar al servidor.

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| **FE** | Filtrado en frontend (useMemo / función local) |
| **BE** | Debería filtrar backend (paginación server-side) |
| **Híbrido** | FE para demo; BE en producción |

---

## Módulo Dietas y Cocina

### 1. Gestión diaria de dietas (`DietasTabla`)

**Evidencia:** `dietas/components/DietasTabla.tsx`, `dietas/DietasPage.tsx`, `dietas/components/DietasFiltros.tsx`

#### Columnas

| Columna | Campo / origen | Render |
|---------|----------------|--------|
| Selección | checkbox | Selección masiva |
| Estado | `fila.estado` | `EstadoBadge` |
| Paciente | `paciente`, identificación, ubicación | Texto multi-línea |
| Servicio | `servicio` | Texto |
| Dieta | `tipoDieta` | Badge o "Sin asignar" |
| Consistencia | `consistencia` | Texto |
| Aislamiento | `aislamiento`, `aislado` | Icono/badge |
| Alergias | `alergico`, `alergias` | Indicador |
| Acciones | — | Popover: solicitud, detalle, novedad, cancelar |

#### Filtros UI

| Filtro | Estado local | Valores | Implementación |
|--------|--------------|---------|----------------|
| Comida activa | `comidaActiva` | 6 tabs (`TiempoComida`) | **FE** — `DietasComidaTabs` |
| Búsqueda | `busqueda` | Texto libre | **FE** — `filaCoincideBusqueda()` |
| Servicio | `servicio` | `todos` + servicios dinámicos | **FE** |
| Estado | `estado` | `todos` + estados dieta | **FE** |
| Solo pendientes | `soloPendientes` | boolean | **FE** — `ESTADOS_PENDIENTES` |

#### Query params sugeridos (BE)

```
GET /api/dietas-cocina/dietas
  ?comida=almuerzo
  &servicio=cardiologia
  &estado=guardado
  &busqueda=lopez
  &soloPendientes=true
  &page=1
  &pageSize=50
  &sort=paciente
  &order=asc
```

#### Paginación

| Aspecto | Actual | Recomendado |
|---------|--------|-------------|
| Paginación | No — lista completa en memoria | **BE** cursor/offset |
| Ordenamiento | Orden del array en contexto | **BE** sort param |
| Total registros | `filas.length` | `{ meta: { total, page, pageSize } }` |

---

### 2. Cocina proveedor (`CocinaTabla`)

**Evidencia:** `cocina/components/CocinaTabla.tsx`, `cocina/lib/cocinaFiltros.ts`, `cocina/components/CocinaFiltrosBar.tsx`

#### Columnas

| Columna | Campo |
|---------|-------|
| Selección | checkbox |
| Estado | `estadoCocina` + logística etiqueta (badge compuesto) |
| ID orden | `id` (enmascarado) |
| Paciente | `paciente`, edad |
| Ubicación | `pabellon`, `habitacion`, `cama` |
| Dieta / consistencia | `tipoDieta`, `consistencia` |
| Alergias | `alergias[]` | Badge destructivo |
| Aislado | `aislado` | Icono |
| Etiqueta | `etiquetaGenerada`, `etiquetaImpresa` | Icono tag |
| Acciones | Abrir detalle |

#### Filtros (`FiltrosCocina` — tipo en `types/kitchen.ts`)

| Filtro | Campo | Implementación |
|--------|-------|----------------|
| Pabellón | `pabellon` | **FE** |
| Habitación | `habitacion` | **FE** |
| Tipo dieta | `tipoDieta` | **FE** |
| Consistencia | `consistencia` | **FE** |
| Estado cocina | `estadoCocina` | **FE** |
| Seguimiento | `seguimiento: FiltroSeguimientoCocina` | **FE** — en_transito, pre_entregada, entregada, devuelta |
| Solo aislados | `soloAislados` | **FE** |
| Búsqueda | `busqueda` | **FE** |

#### Query params sugeridos (BE)

```
GET /api/dietas-cocina/ordenes
  ?comida=almuerzo
  &pabellon=Pab.+Central
  &estadoCocina=en_preparacion
  &seguimiento=en_transito
  &soloAislados=true
  &busqueda=HP02
  &page=1&pageSize=25
```

---

### 3. Etiquetas proveedor (`EtiquetasProveedorView`)

**Evidencia:** `etiquetas/components/EtiquetasFiltrosPanel.tsx`, `EtiquetasKpiGrid.tsx`

#### Filtros típicos

| Filtro | Implementación |
|--------|----------------|
| Estado etiqueta | **FE** |
| Estado logística | **FE** |
| Comida / turno | **FE** |
| Búsqueda código/paciente | **FE** |

#### Query params sugeridos

```
GET /api/dietas-cocina/etiquetas
  ?comida=cena
  &estadoLogistica=impresa
  &busqueda=LBL-9001
```

---

### 4. Conciliación (`ConciliacionTabla`)

**Evidencia:** `conciliacion/components/ConciliacionTabla.tsx`, `conciliacion/lib/conciliacionFiltros.ts`

#### Columnas

| Columna | Campo |
|---------|-------|
| Tipo / consistencia | `tipo`, `consistencia` |
| Tiempo | `tiempo` |
| Tarifa | `tarifa` (+ alerta si `tarifaAlerta`) |
| Cant. Sist. | `cantSist` |
| Cant. Fact. | `cantFact` |
| Dif. cant. | `difCant` |
| Dif. económica | `difEconomica` |
| Estado | `estado: EstadoConciliacion` |
| Acciones | Ver detalle |

#### Filtros

| Filtro | Estado | Implementación |
|--------|--------|----------------|
| Búsqueda | `busqueda` | **FE** — tipo, consistencia, tiempo |
| Nº factura | `numeroFactura` | **FE** |
| Periodo | `periodo` | **FE** — select mock |
| Proveedor | `proveedor` | **FE** — select mock |

**Origen datos:** `construirConciliacionDesdeCiclo(ordenes)` o mock fallback.

#### Query params sugeridos (BE)

```
GET /api/dietas-cocina/conciliacion
  ?busqueda=almuerzo
  &numeroFactura=FAC-2026-042
  &periodo=2026-07
  &proveedor=catering-sl
  &page=1&pageSize=20
```

---

### 5. Catálogo dietas-tarifas (`DietasTarifasTabla`)

**Evidencia:** `dietas-tarifas/components/DietasTarifasTabla.tsx`

#### Columnas esperadas

| Columna | Campo |
|---------|-------|
| Código | `codigo` |
| Nombre | `nombre` |
| Estado catálogo | `estado: EstadoDietaCatalogo` |
| Tarifa vigente | `tarifaVigente` |
| Vigencia | `fechaInicio`, `fechaFin` |
| Última actualización | `ultimaActualizacion`, `usuario` |
| Acciones | Editar, tarifas, desactivar |

#### Filtros

| Filtro | Implementación |
|--------|----------------|
| Búsqueda nombre/código | **FE** (página) |
| Estado vigente/programada/vencida | **FE** |

```
GET /api/dietas-cocina/catalogo/dietas?estado=vigente&busqueda=renal&page=1
```

---

### 6. Auditoría dietas (`AuditoriaTabla`)

**Evidencia:** `auditoria/components/AuditoriaTabla.tsx`, `AuditoriaFiltros.tsx`

#### Columnas

| Columna | Campo |
|---------|-------|
| Fecha/hora | timestamp evento |
| Usuario | actor |
| Módulo | `ModuloAuditoria` |
| Acción | descripción |
| Resultado | `ResultadoAuditoria` |
| Acciones | Ver detalle |

#### Filtros

| Filtro | Implementación |
|--------|----------------|
| Módulo | **FE** |
| Resultado exitoso/fallido | **FE** |
| Rango fechas | **FE** |
| Usuario | **FE** |

```
GET /api/dietas-cocina/auditoria
  ?modulo=dietas
  &resultado=exitoso
  &desde=2026-07-01
  &hasta=2026-07-25
  &usuario=m.nutricion
  &page=1&pageSize=30
```

---

### 7. Usuarios dietas (`UsuariosTabla` + `UsuariosFiltros`)

**Evidencia:** `usuarios/components/UsuariosTabla.tsx`, `UsuariosFiltros.tsx`

#### Columnas

| Columna | Campo |
|---------|-------|
| Nombre | `nombre`, `usuario` |
| Correo | `correo` |
| Rol | `rol: RolDietas` |
| Servicio/área | `servicioArea` |
| Org. proveedora | `orgProveedora` |
| Estado | `estado: EstadoUsuario` |
| Último acceso | `ultimoAcceso` |
| Origen | `origen: OrigenUsuario` |
| Acciones | Editar, cambiar rol, activar/desactivar |

#### Filtros + paginación

| Control | Implementación |
|---------|----------------|
| Rol | **FE** — select `todos` + ROLES_DIETAS |
| Estado activo/inactivo | **FE** |
| Paginación | **FE** — `paginaActual`, `totalPaginas`, rango "X–Y de Z" |

```
GET /api/dietas-cocina/usuarios?rol=Nutricionista&estado=activo&page=2&pageSize=10
```

**Respuesta:**

```json
{
  "data": [ ...UsuarioModulo ],
  "meta": { "total": 47, "page": 2, "pageSize": 10, "totalPages": 5 }
}
```

---

### 8. Reportes (`ReportesFiltros`)

**Evidencia:** `reportes/components/ReportesFiltros.tsx`, `types/reports.ts`

#### Filtros compartidos (`FiltrosReportes`)

| Campo | Tipo | Default |
|-------|------|---------|
| `desde` | date ISO | Inicio mes actual |
| `hasta` | date ISO | Hoy |
| `servicio` | string | `todos` |
| `horario` | string | `todos` (mapea a TiempoComida) |

**Implementación actual:** **FE** — `aplicarFiltrosReportes()` escala KPIs con factor calculado (`calcularFactor`).

#### Query params sugeridos (BE — agregación real)

```
GET /api/dietas-cocina/reportes/nutricionista
  ?desde=2026-07-01
  &hasta=2026-07-25
  &servicio=cardiologia
  &horario=almuerzo
```

**Nota:** En producción el backend debe calcular agregados; el frontend no debe escalar mocks.

---

## Módulo Encuestas

### 9. Cuestionarios (`CuestionariosTabla`)

**Evidencia:** `cuestionarios/components/CuestionariosTabla.tsx`, `CuestionariosFiltros.tsx`

#### Columnas

| Columna | Campo |
|---------|-------|
| Cuestionario | `nombre`, `descripcion` |
| Canal | `canal: CanalCuestionario` |
| Preguntas | `preguntas` (count) |
| Estado | `estado: EstadoCuestionario` |
| Última actualización | `actualizadoEn` |
| Acciones | Editar, preguntas, duplicar, toggle, eliminar |

#### Filtros

| Filtro | Implementación |
|--------|----------------|
| Búsqueda | **FE** |
| Estado activo/inactivo/borrador | **FE** |
| Canal | **FE** |

```
GET /api/encuestas/cuestionarios?estado=activo&canal=presencial&busqueda=satisfaccion
```

---

### 10. Encuestas realizadas (`EncuestasRealizadasTabla`)

**Evidencia:** `encuestas-realizadas/components/EncuestasRealizadasTabla.tsx`, `FiltrosAvanzados.tsx`, `EncuestasRealizadasToolbar.tsx`

#### Columnas

| Columna | Campo |
|---------|-------|
| Consecutivo | `consecutivo` |
| Fecha | `fecha` |
| Paciente | `paciente`, `documento`, `entidad` |
| Servicio / punto | `servicio`, `puntoAtencion` |
| Canal | `canal: CanalEncuesta` |
| Encuestador | `encuestador` |
| SAT | `sat` | `SatNpsBadge` |
| NPS | `nps` | Badge |
| Estado | `estado: EstadoEncuesta` |
| Alerta | `comentarioNegativo` | Icono |
| Acciones | Ver, anular |

#### Filtros avanzados (toolbar)

| Filtro | Implementación |
|--------|----------------|
| Rango fechas | **FE** |
| Servicio | **FE** |
| Punto atención | **FE** |
| Canal | **FE** |
| Estado encuesta | **FE** |
| SAT/NPS rango | **FE** |
| Búsqueda paciente/documento | **FE** |

#### Paginación

| Prop | Uso |
|------|-----|
| `desde`, `hasta` | Rango visible "1–20 de 156" |
| `paginaActual`, `totalPaginas` | Controles prev/next |
| `onCambiarPagina` | **FE** slice array mock |

```
GET /api/encuestas/realizadas
  ?desde=2026-07-01&hasta=2026-07-25
  &servicio=Urgencias
  &canal=telefono
  &estado=completada
  &satMin=1&satMax=5
  &busqueda=1003195163
  &page=3&pageSize=20
```

---

### 11. Captura telefónica (`CapturaTelefonicaTabla`)

**Evidencia:** `captura-telefonica/components/CapturaTelefonicaTabla.tsx`, `CapturaTelefonicaFiltros.tsx`

#### Columnas

| Columna | Campo |
|---------|-------|
| Paciente | `paciente`, `documento` |
| Teléfono | `telefono` |
| Punto / servicio | `puntoAtencion`, `servicio` |
| EPS | `eps` |
| Fecha cita | `fechaCita` |
| Intentos | `intentos` / `intentosMax` |
| Último intento | `ultimoIntento` |
| Estado | `estado: EstadoLlamada` |
| Acciones | Gestionar llamada |

#### Filtros

| Filtro | Implementación |
|--------|----------------|
| Estado llamada | **FE** |
| Servicio | **FE** |
| Búsqueda | **FE** |

```
GET /api/encuestas/captura/telefonica/pendientes?estado=pendiente&servicio=Hospitalizacion
```

---

### 12. Captura presencial (`CapturaPresencialPage`)

**Evidencia:** `captura-presencial/components/CapturaPresencialFiltros.tsx`

Filtros análogos: servicio, estado paciente (`EstadoPaciente`), búsqueda.

```
GET /api/encuestas/captura/presencial/pendientes?estado=pendiente
```

---

### 13. Indicadores experiencia (`FiltrosExperiencia`)

**Evidencia:** `indicadores/components/experiencia/FiltrosExperiencia.tsx`, `mockIndicadoresExperiencia.ts`

#### Filtros

| Filtro | Valores mock |
|--------|--------------|
| Rango fechas | Hoy, Última semana, Último mes, Último trimestre |
| Servicio | Urgencias, Consulta Externa, Hospitalización, UCI |
| Punto atención | Sede Principal, Norte, Sur |
| EPS | Sura, Nueva, Coomeva, Sanitas |
| Contrato | PGP, Evento, Capitación |
| Canal | Presencial, Telefónico |

**Implementación:** **FE** sobre mocks.

```
GET /api/encuestas/indicadores/experiencia
  ?rango=ultimo_mes
  &servicio=Urgencias
  &puntoAtencion=Sede+Principal
  &eps=Sura+EPS
  &contrato=PGP
  &canal=presencial
```

---

### 14. Análisis brechas (`BrechasTabla`)

**Evidencia:** `indicadores/components/brechas/BrechasTabla.tsx`

#### Columnas (`FilaBrecha`)

| Columna | Campo |
|---------|-------|
| Paciente | `iniciales`, `nombre`, `documento` |
| Fecha | `fecha` |
| Servicio | `servicio`, `convenio` |
| Contacto | `contacto: ContactoBrecha` |
| Gestión | `gestionNombre` |
| Intentos | `intentos` |
| Motivo | `motivo`, `motivoTono` |
| Estado | `estado: EstadoBrecha` |

```
GET /api/encuestas/indicadores/brechas?servicio=UCI&estado=pendiente&page=1
```

---

### 15. Auditoría encuestas (`AuditoriaTabla`)

Patrón similar a dietas §6.

```
GET /api/encuestas/auditoria?desde=...&hasta=...&page=1
```

---

### 16. Usuarios encuestas

Patrón idéntico a dietas §7 con roles Encuestas.

---

## Resumen: frontend vs backend

| Listado | Filtros FE hoy | Paginación FE | Prioridad BE |
|---------|----------------|---------------|--------------|
| Dietas operativas | Todos | No | Alta — censo puede ser >100 filas |
| Cocina órdenes | Todos | No | Alta |
| Etiquetas | Todos | No | Media |
| Conciliación | Todos | No | Media |
| Catálogo tarifas | Parcial | No | Baja |
| Auditoría dietas | Todos | No | Alta — volumen histórico |
| Usuarios dietas | Rol, estado | Sí (FE) | Media |
| Encuestas realizadas | Avanzados | Sí (FE) | **Alta** |
| Captura telefónica | Parcial | No | Alta |
| Cuestionarios | Parcial | No | Baja |
| Indicadores | Todos | N/A (agregados) | **Alta** — siempre BE |

---

## Estándar query params recomendado

| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | int | Página 1-based |
| `pageSize` | int | Default 20, max 100 |
| `sort` | string | Campo ordenable |
| `order` | `asc`\|`desc` | Dirección |
| `busqueda` | string | Búsqueda full-text paciente/código |
| `desde` / `hasta` | ISO date | Rangos temporales |

**Envelope paginado:**

```json
{
  "data": [],
  "meta": {
    "total": 156,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8,
    "desde": 1,
    "hasta": 20
  },
  "timestamp": "...",
  "version": "v1"
}
```

Compatible con props existentes en `EncuestasRealizadasTabla` (`desde`, `hasta`, `totalRegistros`, `paginaActual`, `totalPaginas`) y `UsuariosFiltros`.
