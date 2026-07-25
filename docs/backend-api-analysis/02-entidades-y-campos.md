# 02 — Entidades y campos

> **Fuente primaria:** tipos centralizados en `modules/dietas-cocina/types/`, `modules/encuestas/types/`, `frontend/src/types/`, `@/api/types`.  
> **Leyenda columnas:** Lectura/Creación/Actualización = Sí/No/Cond. | **Origen:** HIS/ApiConsultas · Bital/ApiNegocio · mock · localStorage · calculado frontend  
> **Certeza:** Confirmado = definido en types/código; Inferido = etiqueta UI o regla no explícita en tipos.

---

## Resumen

| Módulo | Entidades documentadas | Campos aprox. |
|--------|------------------------|---------------|
| Dietas y Cocina | 28 | ~220 |
| Encuestas SIAO | 22 | ~180 |
| Transversal + API HIS | 8 | ~55 |
| **Total** | **58** | **~455** |

---

# Dietas y Cocina

## FilaDieta

**Descripción:** Fila operativa del censo de dietas por paciente, comida y turno.  
**Evidencia:** `types/diets.ts` · `DietasTabla`, `DietasSolicitudSheet`  
**PK sugerida:** `id` (uuid Bital) + `comida` + fecha operativa

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid/string | Sí | No | Sí | Auto | No | No | No | — | Único por fila operativa | Bital/ApiNegocio |
| pacienteId | Paciente | string | Sí | No | Sí | Sí | No | Sí | No | Paciente (HIS) | Debe existir en HIS | HIS/ApiConsultas + Bital |
| idIngreso | Ingreso | integer | No | Sí | Sí | Sí | No | Sí | No | AtencionHospitalaria | Consecutivo ingreso Vital | HIS/ApiConsultas |
| cedula | Documento | string | No | Sí | Sí | Sí | No | Sí | No | Paciente | Formato documento CO | HIS/ApiConsultas |
| tipoDocumento | Tipo doc. | string | No | Sí | Sí | Sí | No | Sí | No | Catálogo tipos doc. | CC, TI, etc. | HIS/ApiConsultas |
| paciente | Paciente | string | Sí | No | Sí | Sí | No | Sí | No | Paciente.nombreCompleto | — | HIS/ApiConsultas |
| edad | Edad | integer | Sí | No | Sí | Sí | No | No | Sí | — | Desde fecha nacimiento | calculado frontend / HIS |
| servicio | Servicio | string | Sí | No | Sí | Sí | No | Sí | No | Servicio clínico | — | HIS/ApiConsultas |
| pabellon | Pabellón | string | Sí | No | Sí | Sí | Cond. | Sí | No | Ubicación | — | HIS/ApiConsultas |
| habitacion | Habitación | string | Sí | No | Sí | Sí | Cond. | Sí | No | Ubicación | — | HIS/ApiConsultas |
| consistencia | Consistencia | string | No | Sí | Sí | Sí | Sí | Sí | No | Catálogo consistencias | Obligatoria al confirmar | Bital/ApiNegocio |
| tipoDieta | Tipo de dieta | string | No | Sí | Sí | Sí | Sí | Sí | No | DietaCatalogo | Select catálogo activo | Bital/ApiNegocio |
| aislado | Aislado | boolean | No | Sí | Sí | Sí | Sí | Sí | No | — | Flag clínico | HIS/ApiConsultas / Bital |
| aislamiento | Aislamiento | string | Sí | No | Sí | Sí | Sí | Sí | No | Catálogo aislamiento | Texto/tipo aislamiento | HIS/ApiConsultas |
| alergico | Alérgico | boolean | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| alergias | Alergias | string | Sí | No | Sí | Sí | Sí | Sí | No | — | Texto libre | Bital/ApiNegocio |
| observacionAislamiento | Obs. aislamiento | text | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| observaciones | Observaciones | text | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| descripcionDieta | Descripción | text | No | Sí | Sí | Cond. | Sí | No | No | DietaCatalogo | — | Bital/ApiNegocio |
| solicitadoPor | Solicitado por | string | No | Sí | Sí | Auto | No | No | No | Usuario | Usuario sesión | Bital/ApiNegocio |
| solicitadoEn | Fecha solicitud | datetime | No | Sí | Sí | Auto | No | Sí | No | — | ISO / locale | Bital/ApiNegocio |
| cancelacionTardia | Cancelación tardía | boolean | No | Sí | Sí | Auto | No | Sí | Sí | — | Fuera ventana novedades | calculado frontend |
| estado | Estado | enum EstadoDieta | Sí | No | Sí | Auto | Sí | Sí | Parcial | — | Máquina de estados ciclo | Bital/ApiNegocio |
| comida | Comida | enum TiempoComida | Sí | No | Sí | Sí | No | Sí | No | ParametrosTiempoComida | Tab activo | Bital/ApiNegocio |
| ordenCocinaId | Orden cocina | uuid/string | No | Sí | Sí | Auto | No | No | No | OrdenCocina | Al confirmar dieta | Bital/ApiNegocio |

**Nivel de certeza:** Confirmado (tipos); Inferido (etiquetas UI desde componentes dietas)

---

## DietaCatalogo

**Evidencia:** `types/catalog.ts` · `DietasTarifasTabla`, `CrearDietaSheet`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| codigo | Código | string | Sí | No | Sí | Sí | Cond. | Sí | No | — | Único | Bital/ApiNegocio |
| nombre | Nombre | string | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| descripcion | Descripción | text | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| estado | Estado tarifa | enum EstadoDietaCatalogo | Sí | No | Sí | Auto | Sí | Sí | Sí | — | vigente/programada/vencida | calculado frontend |
| tarifaVigente | Tarifa vigente | decimal | Sí | No | Sí | Auto | Auto | No | Sí | TarifaHistorico | Por fecha | calculado frontend |
| fechaInicio | Vigencia desde | date | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| fechaFin | Vigencia hasta | date | No | Sí | Sí | Sí | Sí | Sí | No | — | null = indefinida | Bital/ApiNegocio |
| ultimaActualizacion | Última act. | datetime | Sí | No | Sí | Auto | Auto | No | No | — | Auditoría | Bital/ApiNegocio |
| usuario | Actualizado por | string | Sí | No | Sí | Auto | Auto | No | No | Usuario | — | Bital/ApiNegocio |
| activa | Activa | boolean | Sí | No | Sí | Sí | Sí | Sí | No | — | Soft delete | Bital/ApiNegocio |
| historicoTarifas | Histórico | array TarifaHistorico | Sí | No | Sí | Auto | Sí | No | No | TarifaHistorico 1:N | — | Bital/ApiNegocio |

---

## TarifaHistorico

**Evidencia:** `types/catalog.ts` · `HistoricoTarifasTimeline`, `NuevaTarifaSheet`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| anio | Año | integer | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| monto | Monto | decimal | Sí | No | Sí | Sí | No | No | No | — | > 0 | Bital/ApiNegocio |
| vigenciaDesde | Desde | date | Sí | No | Sí | Sí | No | Sí | No | — | No solapamiento | Bital/ApiNegocio |
| vigenciaHasta | Hasta | date | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| registradoPor | Registrado por | string | Sí | No | Sí | Auto | No | No | No | Usuario | — | Bital/ApiNegocio |
| motivoCambio | Motivo | text | Sí | No | Sí | Sí | No | No | No | — | Obligatorio en UI | Bital/ApiNegocio |
| creadoEn | Creado | datetime | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| vigente | Vigente | boolean | Sí | No | Sí | Auto | Auto | Sí | Sí | — | Una vigente por dieta | calculado frontend |

---

## OrdenCocina

**Evidencia:** `types/kitchen.ts` · `CocinaTabla`, `CicloBandejasContext`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| etiquetaId | Etiqueta | uuid | No | Sí | Sí | Auto | Sí | No | No | EtiquetaEnfermera | Tras generar etiqueta | Bital/ApiNegocio |
| pacienteId | Paciente | string | Sí | No | Sí | Sí | No | Sí | No | Paciente | — | HIS/ApiConsultas |
| paciente | Paciente | string | Sí | No | Sí | Sí | No | Sí | No | — | Denormalizado | Bital/ApiNegocio |
| edad | Edad | integer | Sí | No | Sí | Sí | No | No | No | — | — | Bital/ApiNegocio |
| pabellon | Pabellón | string | Sí | No | Sí | Sí | Cond. | Sí | No | — | — | HIS/ApiConsultas |
| habitacion | Habitación | string | Sí | No | Sí | Sí | Cond. | Sí | No | — | — | HIS/ApiConsultas |
| cama | Cama | string | No | Sí | Sí | Sí | Cond. | Sí | No | — | — | HIS/ApiConsultas |
| tipoDieta | Tipo dieta | string | Sí | No | Sí | Sí | Cond. | Sí | No | DietaCatalogo | — | Bital/ApiNegocio |
| consistencia | Consistencia | string | Sí | No | Sí | Sí | Cond. | Sí | No | — | — | Bital/ApiNegocio |
| comida | Comida | enum TiempoComida | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| aislado | Aislado | boolean | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| alergias | Alergias | array string | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| observaciones | Observaciones | text | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| estadoCocina | Estado cocina | enum EstadoCocina | Sí | No | Sí | Auto | Sí | Sí | No | — | Transiciones validadas | Bital/ApiNegocio |
| estadoLogistica | Estado logística | enum EstadoLogisticaEtiqueta | No | Sí | Sí | Auto | Sí | Sí | No | EtiquetaEnfermera | Espejo etiqueta | Bital/ApiNegocio |
| etiquetaImpresa | Impresa | boolean | Sí | No | Sí | Auto | Sí | Sí | No | — | — | Bital/ApiNegocio |
| etiquetaGenerada | Generada | boolean | Sí | No | Sí | Auto | Sí | Sí | No | — | — | Bital/ApiNegocio |
| checklist | Checklist | array ChecklistItem | Sí | No | Sí | Auto | Sí | No | No | ChecklistItem 1:N | Items obligatorios | Bital/ApiNegocio |

---

## ChecklistItem

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | string | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| label | Ítem | string | Sí | No | Sí | Sí | No | No | No | — | — | Bital/ApiNegocio |
| obligatorio | Obligatorio | boolean | Sí | No | Sí | Sí | No | No | No | — | Bloquea despacho | Bital/ApiNegocio |
| completado | Completado | boolean | Sí | No | Sí | No | Sí | No | No | — | — | Bital/ApiNegocio |

---

## EtiquetaDieta / EtiquetaEnfermera

**Evidencia:** `types/labels.ts` · `EtiquetaCard`, `RegistroDevolucionForm`  
`EtiquetaEnfermera` extiende `EtiquetaDieta` con campos logísticos.

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| codigo | Código / QR | string | Sí | No | Sí | Auto | No | Sí | Sí | — | Escaneo enfermería | Bital/ApiNegocio |
| pacienteId | — | string | Sí | No | Sí | Sí | No | Sí | No | Paciente | — | HIS/ApiConsultas |
| paciente | Paciente | string | Sí | No | Sí | Sí | No | Sí | No | — | Impresión etiqueta | Bital/ApiNegocio |
| documento | Documento | string | Sí | No | Sí | Sí | No | Sí | No | Paciente | — | HIS/ApiConsultas |
| edad | Edad | integer | Sí | No | Sí | Sí | No | No | No | — | — | Bital/ApiNegocio |
| aislamiento | Aislamiento | boolean | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| pabellon | Pabellón | string | Sí | No | Sí | Sí | No | Sí | No | — | — | HIS/ApiConsultas |
| habitacion | Habitación | string | Sí | No | Sí | Sí | No | Sí | No | — | — | HIS/ApiConsultas |
| tipoDieta | Dieta | string | Sí | No | Sí | Sí | No | Sí | No | DietaCatalogo | — | Bital/ApiNegocio |
| consistencia | Consistencia | string | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| observaciones | Observaciones | text | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| comida | Comida | enum TiempoComida | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| fechaHora | Fecha/hora | datetime | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| estado | Estado etiqueta | enum EstadoEtiqueta | Sí | No | Sí | Auto | Sí | Sí | No | — | pendiente→impresa | Bital/ApiNegocio |
| qrPayload | QR | string | Sí | No | Sí | Auto | No | No | Sí | — | Payload escaneo | calculado frontend |
| estadoLogistica | Logística | enum EstadoLogisticaEtiqueta | Sí | No | Sí | Auto | Sí | Sí | No | — | Solo EtiquetaEnfermera | Bital/ApiNegocio |
| alergias | Alergias | array string | No | Sí | Sí | Sí | Sí | No | No | — | Enfermera | Bital/ApiNegocio |
| pabellonDetalle | Detalle pabellón | string | No | Sí | Sí | Sí | No | No | No | — | — | Bital/ApiNegocio |
| cama | Cama | string | No | Sí | Sí | Sí | Cond. | Sí | No | — | — | HIS/ApiConsultas |
| horaPreEntrega | Pre-entrega | time/datetime | No | Sí | Sí | Auto | Sí | Sí | No | — | Flujo enfermería | Bital/ApiNegocio |
| horaEntrega | Entrega | time/datetime | No | Sí | Sí | Auto | Sí | Sí | No | — | — | Bital/ApiNegocio |
| horaDevolucion | Devolución | time/datetime | No | Sí | Sí | Auto | Sí | Sí | No | — | — | Bital/ApiNegocio |
| recibidoPor | Recibido por | string | No | Sí | Sí | Sí | Sí | No | No | Usuario | Pre-entrega | Bital/ApiNegocio |
| motivoDevolucion | Motivo | enum MotivoDevolucion | No | Sí | Sí | Sí | Sí | Sí | No | Catálogo | Obligatorio al devolver | Bital/ApiNegocio |
| observacionesDevolucion | Obs. devolución | text | No | Sí | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| fotoDevolucion | Evidencia foto | string/base64 | No | Sí | Sí | Sí | No | No | No | Archivo | multipart en prod | Bital/ApiNegocio |

---

## FilaConciliacion / RegistroSistema / DetalleConciliacion

**Evidencia:** `types/reconciliation.ts` · `ConciliacionTabla`, `ConciliacionDetalleSheet`

### FilaConciliacion

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | calculado frontend |
| tipo | Tipo dieta | string | Sí | No | Sí | Auto | No | Sí | Sí | DietaCatalogo | Agrupación | calculado frontend |
| consistencia | Consistencia | string | Sí | No | Sí | Auto | No | Sí | Sí | — | — | calculado frontend |
| tiempo | Comida | string | Sí | No | Sí | Auto | No | Sí | Sí | TiempoComida | — | calculado frontend |
| tarifa | Tarifa | decimal/string | Sí | No | Sí | Auto | No | Sí | Sí | TarifaHistorico | — | calculado frontend |
| tarifaAlerta | Alerta tarifa | boolean | No | Sí | Sí | Auto | No | Sí | Sí | — | Diferencia tarifaria | calculado frontend |
| cantSist | Cant. sistema | integer | Sí | No | Sí | Auto | No | No | Sí | — | Desde ciclo Bital | calculado frontend |
| cantFact | Cant. facturación | integer | Sí | No | Sí | Sí | Sí | No | No | — | Input proveedor | Bital/ApiNegocio |
| difCant | Diferencia | integer | Sí | No | Sí | Auto | No | Sí | Sí | — | cantSist - cantFact | calculado frontend |
| difEconomica | Dif. económica | decimal/string | Sí | No | Sí | Auto | No | Sí | Sí | — | — | calculado frontend |
| estado | Estado | enum EstadoConciliacion | Sí | No | Sí | Auto | Sí | Sí | Sí | — | — | calculado frontend |
| registros | Registros | array RegistroSistema | No | Sí | Sí | Auto | No | No | Sí | FilaDieta/Etiqueta | Detalle | calculado frontend |

### RegistroSistema

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| fecha | Fecha | date | Sí | No | Sí | Auto | No | Sí | Sí | — | — | calculado frontend |
| paciente | Paciente | string | Sí | No | Sí | Auto | No | Sí | Sí | FilaDieta | — | calculado frontend |
| habitacion | Habitación | string | Sí | No | Sí | Auto | No | Sí | Sí | — | — | calculado frontend |
| estado | Estado | string | Sí | No | Sí | Auto | No | Sí | Sí | EstadoDieta | — | calculado frontend |

---

## ParametrosTiempoComida / HitoTiempo / CategoriaEdad / ConfigTiempos

**Evidencia:** `types/parameters.ts` · `TiemposComidaPanel`, `CategoriasEdadTabla`

### ParametrosTiempoComida

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | enum TiempoComida | Sí | No | Sí | Fijo | No | Sí | No | — | Catálogo fijo | Bital/ApiNegocio |
| label | Comida | string | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| activo | Activo | boolean | Sí | No | Sí | Sí | Sí | Sí | No | — | — | localStorage → Bital |
| hitos | Hitos | array HitoTiempo | Sí | No | Sí | Sí | Sí | No | No | HitoTiempo 1:N | Secuencia operativa | Bital/ApiNegocio |
| ventanaCambios.inicio | Inicio cambios | time | Sí | No | Sí | Sí | Sí | No | No | — | HH:mm | Bital/ApiNegocio |
| ventanaCambios.fin | Fin cambios | time | Sí | No | Sí | Sí | Sí | No | No | — | fin > inicio | Bital/ApiNegocio |
| ventanaCambios.label | Etiqueta ventana | string | Sí | No | Sí | Sí | Sí | No | No | — | UI | Bital/ApiNegocio |

### HitoTiempo

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | string | Sí | No | Sí | Sí | No | No | No | — | — | Bital/ApiNegocio |
| label | Hito | string | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| hora | Hora | time | Sí | No | Sí | Sí | Sí | No | No | — | HH:mm 24h | localStorage |

### CategoriaEdad

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| nombre | Categoría | string | Sí | No | Sí | Sí | Sí | Sí | No | — | — | mock → Bital |
| rangoMin | Mínimo | integer | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| rangoMax | Máximo | integer | Sí | No | Sí | Sí | Sí | No | No | — | max >= min | Bital/ApiNegocio |
| unidad | Unidad | enum | Sí | No | Sí | Sí | Sí | No | No | — | Años/Meses/Días | Bital/ApiNegocio |
| estado | Estado | enum EstadoCategoria | Sí | No | Sí | Sí | Sí | Sí | No | — | activo/borrador | Bital/ApiNegocio |

### ConfigTiempos (persistido localStorage)

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| activos | Comidas activas | Record TiempoComida→bool | Sí | No | Sí | Sí | Sí | No | No | — | — | localStorage |
| modoCarga | Carga anticipada | enum ModoCargaAnticipada | Sí | No | Sí | Sí | Sí | No | No | — | — | localStorage |
| horasPorComida | Horas por hito | Record anidado | Sí | No | Sí | Sí | Sí | No | No | HitoTiempo | — | localStorage |

---

## FilaAuditoria / DetalleAuditoria (Dietas)

**Evidencia:** `types/audit.ts` · `AuditoriaTabla`, `AuditoriaDetalleSheet`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| codigoAuditoria | Código | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| fechaHora | Fecha y hora | datetime | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| usuario.nombre | Usuario | string | Sí | No | Sí | Auto | No | Sí | No | Usuario | — | Bital/ApiNegocio |
| usuario.rol | Rol | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| usuario.iniciales | Iniciales | string | Sí | No | Sí | Auto | No | No | Sí | — | — | calculado frontend |
| usuario.esSistema | Sistema | boolean | No | Sí | Sí | Auto | No | Sí | No | — | Jobs automáticos | Bital/ApiNegocio |
| modulo | Módulo | enum ModuloAuditoria | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| accion | Acción | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| registroId | ID registro | string | Sí | No | Sí | Auto | No | Sí | No | Entidad afectada | — | Bital/ApiNegocio |
| cambios | Cambios | CambioAuditoria | Sí | No | Sí | Auto | No | No | No | — | diff o texto | Bital/ApiNegocio |
| resultado | Resultado | enum ResultadoAuditoria | Sí | No | Sí | Auto | No | Sí | No | — | exitoso/fallido | Bital/ApiNegocio |

**DetalleAuditoria** añade: `entidad`, `parametro`, `valorAnterior`, `valorNuevo`, `justificacion`, `impacto.*`, `metadatos.*`, `historial[]`, `mensajeError` — todos **solo lectura**, origen **Bital/ApiNegocio**, evidencia `AuditoriaDetalleSheet`.

---

## UsuarioModulo (Dietas)

**Evidencia:** `types/users.ts` · `UsuariosTabla`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | Usuario plataforma | — | Bital/ApiNegocio |
| nombre | Nombre | string | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| usuario | Usuario | string | Sí | No | Sí | Sí | Cond. | Sí | No | — | Login | Bital/ApiNegocio |
| correo | Correo | string | Sí | No | Sí | Sí | Sí | Sí | No | — | Email válido | Bital/ApiNegocio |
| rol | Rol | enum RolDietas | Sí | No | Sí | Sí | Sí | Sí | No | — | Validar permisos | Bital/ApiNegocio |
| servicioArea | Servicio / área | string | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| orgProveedora | Org. proveedora | string | No | Sí | Sí | Cond. | Sí | Sí | No | — | Si rol Proveedor | Bital/ApiNegocio |
| estado | Estado | enum EstadoUsuario | Sí | No | Sí | Sí | Sí | Sí | No | — | activo/inactivo | Bital/ApiNegocio |
| ultimoAcceso | Último acceso | datetime | Sí | No | Sí | Auto | Auto | Sí | No | — | — | Bital/ApiNegocio |
| origen | Origen | enum OrigenUsuario | Sí | No | Sí | Auto | No | Sí | No | — | Vital API / Bital | Bital/ApiNegocio |

---

## EstadoCicloBandejas / EstadoDietasPersistido / DTOs de mutación

### EstadoCicloBandejas

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| ordenes | Órdenes | array OrdenCocina | Sí | No | Sí | Sí | Sí | No | No | OrdenCocina 1:N | — | localStorage |
| etiquetas | Etiquetas | array EtiquetaEnfermera | Sí | No | Sí | Sí | Sí | No | No | EtiquetaEnfermera 1:N | — | localStorage |

### EstadoDietasPersistido

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| filas | Censo operativo | array FilaDieta | Sí | No | Sí | Sí | Sí | No | No | FilaDieta 1:N | — | localStorage |
| ultimaSincronizacion | Última sync | datetime | Sí | No | Sí | Auto | Auto | No | No | — | Censo HIS | localStorage |

### CrearOrdenDesdeDietaInput / ConfirmarDevolucionInput

Campos alineados con `OrdenCocina` y devolución (`motivo`, `observaciones`, `fotoDevolucion`) — **Creación** vía API Negocio; evidencia `types/tray-cycle.ts`, `CicloBandejasContext`.

---

## View models de reportes (solo lectura)

**Tipos:** `FiltrosReportes`, `ReportesKpi`, `ReportesChartItem`, `ReportesSegmento`, `ReportesEstadoDietas`, `ReportesHito`  
**Origen:** mayoría **calculado frontend** desde ciclo y `FilaDieta`; filtros `desde`, `hasta`, `servicio`, `horario` — **Filtro** Sí.  
**Evidencia:** `types/reports.ts`, `ReportesFiltros`, `lib/reportesDesdeCiclo.ts`

---

## AtencionHospitalaria / Paciente / Atencion (HIS)

**Evidencia:** `@/api/types`, `censoRepository.http.ts`, `encuestas/types/repositories.ts`

### AtencionHospitalaria (ApiConsultas)

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| idIngreso | Ingreso | integer | Sí | No | Sí | — | — | Sí | No | Ingreso Vital | — | HIS/ApiConsultas |
| tipoDocumento | Tipo doc. | string | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| cedula | Documento | string | Sí | No | Sí | — | — | Sí | No | Paciente | — | HIS/ApiConsultas |
| nombreCompleto | Paciente | string | Sí | No | Sí | — | — | Sí | No | — | Mapea a FilaDieta | HIS/ApiConsultas |
| pabellon | Pabellón | string | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| cama | Cama | string | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |

### Paciente (ApiConsultas)

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| cedula | Documento | string | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| tipoDocumento | Tipo | string | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| nombreCompleto | Nombre | string | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| edad | Edad | integer | Sí | No | Sí | — | — | No | Sí | — | — | HIS/ApiConsultas |
| sexo | Sexo | string | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| telefono | Teléfono | string | No | Sí | Sí | — | — | No | No | — | Encuestas tel. | HIS/ApiConsultas |
| fechaNacimiento | F. nacimiento | date | No | Sí | Sí | — | — | No | No | — | — | HIS/ApiConsultas |

### Atencion (ApiConsultas)

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| consecutivo | Consecutivo | integer | Sí | No | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| paciente | Paciente | PacienteAtencion | Sí | No | Sí | — | — | No | No | Paciente | Embebido | HIS/ApiConsultas |
| fechaAdmision | Admisión | datetime | No | Sí | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| fechaEgreso | Egreso | datetime | No | Sí | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| estaActivo | Activo | boolean | No | Sí | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |
| estadoActual | Estado | string | No | Sí | Sí | — | — | Sí | No | — | — | HIS/ApiConsultas |

---

# Encuestas SIAO

## PacienteEncontrado

**Evidencia:** `types/patients.ts` · `PacienteEncontradoCard`, `IdentificacionPacientePage`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| nombre | Paciente | string | Sí | No | Sí | Auto | No | Sí | No | Paciente | — | HIS/ApiConsultas |
| documento | Documento | string | Sí | No | Sí | Auto | No | Sí | No | — | — | HIS/ApiConsultas |
| edad | Edad | integer | Sí | No | Sí | Auto | No | No | Sí | — | — | HIS/ApiConsultas |
| sexo | Sexo | string | Sí | No | Sí | Auto | No | Sí | No | — | — | HIS/ApiConsultas |
| elegible | Elegible | boolean | Sí | No | Sí | Auto | No | Sí | Sí | ReglaActiva | Reglas parametrización | calculado frontend |
| canal | Canal | enum CanalPaciente | Sí | No | Sí | Sí | No | Sí | No | — | presencial/telefonica | Bital/ApiNegocio |
| entidadEps | EPS | string | Sí | No | Sí | Auto | No | Sí | No | — | — | HIS/ApiConsultas |
| contrato | Contrato | string | Sí | No | Sí | Auto | No | Sí | No | — | — | HIS/ApiConsultas |
| servicio | Servicio | string | Sí | No | Sí | Auto | No | Sí | No | — | — | HIS/ApiConsultas |
| puntoAtencion | Punto atención | string | Sí | No | Sí | Auto | No | Sí | No | — | — | HIS/ApiConsultas |
| fechaAtencion | Fecha atención | datetime | Sí | No | Sí | Auto | No | Sí | No | Atencion | — | HIS/ApiConsultas |
| fechaRelativa | Hace | string | Sí | No | Sí | Auto | No | No | Sí | — | "Hace X días" | calculado frontend |

---

## PacientePresencial / PacienteContextoEncuesta

### PacientePresencial

**Evidencia:** `CapturaPresencialPage`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | mock |
| nombre | Paciente | string | Sí | No | Sí | Auto | No | Sí | No | Paciente | — | mock / HIS |
| documento | Documento | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock / HIS |
| servicio | Servicio | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| ubicacion | Ubicación | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| aseguradora | Aseguradora | string | No | Sí | Sí | Auto | No | Sí | No | — | — | mock |
| estado | Estado | enum EstadoPaciente | Sí | No | Sí | Auto | Sí | Sí | No | — | pendiente/completada/... | Bital/ApiNegocio |
| guardadoHace | Guardado | string | No | Sí | Sí | Auto | No | No | Sí | — | — | calculado frontend |
| motivoNoDisponible | Motivo | string | No | Sí | Sí | Sí | Sí | Sí | No | — | Si no_disponible | Bital/ApiNegocio |
| horaReporte | Hora reporte | time | No | Sí | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |

### PacienteContextoEncuesta (wizard captura)

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| nombre | Paciente | string | Sí | No | Sí | Sí | No | No | No | — | Contexto sesión | Bital/ApiNegocio |
| documento | Documento | string | Sí | No | Sí | Sí | No | No | No | — | — | HIS/ApiConsultas |
| eps | EPS | string | Sí | No | Sí | Sí | No | No | No | — | — | HIS/ApiConsultas |
| contrato | Contrato | string | No | Sí | Sí | Sí | No | No | No | — | — | HIS/ApiConsultas |
| servicio | Servicio | string | Sí | No | Sí | Sí | No | No | No | — | — | HIS/ApiConsultas |
| canal | Canal | presencial \| telefonica | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |

---

## FilaCapturaTelefonica / IntentoLlamada

**Evidencia:** `types/capture.ts` · `CapturaTelefonicaPage`, `GestionLlamadaSheet`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | mock |
| paciente | Paciente | string | Sí | No | Sí | Auto | No | Sí | No | Paciente | — | mock / HIS |
| documento | Documento | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock / HIS |
| telefono | Teléfono | string | Sí | No | Sí | Auto | Sí | Sí | No | — | Formato tel. | HIS/ApiConsultas |
| puntoAtencion | Punto | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| servicio | Servicio | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| especialidad | Especialidad | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| eps | EPS | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| fechaCita | Fecha cita | date | Sí | No | Sí | Auto | No | Sí | No | Atencion | — | HIS/ApiConsultas |
| intentos | Intentos | integer | Sí | No | Sí | Auto | Sí | Sí | Sí | IntentoLlamada | Contador | calculado frontend |
| intentosMax | Máx. intentos | integer | Sí | No | Sí | Config | No | No | No | ReglaActiva | — | Bital/ApiNegocio |
| ultimoIntento | Último intento | datetime | No | Sí | Sí | Auto | Auto | Sí | No | — | — | Bital/ApiNegocio |
| horaReintento | Reintento | time | No | Sí | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| estado | Estado | enum EstadoLlamada | Sí | No | Sí | Auto | Sí | Sí | No | — | — | Bital/ApiNegocio |
| historialIntentos | Historial | array IntentoLlamada | Sí | No | Sí | Auto | Sí | No | No | IntentoLlamada 1:N | — | Bital/ApiNegocio |

### IntentoLlamada

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| resultado | Resultado | string / enum ResultadoLlamada | Sí | No | Sí | Sí | No | Sí | No | — | — | Bital/ApiNegocio |
| fecha | Fecha | datetime | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| gestor | Gestor | string | Sí | No | Sí | Auto | No | Sí | No | Usuario | — | Bital/ApiNegocio |
| nota | Nota | text | No | Sí | Sí | Sí | No | No | No | — | — | Bital/ApiNegocio |

---

## Cuestionario / SeccionEditor / PreguntaEditor

**Evidencia:** `types/questionnaires.ts`, `types/questionnaire-editor.ts` · `CuestionariosTabla`, `EditorCuestionarioPage`

### Cuestionario (listado)

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| nombre | Nombre | string | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| descripcion | Descripción | text | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| canal | Canal | enum CanalCuestionario | Sí | No | Sí | Sí | Sí | Sí | No | — | presencial/telefonico/ambos | Bital/ApiNegocio |
| preguntas | # Preguntas | integer | Sí | No | Sí | Auto | Auto | No | Sí | PreguntaEditor | Conteo | calculado frontend |
| estado | Estado | enum EstadoCuestionario | Sí | No | Sí | Sí | Sí | Sí | No | — | activo/inactivo/borrador | Bital/ApiNegocio |
| actualizadoEn | Actualizado | datetime | Sí | No | Sí | Auto | Auto | Sí | No | — | — | Bital/ApiNegocio |

### PreguntaEditor

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| codigoInterno | Código | string | Sí | No | Sí | Sí | Sí | Sí | No | — | Único en cuestionario | Bital/ApiNegocio |
| texto | Pregunta | text | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| descripcion | Ayuda | text | Sí | No | Sí | Sí | Sí | No | No | — | — | Bital/ApiNegocio |
| tipoRespuesta | Tipo | enum TipoRespuesta | Sí | No | Sí | Sí | Cond. | Sí | No | — | escala/opción/texto | Bital/ApiNegocio |
| tipoBadgeLabel | Badge tipo | string | Sí | No | Sí | Auto | No | No | Sí | — | UI | calculado frontend |
| requerida | Requerida | boolean | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| habilitada | Habilitada | boolean | Sí | No | Sí | Sí | Sí | Sí | No | — | Lógica condicional | Bital/ApiNegocio |
| opciones | Opciones | array OpcionRespuesta | Cond. | No | Sí | Sí | Sí | No | No | OpcionRespuesta 1:N | Si opción múltiple/única | Bital/ApiNegocio |
| servicioAplicable | Servicio | string | Sí | No | Sí | Sí | Sí | Sí | No | Servicio | — | Bital/ApiNegocio |
| canalCaptura | Canal | presencial \| llamada | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| logica | Lógica | LogicaCondicional | Sí | No | Sí | Sí | Sí | No | No | CondicionLogica | — | Bital/ApiNegocio |
| comportamientoAlerta | Alerta | string | Sí | No | Sí | Sí | Sí | No | No | — | Respuestas negativas | Bital/ApiNegocio |

### OpcionRespuesta / CondicionLogica / SeccionEditor

Campos: `OpcionRespuesta` (`id`, `texto`, `esNegativa`); `CondicionLogica` (`variable`, `operador`, `valor`); `SeccionEditor` (`titulo`, `preguntas[]`) — origen **Bital/ApiNegocio**, evidencia `PreguntaEditorPanel`, `ConfiguracionLogicaPanel`.

---

## SeccionEncuesta (captura wizard)

**Evidencia:** `types/capture.ts` · `CapturaEncuestaPage`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | string | Sí | No | Sí | Auto | No | No | No | PreguntaEditor | — | Bital/ApiNegocio |
| numero | N.º | integer | Sí | No | Sí | Auto | No | No | No | — | Orden | Bital/ApiNegocio |
| titulo | Sección | string | Sí | No | Sí | Auto | No | No | No | SeccionEditor | — | Bital/ApiNegocio |
| pregunta | Pregunta | text | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| tipo | Tipo | enum TipoPreguntaEncuesta | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| opciones | Opciones | array OpcionUnica | Cond. | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| opcional | Opcional | boolean | No | Sí | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |

---

## FilaEncuestaRealizada / DetalleEncuestaRealizada

**Evidencia:** `types/completed-surveys.ts` · `EncuestasRealizadasTabla`, `DetalleEncuestaSheet`

### FilaEncuestaRealizada

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| consecutivo | Consecutivo | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| fecha | Fecha | datetime | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| paciente | Paciente | string | Sí | No | Sí | Sí | No | Sí | No | Paciente | — | HIS/ApiConsultas |
| documento | Documento | string | Sí | No | Sí | Sí | No | Sí | No | — | — | HIS/ApiConsultas |
| entidad | Entidad / EPS | string | Sí | No | Sí | Auto | No | Sí | No | — | — | HIS/ApiConsultas |
| servicio | Servicio | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock / HIS |
| puntoAtencion | Punto | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| canal | Canal | enum CanalEncuesta | Sí | No | Sí | Sí | No | Sí | No | — | telefono/presencial | Bital/ApiNegocio |
| encuestador | Encuestador | string | Sí | No | Sí | Auto | No | Sí | No | Usuario | — | Bital/ApiNegocio |
| sat | SAT | decimal | No | Sí | Sí | Auto | No | Sí | Sí | Respuestas | Índice satisfacción | calculado frontend |
| nps | NPS | integer | No | Sí | Sí | Auto | No | Sí | Sí | Respuestas | — | calculado frontend |
| estado | Estado | enum EstadoEncuesta | Sí | No | Sí | Auto | Sí | Sí | No | — | completada/anulada | Bital/ApiNegocio |
| comentarioNegativo | Com. negativo | boolean | No | Sí | Sí | Auto | No | Sí | Sí | — | Flag alerta | calculado frontend |
| motivoAnulacion | Motivo anulación | text | No | Sí | Sí | Sí | Sí | Sí | Cond. | — | Si anulada | Bital/ApiNegocio |

### RespuestaEncuestaDetalle

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| numero | N.º | integer | Sí | No | Sí | Auto | No | No | No | PreguntaEditor | — | Bital/ApiNegocio |
| pregunta | Pregunta | string | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| valor | Valor | number | Sí | No | Sí | Sí | Cond. | No | No | — | Escala numérica | Bital/ApiNegocio |
| etiqueta | Etiqueta | string | Sí | No | Sí | Auto | No | No | Sí | — | Texto opción | calculado frontend |
| tono | Tono | enum TonoRespuesta | Sí | No | Sí | Auto | No | Sí | Sí | — | positivo/neutro/negativo | calculado frontend |
| comentarioObligatorio | Comentario | text | No | Sí | Sí | Sí | Cond. | No | No | — | Si respuesta negativa | Bital/ApiNegocio |

---

## FilaBrecha / KpiExperiencia / ReglaActiva

### FilaBrecha

**Evidencia:** `types/indicators.ts` · `BrechasTabla`, `AnalisisBrechasPage`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | mock |
| iniciales | Iniciales | string | Sí | No | Sí | Auto | No | No | Sí | Paciente | — | calculado frontend |
| nombre | Paciente | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock / HIS |
| documento | Documento | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock / HIS |
| fecha | Fecha | date | Sí | No | Sí | Auto | No | Sí | No | Atencion | — | mock |
| servicio | Servicio | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| convenio | Convenio | string | Sí | No | Sí | Auto | No | Sí | No | — | — | mock |
| contacto | Contacto | enum ContactoBrecha | Sí | No | Sí | Auto | Sí | Sí | No | — | valido/invalido/na | Bital/ApiNegocio |
| gestionNombre | Gestor | string | No | Sí | Sí | Sí | Sí | Sí | No | Usuario | — | Bital/ApiNegocio |
| intentos | Intentos | integer | Sí | No | Sí | Auto | Sí | Sí | Sí | — | — | calculado frontend |
| motivo | Motivo | string | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| motivoTono | Tono | enum TonoMotivoBrecha | Sí | No | Sí | Auto | No | Sí | Sí | — | — | calculado frontend |
| estado | Estado | enum EstadoBrecha | Sí | No | Sí | Auto | Sí | Sí | No | — | en_gestion/pendiente/justificado | Bital/ApiNegocio |

### ReglaActiva

**Evidencia:** `types/parameters.ts` · `ParametrosPage`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| descripcion | Regla | text | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| estado | Estado | enum EstadoRegla | Sí | No | Sí | Sí | Sí | Sí | No | — | activa/borrador | Bital/ApiNegocio |
| modificado | Modificado | datetime | Sí | No | Sí | Auto | Auto | Sí | No | — | — | Bital/ApiNegocio |

---

## FilaAuditoriaEncuesta / UsuarioEncuestasModulo

### FilaAuditoriaEncuesta

**Evidencia:** `types/audit.ts` · `AuditoriaTabla` (encuestas)

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| idEvento | ID evento | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| fecha | Fecha | datetime | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| relativo | Hace | string | Sí | No | Sí | Auto | No | No | Sí | — | — | calculado frontend |
| usuarioNombre | Usuario | string | Sí | No | Sí | Auto | No | Sí | No | Usuario | — | Bital/ApiNegocio |
| usuarioRol | Rol | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| modulo | Módulo | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| accion | Acción | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| accionAlerta | Alerta | boolean | No | Sí | Sí | Auto | No | Sí | Sí | — | — | calculado frontend |
| idRegistro | ID registro | string | Sí | No | Sí | Auto | No | Sí | No | Entidad | — | Bital/ApiNegocio |
| idSecundario | ID secundario | string | Sí | No | Sí | Auto | No | Sí | No | — | Paciente/encuesta | Bital/ApiNegocio |
| detalle | Detalle | DetalleAuditoriaEncuesta | Sí | No | Sí | Auto | No | No | No | — | texto/diff | Bital/ApiNegocio |
| resultado | Resultado | enum ResultadoAuditoriaEncuestas | Sí | No | Sí | Auto | No | Sí | No | — | exito/denegado | Bital/ApiNegocio |
| origenIp | IP | string | Sí | No | Sí | Auto | No | Sí | No | — | — | Bital/ApiNegocio |
| origenDispositivo | Dispositivo | string | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |

### UsuarioEncuestasModulo

Estructura **idéntica** a `UsuarioModulo` (Dietas) con `RolEncuestas` y `OrigenUsuarioEncuestas`. Evidencia: `types/users.ts`, `UsuariosTabla` (encuestas).

---

# Transversal

## Usuario (auth)

**Evidencia:** `types/user.ts` · `AuthProvider`, `authService.ts`

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| id | — | uuid | Sí | No | Sí | Auto | No | No | No | — | — | Bital/ApiNegocio |
| email | Correo | string | Sí | No | Sí | Sí | Cond. | Sí | No | — | Login | Bital/ApiNegocio |
| nombre | Nombre | string | Sí | No | Sí | Sí | Sí | Sí | No | — | — | Bital/ApiNegocio |
| iniciales | Iniciales | string | Sí | No | Sí | Auto | No | No | Sí | — | — | calculado frontend |
| esAdministrador | Super Admin | boolean | Sí | No | Sí | Sí | Sí | Sí | No | — | Flag plataforma | Bital/ApiNegocio |
| accesos | Accesos módulo | array AccesoModulo | Sí | No | Sí | Sí | Sí | No | No | AccesoModulo 1:N | — | Bital/ApiNegocio |

## AccesoModulo

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
|-------|-------------|------|-------------|----------|---------|----------|---------------|--------|-----------|----------|--------------|--------|
| moduloId | Módulo | enum ModuloId | Sí | No | Sí | Sí | Sí | Sí | No | — | dietas-cocina/encuestas | Bital/ApiNegocio |
| rol | Rol | string | Sí | No | Sí | Sí | Sí | Sí | No | RolDietas/RolEncuestas | — | Bital/ApiNegocio |

## FiltrosPaginacion / RespuestaPaginada / CamposAuditoriaBase

Tipos de contrato API genérico — **Inferido** para listados futuros. Evidencia: `types/pagination.ts`, `types/audit.ts`. Campos estándar `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `isActive` recomendados en entidades persistidas Bital (ver `11-historicos-y-auditoria.md`).

---

## Inconsistencias detectadas

| Tema | Detalle | Certeza |
|------|---------|---------|
| Rol Encuestas | `RolEncuestas` en tipos = `Encuestador`; `configAccesoModulos` usa `Analista SIAO` / `Operador de encuestas` | Confirmado |
| `ResultadoAuditoria` | Dietas: `exitoso/fallido`; Encuestas: `exito/denegado` | Confirmado |
| `PacienteEncontrado.elegible` | Calculado en frontend; reglas en mock, no en API | Inferido |
| Campos HIS vs operativos | `FilaDieta` mezcla datos Vital y decisiones Bital en una sola fila | Confirmado |

---

**Referencias:** `01-inventario-modulos.md`, `03-relaciones.md`, `07-catalogos-y-parametros.md`
