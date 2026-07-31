# 07 — Catálogos y parámetros

> **Objetivo:** identificar valores fijos vs administrables, su uso en frontend y endpoints sugeridos en **Bital.ApiNegocio**.  
> **Separación:** datos maestros HIS (ApiConsultas, solo lectura) vs catálogos de negocio Bital.

---

## Resumen

| Tipo | Cantidad | Administrable backend |
|------|----------|----------------------|
| Enums fijos en código | 24 | Parcial (algunos deberían migrar) |
| Catálogos mock administrables | 12 | Sí |
| Parámetros operativos (localStorage) | 3 | Sí |
| Datos maestros HIS | 5 dominios | No (solo lectura) |

---

# Catálogos fijos (hardcoded en frontend)

Estos valores están definidos en TypeScript; el backend debería **exponerlos como enum/catálogo** para consistencia multi-cliente.

## Dietas y Cocina — `modules/dietas-cocina/types/enums.ts`

| Catálogo | Valores | Módulos / uso | ¿Administrable? | Endpoint sugerido | Certeza |
|----------|---------|---------------|----------------|-------------------|---------|
| `EstadoDieta` | `confirmada`, `guardado`, `no-solicitada`, `preparando`, `en-preparacion`, `lista-despacho`, `por-iniciar`, `recibida`, `devuelta`, `cancelada`, `despachada` | Dietas, inicio, reportes | **Fijo** (máquina estados) | `GET /api/v1/dietas-cocina/catalogos/estados-dieta` | Confirmado |
| `TiempoComida` | `desayuno`, `merienda-manana`, `almuerzo`, `merienda-tarde`, `cena`, `merienda-noche` | Todo el módulo | **Configurable** (activar/desactivar) | `GET/PUT /api/v1/dietas-cocina/parametros/tiempos-comida` | Confirmado |
| `EstadoCocina` | `por_iniciar`, `en_preparacion`, `lista`, `despachada`, `cancelada` | Cocina | Fijo | `GET .../catalogos/estados-cocina` | Confirmado |
| `EstadoEtiqueta` | `pendiente`, `generada`, `impresa`, `reimpresa` | Etiquetas proveedor | Fijo | `GET .../catalogos/estados-etiqueta` | Confirmado |
| `EstadoLogisticaEtiqueta` | `generada`, `impresa`, `pre_entregada`, `entregada`, `devuelta` | Etiquetas enfermería | Fijo | `GET .../catalogos/estados-logistica` | Confirmado |
| `EstadoConciliacion` | `coincide`, `dif-cantidad`, `dif-tarifa`, `pendiente`, `conciliado-manual` | Conciliación | Fijo | `GET .../catalogos/estados-conciliacion` | Confirmado |
| `EstadoDietaCatalogo` | `vigente`, `programada`, `vencida` | Tarifas | Calculado + fijo | Incluido en respuesta catálogo dietas | Confirmado |
| `EstadoCategoria` | `activo`, `borrador` | Tipos paciente | Fijo | `GET .../catalogos/estados-categoria-edad` | Confirmado |
| `ModoCargaAnticipada` | `todas-desde-manana`, `ventana-por-comida` | Parámetros tiempos | **Administrable** | `PUT .../parametros/carga-anticipada` | Confirmado |
| `MotivoDevolucion` | `Paciente no estaba en habitación`, `Paciente en NVO o ayuno`, `Paciente se negó antes de recibir`, `Bandeja incorrecta para el paciente`, `Bandeja dañada o contaminada`, `Temperatura inadecuada`, `Se consumió`, `Consumo parcial`, `No se consumió`, `Bandeja sin abrir` | Devolución etiquetas | **Administrable** | `GET/POST .../catalogos/motivos-devolucion` | Confirmado |
| `MotivoCancelacion` | `alta-medica`, `traslado`, `fallecimiento`, `nvo`, `error-solicitud`, `otro` | Cancelar dieta | **Administrable** | `GET/POST .../catalogos/motivos-cancelacion` | Confirmado |
| `MOTIVOS_NOVEDAD` | `Cambio clínico`, `Ajuste de consistencia`, ... | Novedad dieta | **Administrable** | `GET/POST .../catalogos/motivos-novedad` | Confirmado |
| `RolDietas` | `Administrador`, `Nutricionista`, `Doctor`, `Proveedor`, `Enfermera` | Auth módulo | Semi-fijo (Super Admin crea roles plataforma) | `GET .../catalogos/roles-modulo` | Confirmado |
| `FiltroSeguimientoCocina` | `Todos`, `en_transito`, `pre_entregada`, `entregada`, `devuelta` | Filtros cocina | Fijo (UI) | — | Confirmado |
| `ModuloAuditoria` | `dietas`, `cocina`, `etiquetas`, ... | Auditoría | Fijo | — | Confirmado |
| `ResultadoAuditoria` | `exitoso`, `fallido` | Auditoría Dietas | Fijo | — | Confirmado |

**Evidencia:** `types/enums.ts`, `EstadoBadge.tsx`, `DietasCancelarDialog`, `RegistroDevolucionForm`

---

## Encuestas — `modules/encuestas/types/enums.ts`

| Catálogo | Valores | ¿Administrable? | Endpoint sugerido | Certeza |
|----------|---------|----------------|-------------------|---------|
| `EstadoCaptura` | `completada`, `revision` | Fijo | — | Confirmado |
| `TipoCaptura` | `telefonica`, `presencial` | Fijo | — | Confirmado |
| `CanalPaciente` | `telefonica`, `presencial` | Fijo | — | Confirmado |
| `EstadoPaciente` | `pendiente`, `en_proceso`, `completada`, `no_disponible` | Fijo | `GET .../encuestas/catalogos/estados-captura-paciente` | Confirmado |
| `EstadoLlamada` | `pendiente`, `reintento`, `no_contesta`, `rechazo`, `completada` | Fijo | `GET .../catalogos/estados-llamada` | Confirmado |
| `ResultadoLlamada` | `acepta_encuesta`, `solicita_posterior`, `no_contesta`, ... | **Administrable** | `GET/POST .../catalogos/resultados-llamada` | Confirmado |
| `TipoPreguntaEncuesta` | `escala_satisfaccion`, `opcion_unica`, `texto_libre` | Fijo (wizard) | — | Confirmado |
| `ValorSatisfaccion` | `muy_satisfecho` … `muy_insatisfecho` | Semi-fijo | `GET .../catalogos/escala-satisfaccion` | Confirmado |
| `EstadoEncuesta` | `completada`, `incompleta`, `anulada` | Fijo | — | Confirmado |
| `CanalEncuesta` | `telefono`, `presencial` | Fijo | — | Confirmado |
| `EstadoSincronizacion` | `sincronizado`, `pendiente`, `error` | Fijo (técnico) | — | Confirmado |
| `TonoRespuesta` | `positivo`, `neutro`, `negativo` | Calculado | — | Confirmado |
| `EstadoCuestionario` | `activo`, `inactivo`, `borrador` | Fijo | — | Confirmado |
| `CanalCuestionario` | `presencial`, `telefonico`, `ambos` | Fijo | — | Confirmado |
| `TipoRespuesta` | `escala`, `numerico`, `texto_libre`, `opcion_unica`, `opcion_multiple` | Fijo | — | Confirmado |
| `EstadoBrecha` | `en_gestion`, `pendiente`, `justificado` | Fijo | — | Confirmado |
| `ContactoBrecha` | `valido`, `na`, `invalido` | Fijo | — | Confirmado |
| `EstadoRegla` | `activa`, `borrador` | Fijo | — | Confirmado |
| `RolEncuestas` | `Administrador`, `Encuestador` | Semi-fijo | Ver nota inconsistencia roles | Confirmado |
| `ResultadoAuditoriaEncuestas` | `exito`, `denegado` | Fijo | — | Confirmado |

**Inconsistencia roles:** `lib/configAccesoModulos.ts` define `Analista SIAO` y `Operador de encuestas` además de alias Encuestador. **Recomendación:** unificar en catálogo backend. **Certeza:** Confirmado.

---

# Catálogos administrables (mock → Bital)

## 1. Catálogo de dietas y tarifas

| Campo catálogo | Tipo | Valores ejemplo (mock) | Pantalla | Endpoint CRUD |
|----------------|------|------------------------|----------|---------------|
| Dieta (nombre, código) | `DietaCatalogo` | General, Blanda, Diabética… | `DietasTarifasPage` | `GET/POST/PUT/PATCH /api/v1/dietas-cocina/catalogos/dietas` |
| Tarifa vigente | `TarifaHistorico` | Monto COP por vigencia | `NuevaTarifaSheet` | `POST .../catalogos/dietas/{id}/tarifas` |
| Desactivar dieta | `activa: false` | — | `DesactivarDietaDialog` | `PATCH .../catalogos/dietas/{id}/estado` |

**Activar/inactivar:** Sí (`activa`, `estado` catálogo)  
**Orden:** Por `nombre` / `codigo` (tabla)  
**Origen actual:** mock (`mockDietasTarifas.ts`)  
**Certeza:** Confirmado

---

## 2. Consistencias dietéticas

| Aspecto | Detalle |
|---------|---------|
| **Valores en UI** | Strings en `FilaDieta.consistencia`, selects en `DietasAsignarConsistenciaDialog` |
| **Origen mock** | `mockDietas.ts`, formularios |
| **Administrable** | **Sí** — no hay enum centralizado |
| **Endpoint sugerido** | `GET/POST /api/v1/dietas-cocina/catalogos/consistencias` |
| **Campos** | `id`, `codigo`, `nombre`, `activo`, `orden` |
| **Certeza** | Inferido (valores dispersos en mock) |

---

## 3. Tipos de aislamiento

| Aspecto | Detalle |
|---------|---------|
| **Campo** | `FilaDieta.aislamiento`, `aislado` |
| **Administrable** | **Sí** (texto + flag) |
| **Endpoint sugerido** | `GET /api/v1/dietas-cocina/catalogos/tipos-aislamiento` |
| **Origen** | Mezcla HIS + mock |
| **Certeza** | Inferido |

---

## 4. Tiempos de comida y hitos operativos

| Parámetro | Valores / estructura | Persistencia | Endpoint |
|-----------|---------------------|--------------|----------|
| Comidas activas | 6 `TiempoComida` | `ConfigTiempos.activos` → localStorage | `GET/PUT /api/v1/dietas-cocina/parametros/tiempos-comida` |
| Hitos por comida | `HitoTiempo[]` (label, hora HH:mm) | `horasPorComida` | Incluido en mismo PUT |
| Ventana de cambios | `inicio`, `fin`, `label` | `ParametrosTiempoComida.ventanaCambios` | Incluido |
| Modo carga anticipada | `ModoCargaAnticipada` | `ConfigTiempos.modoCarga` | `PUT .../parametros/carga-anticipada` |

**Evidencia:** `parametros/datos/mockTiempos.ts`, `TiemposRestriccionesView`, `configTiemposStorage.ts`  
**Certeza:** Confirmado

---

## 5. Categorías de edad (tipos paciente)

| Campo | Valores ejemplo | Administrable | Endpoint |
|-------|-----------------|---------------|----------|
| `CategoriaEdad` | Neonato, Pediátrico, Adulto… | Sí | `GET/POST/PUT /api/v1/dietas-cocina/parametros/categorias-edad` |
| Rangos | `rangoMin`, `rangoMax`, `unidad` | Sí | Validar no solapamiento |
| Estado | `activo`, `borrador` | Sí | PATCH estado |

**Evidencia:** `mockTiposPaciente.ts`, `TiposPacienteView`, `clasificarEdadPaciente.ts`  
**Certeza:** Confirmado

---

## 6. Checklist de cocina

| Aspecto | Detalle |
|---------|---------|
| **Estructura** | `ChecklistItem` embebido en `OrdenCocina` |
| **Administrable** | **Sí** — plantilla por tipo dieta/comida |
| **Endpoint sugerido** | `GET/PUT /api/v1/dietas-cocina/parametros/checklist-cocina` |
| **Certeza** | Inferido |

---

## 7. Cuestionarios y preguntas (Encuestas)

| Recurso | Administrable | Endpoints sugeridos |
|---------|---------------|---------------------|
| `Cuestionario` | Sí | `GET/POST /api/v1/encuestas/cuestionarios` |
| `SeccionEditor` | Sí | `PUT .../cuestionarios/{id}/secciones` |
| `PreguntaEditor` | Sí | `PUT .../cuestionarios/{id}/preguntas` |
| `OpcionRespuesta` | Sí | Embebido en pregunta |
| `LogicaCondicional` | Sí | Embebido en pregunta |

**Estados:** `borrador` → editable; `activo` → asignable; `inactivo` → solo histórico  
**Evidencia:** `EditorCuestionarioPage`, `types/questionnaire-editor.ts`  
**Certeza:** Confirmado (UI); backend Inferido

---

## 8. Reglas de parametrización (Encuestas)

| Campo | Descripción | Endpoint |
|-------|-------------|----------|
| `ReglaActiva` | Elegibilidad, intentos máx., ventanas | `GET/POST/PUT /api/v1/encuestas/parametros/reglas` |
| Evaluación | Afecta `PacienteEncontrado.elegible` | `POST .../reglas/evaluar` |

**Evidencia:** `mockParametrosReglas.ts`, `ParametrosPage`  
**Certeza:** Confirmado (mock); reglas exactas Inferido

---

## 9. Usuarios y roles por módulo

| Catálogo | Nivel | Endpoint |
|----------|-------|----------|
| Roles plataforma | Super Admin | `GET/POST /api/v1/admin/roles` |
| Permisos globales | Super Admin | `GET/PUT /api/v1/admin/permisos` |
| Usuarios módulo Dietas | Admin módulo | `GET/POST/PUT /api/v1/dietas-cocina/usuarios` |
| Usuarios módulo Encuestas | Admin módulo | `GET/POST/PUT /api/v1/encuestas/usuarios` |
| Acceso rol→ruta | Super Admin | `GET/PUT /api/v1/admin/config-acceso-modulos` |

**Origen actual:** mock + `bital:config-acceso-modulos` (localStorage)  
**Certeza:** Confirmado

---

# Datos maestros HIS (solo lectura — ApiConsultas)

| Dominio | Campos clave | Endpoint existente | ¿Administrable Bital? |
|---------|--------------|-------------------|------------------------|
| Pacientes | `cedula`, `nombreCompleto`, `edad`, `sexo` | `GET /api/v1/pacientes/*` | **No** |
| Atenciones | `consecutivo`, fechas, diagnósticos | `GET /api/v1/atenciones/*` | **No** |
| Censo hospitalario | `idIngreso`, `pabellon`, `cama` | `GET /api/v1/atenciones/hospitalarias` | **No** |
| Servicios / pabellones | Embebidos en atenciones | Parcial en respuestas | **No** (referencia) |
| EPS / contratos | Encuestas mock | No expuesto aún | **Inferido:** ApiConsultas o maestra Bital |

**Regla:** El frontend en producción consume estos datos **vía ApiNegocio** que orquesta ApiConsultas.

**Evidencia:** `promt.md`, `api/types.ts`, `censoRepository.http.ts`

---

# Parámetros de sistema (localStorage → backend)

| Parámetro | Clave localStorage | Estructura | Prioridad migración |
|-----------|-------------------|------------|---------------------|
| Censo operativo dietas | `dietas-cocina-operativas-*` | `EstadoDietasPersistido` | Alta |
| Ciclo bandejas | `dietas-cocina-ciclo-bandejas` | `EstadoCicloBandejas` | Alta |
| Tiempos comida | `dietas-cocina-parametros-tiempos` | `ConfigTiempos` | Media |
| Acceso por rol/módulo | `bital:config-acceso-modulos` | Matriz rutas | Media |

---

# Endpoints sugeridos — resumen ApiNegocio

```text
# Dietas — catálogos
GET    /api/v1/dietas-cocina/catalogos/dietas
POST   /api/v1/dietas-cocina/catalogos/dietas
PATCH  /api/v1/dietas-cocina/catalogos/dietas/{id}
POST   /api/v1/dietas-cocina/catalogos/dietas/{id}/tarifas
GET    /api/v1/dietas-cocina/catalogos/consistencias
GET    /api/v1/dietas-cocina/catalogos/motivos-devolucion
GET    /api/v1/dietas-cocina/catalogos/motivos-cancelacion
GET    /api/v1/dietas-cocina/catalogos/motivos-novedad

# Dietas — parámetros
GET    /api/v1/dietas-cocina/parametros/tiempos-comida
PUT    /api/v1/dietas-cocina/parametros/tiempos-comida
GET    /api/v1/dietas-cocina/parametros/categorias-edad
POST   /api/v1/dietas-cocina/parametros/categorias-edad
GET    /api/v1/dietas-cocina/parametros/checklist-cocina

# Encuestas — catálogos y parametrización
GET    /api/v1/encuestas/cuestionarios
POST   /api/v1/encuestas/cuestionarios
PUT    /api/v1/encuestas/cuestionarios/{id}
GET    /api/v1/encuestas/catalogos/resultados-llamada
GET    /api/v1/encuestas/parametros/reglas
POST   /api/v1/encuestas/parametros/reglas
POST   /api/v1/encuestas/reglas/evaluar

# Plataforma
GET    /api/v1/admin/config-acceso-modulos
PUT    /api/v1/admin/config-acceso-modulos
```

---

# Esquema genérico de catálogo administrable

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `codigo` | string | Código único opcional |
| `nombre` | string | Etiqueta UI |
| `descripcion` | text | Opcional |
| `activo` | boolean | Inactivación lógica |
| `orden` | integer | Orden en selects |
| `metadata` | json | Extensiones por dominio |
| `createdAt`, `updatedAt`, `updatedBy` | auditoría | Estándar Bital |

---

## Preguntas pendientes (catálogos)

| # | Pregunta | Impacto | Certeza |
|---|----------|---------|---------|
| 1 | ¿Consistencias y tipos de dieta viven en Vital o solo en Bital? | Duplicación vs integración | Pendiente |
| 2 | ¿Servicios/pabellones se sincronizan del HIS o se administran en Bital? | Filtros y reportes | Inferido |
| 3 | ¿Unificar roles Encuestas (`Encuestador` vs `Analista SIAO`)? | Auth y permisos | Confirmado (inconsistencia) |
| 4 | ¿EPS/contrato viene del HIS en producción? | `PacienteEncontrado` | Inferido |

---

**Referencias:** `02-entidades-y-campos.md`, `04-endpoints.md`, `09-roles-y-permisos.md`
