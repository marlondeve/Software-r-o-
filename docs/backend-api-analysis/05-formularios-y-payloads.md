# 05 — Formularios, sheets, dialogs y payloads

> **Alcance:** Formularios identificados en `dietas-cocina/` y `encuestas/`. Para cada uno: campos UI, validaciones frontend, payload sugerido (create vs update) y evidencia de código.

---

## Convenciones generales

| Aspecto | Convención sugerida ApiNegocio |
|---------|-------------------------------|
| Create | `POST` con body completo; servidor asigna `id`, timestamps, usuario |
| Update | `PUT` (reemplazo) o `PATCH` (parcial) según operación |
| Validación | Replicar reglas frontend + reglas de negocio (ventanas horarias, estados) |
| Respuesta | `{ data: Entidad, timestamp, version }` |

---

## Módulo Dietas y Cocina

### 1. Solicitud de dieta (`DietasSolicitudSheet`)

**Evidencia:** `dietas/components/DietasSolicitudSheet.tsx`, `dietas/lib/solicitudDieta.ts`

| Campo UI | Tipo | Obligatorio | Validación frontend | Notas |
|----------|------|-------------|---------------------|-------|
| `comida` | `TiempoComida` | Sí | — | Tabs de 6 tiempos; disabled si no editable |
| `tipoDieta` | string (select catálogo) | Sí | `trim().length > 0` | Catálogo desde `data.tiposDieta` |
| `consistencia` | string (select) | Sí | `trim().length > 0` | Catálogo desde `data.consistencias` |
| `pacienteAislado` | boolean | No | — | Toggle expandible |
| `observacionAislamiento` | string | Condicional | Si aislado activo | |
| `alergico` | boolean | No | — | Toggle expandible |
| `alergias` | string | Condicional | Si alérgico | Texto libre |
| `observaciones` | string | No | — | Textarea preparación/entrega |

**Editabilidad:** Solo si `estado ∈ { no-solicitada, guardado }` (`esSolicitudEditable`).

#### Payload CREATE (primera solicitud — estado `no-solicitada` → `guardado`)

```json
{
  "filaId": "string",
  "comida": "almuerzo",
  "tipoDieta": "Blanda",
  "consistencia": "Normal",
  "aislado": false,
  "observacionAislamiento": "",
  "alergico": true,
  "alergias": "Maní, mariscos",
  "observaciones": "Entregar antes de procedimiento"
}
```

**Endpoint sugerido:** `PUT /api/dietas-cocina/dietas/{id}/solicitud`

#### Payload UPDATE (editar guardado)

Mismo body. El servidor preserva `id`, `pacienteId`, `idIngreso` y actualiza `solicitadoEn`, `solicitadoPor`.

#### Confirmación (acción separada — no es el sheet)

Al confirmar desde detalle o barra masiva:

```json
POST /api/dietas-cocina/dietas/{id}/confirmar
→ { "ordenCocinaId": "ord-diet-..." }
```

**Efecto frontend:** `estado: confirmada` + `crearOrdenDesdeDieta(CrearOrdenDesdeDietaInput)` (`DietasPage.tsx` L173–188).

---

### 2. Novedad de dieta (`DietasNovedadSheet`)

**Evidencia:** `dietas/components/DietasNovedadSheet.tsx`

| Campo UI | Tipo | Obligatorio | Validación |
|----------|------|-------------|------------|
| `comida` | TiempoComida | Sí | Solo comida activa |
| `tipoDieta` | string | Sí | Select catálogo |
| `consistencia` | string | Sí | Select |
| `pacienteAislado` | boolean | No | — |
| `observacionAislamiento` | string | Condicional | — |
| `alergico` | boolean | No | — |
| `alergias` | string | Condicional | — |
| `motivo` | string (select) | Sí | Lista `MOTIVOS_NOVEDAD` |
| `observaciones` | string | No | Resumen cambio |

**Precondición:** `puedeRegistrarNovedad(fila)` → estado `confirmada` o `devuelta`.

#### Payload CREATE/UPDATE

```json
POST /api/dietas-cocina/dietas/{id}/novedad
{
  "comida": "almuerzo",
  "tipoDieta": "Diabética",
  "consistencia": "Líquida clara",
  "aislado": true,
  "observacionAislamiento": "Contacto",
  "alergico": false,
  "alergias": "",
  "motivo": "Cambio clínico",
  "observaciones": "Paciente NPO suspendido"
}
```

**Respuesta:** Fila actualizada; puede re-disparar orden cocina según reglas de negocio.

---

### 3. Cancelación de dieta (`DietasCancelarDialog`)

**Evidencia:** `dietas/components/DietasCancelarDialog.tsx`, `types/enums.ts` (`MOTIVOS_CANCELACION`)

| Campo UI | Tipo | Obligatorio | Validación |
|----------|------|-------------|------------|
| `motivo` | `MotivoCancelacionId` | Sí | Radio: alta-medica, traslado, fallecimiento, npo, error-solicitud, otro |
| `justificacion` | string | Sí | `trim().length > 0` |
| `aceptaFacturacion` | boolean | Condicional | Requerido si `cancelacionTardia === true` |

**Precondición:** `puedeCancelarDieta(fila)` → estado `confirmada`.

#### Payload

```json
POST /api/dietas-cocina/dietas/{id}/cancelar
{
  "motivo": "alta-medica",
  "justificacion": "Paciente egresado a las 14:30",
  "aceptaFacturacion": true
}
```

**Efecto frontend:** Cancela orden cocina vinculada (`cancelarOrdenCocina`), `estado: cancelada`, observaciones `[motivo] justificacion`.

---

### 4. Asignación masiva consistencia (`DietasAsignarConsistenciaDialog`)

**Evidencia:** `DietasPage.tsx` → `asignarConsistenciaMasiva(ids, consistencia)`

#### Payload

```json
PATCH /api/dietas-cocina/dietas/bulk/consistencia
{
  "ids": ["fila-1", "fila-2"],
  "consistencia": "Puré"
}
```

---

### 5. Catálogo dieta — Crear (`CrearDietaSheet` + `DietaCatalogoForm`)

**Evidencia:** `dietas-tarifas/components/CrearDietaSheet.tsx`, `lib/dietaCatalogoFormDefaults.ts`

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `codigo` | string | Sí (create) | Autogenerado `siguienteCodigo`; no vacío |
| `nombre` | string | Sí | `trim().length > 0` |
| `descripcion` | string | No | — |
| `tarifaInicial` | string→number | No | `parseFloat`; si >0 crea histórico |
| `fechaInicio` | date ISO | No | Default hoy |
| `fechaFin` | date ISO | No | Nullable |
| `activa` | boolean | No | Default true → estado `vigente` |

#### Payload CREATE

```json
POST /api/dietas-cocina/catalogo/dietas
{
  "codigo": "D-042",
  "nombre": "Renal",
  "descripcion": "Restricción sodio/potasio",
  "tarifaInicial": 12500,
  "fechaInicio": "2026-07-01",
  "fechaFin": null,
  "activa": true
}
```

---

### 6. Catálogo dieta — Editar (`EditarDietaSheet`)

**Diferencia vs create:** `codigo` read-only; actualiza histórico tarifa vigente in-place.

#### Payload UPDATE

```json
PUT /api/dietas-cocina/catalogo/dietas/{id}
{
  "nombre": "Renal modificada",
  "descripcion": "...",
  "tarifaInicial": 13000,
  "fechaInicio": "2026-07-01",
  "fechaFin": null,
  "activa": true
}
```

---

### 7. Nueva tarifa (`NuevaTarifaSheet`)

**Evidencia:** `dietas-tarifas/components/NuevaTarifaSheet.tsx`

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `monto` | number | Sí | `> 0` |
| `fechaInicio` | date | Sí | No solapamiento (`validarSolapamientoVigencia`) |

#### Payload CREATE (nueva vigencia — no update de monto inline)

```json
POST /api/dietas-cocina/catalogo/dietas/{id}/tarifas
{
  "monto": 14200,
  "fechaInicio": "2027-01-01"
}
```

**Efecto:** Marca tarifas anteriores `vigente: false`, crea entrada histórica, actualiza `tarifaVigente`.

---

### 8. Desactivar dieta (`DesactivarDietaDialog`)

**Payload:**

```json
POST /api/dietas-cocina/catalogo/dietas/{id}/desactivar
{
  "motivo": "Reemplazada por D-043"
}
```

---

### 9. Conciliación — Resolución manual (`ConciliacionDetalleSheet`)

**Evidencia:** `conciliacion/components/ConciliacionDetalleSheet.tsx`

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `motivo` | string (select) | Sí | Toast si vacío |
| `observaciones` | string | Sí | `trim().length >= 10` |

#### Payload PATCH conciliado

```json
PATCH /api/dietas-cocina/conciliacion/{id}/conciliado
{
  "motivo": "Ajuste por devolución tardía",
  "observaciones": "Se validó con factura del 15/07; diferencia aceptada."
}
```

#### Payload PATCH pendiente revisión

```json
PATCH /api/dietas-cocina/conciliacion/{id}/pendiente-revision
{
  "motivo": "Requiere soporte proveedor",
  "observaciones": "Factura adjunta incompleta para el turno cena."
}
```

---

### 10. Devolución bandeja — flujo 3 pasos (`DevolucionFlowPage` + `RegistroDevolucionForm`)

**Evidencia:** `etiquetas/views/DevolucionFlowPage.tsx`, `etiquetas/components/RegistroDevolucionForm.tsx`, `types/tray-cycle.ts`

| Paso | Campo | Tipo | Obligatorio | Validación |
|------|-------|------|-------------|------------|
| 1 | `codigo` | string | Sí | Etiqueta existe; logística `pre_entregada` o `entregada` |
| 2 | `motivo` | `MotivoDevolucion` | Sí | Enum: Rechazo paciente, Condición médica, Error cocina, Temperatura inadecuada |
| 2 | `observaciones` | string | No | Textarea |
| 2 | `fotoDevolucion` | file/base64 | No | JPG/PNG ≤5MB; frontend guarda nombre |
| 3 | — | confirmación | — | Revisión resumen |

#### Payload PATCH devolución

```json
PATCH /api/dietas-cocina/etiquetas/{id}/devolucion
{
  "motivo": "Rechazo del paciente",
  "observaciones": "Paciente con náuseas post-quimio",
  "fotoDevolucion": "https://storage/.../evidencia.jpg"
}
```

**Upload previo (opcional):**

```
POST /api/dietas-cocina/etiquetas/{id}/foto-devolucion
Content-Type: multipart/form-data
file: (binary)
```

---

### 11. Pre-entrega y entrega (flujos etiquetas)

**Pre-entrega:**

```json
PATCH /api/dietas-cocina/etiquetas/{id}/pre-entrega
{ "recibidoPor": "Enf. García" }
```

**Entrega:**

```json
PATCH /api/dietas-cocina/etiquetas/{id}/entrega
{}
```

**Evidencia:** `PreEntregaFlowPage.tsx`, `EntregaFlowPage.tsx`, validaciones en `cicloBandejasValidaciones.ts`.

---

### 12. Parámetros — Tiempos comida (`TiemposComidaFormulario`)

**Evidencia:** `parametros/components/tiempos/TiemposComidaFormulario.tsx`, `mockTiempos.ts`

Por cada `TiempoComida`:

| Campo | Descripción |
|-------|-------------|
| `inicio` / `fin` | Ventana operativa |
| `ventanaCambios.inicio/fin` | Ventana modificaciones |
| `cierreMinutosAntes` | Cierre anticipado |
| `modoCargaAnticipada` | `todas-desde-manana` \| `ventana-por-comida` |

#### Payload UPDATE

```json
PUT /api/dietas-cocina/parametros/tiempos-comida
{
  "comidas": [
    {
      "id": "almuerzo",
      "inicio": "11:00",
      "fin": "14:00",
      "ventanaCambios": { "inicio": "06:00", "fin": "10:30" },
      "cierreMinutosAntes": 30,
      "modoCargaAnticipada": "ventana-por-comida"
    }
  ]
}
```

---

### 13. Usuarios Dietas (`NuevoUsuarioDialog`)

**Evidencia:** `usuarios/components/NuevoUsuarioDialog.tsx`, `types/users.ts`

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `nombre` | string | Sí | trim no vacío |
| `usuario` | string | Sí | trim no vacío |
| `correo` | string | Sí | trim no vacío |
| `rol` | `RolDietas` | Sí | Select ROLES_DIETAS |
| `servicioArea` | string | No | Default "Sin asignar" |

#### Payload CREATE

```json
POST /api/dietas-cocina/usuarios
{
  "nombre": "María Nutrición",
  "usuario": "m.nutricion",
  "correo": "maria@hospital.gov.co",
  "rol": "Nutricionista",
  "servicioArea": "Nutrición clínica",
  "orgProveedora": null,
  "estado": "activo",
  "origen": "Bital"
}
```

**Auto-asignación frontend:** Si `rol === "Proveedor"` → `orgProveedora: "Catering Hospitalario SL"`.

#### Payload UPDATE

```json
PUT /api/dietas-cocina/usuarios/{id}
{ ...mismos campos, preserva estado/origen si no editables }
```

#### Cambiar rol (`CambiarRolDialog`)

```json
PATCH /api/dietas-cocina/usuarios/{id}/rol
{ "rol": "Doctor" }
```

#### Permisos rol (`EditarPermisosRolDialog`)

```json
PUT /api/dietas-cocina/roles/{rol}/permisos
{ "rutas": ["inicio", "dietas", "reportes"] }
```

---

## Módulo Encuestas

### 14. Editor de pregunta (`PreguntaEditorPanel`)

**Evidencia:** `editor-cuestionario/components/PreguntaEditorPanel.tsx`, `types/questionnaire-editor.ts`

| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| `texto` | string | Sí | Textarea pregunta |
| `codigoInterno` | string | Sí | Input monoespaciado |
| `descripcion` | string | No | Instrucción encuestador |
| `tipoRespuesta` | `TipoRespuesta` | Sí | escala, numerico, texto_libre, opcion_unica, opcion_multiple |
| `requerida` | boolean | No | Switch |
| `habilitada` | boolean | No | Switch |
| `opciones[]` | `{ id, texto, esNegativa }` | Condicional | Si tipo ≠ numerico/texto_libre |
| `servicioAplicable` | string | No | Select |
| `canalCaptura` | presencial \| llamada | No | Select |
| `logica` | `LogicaCondicional` | No | Ver panel lógica |
| `comportamientoAlerta` | string | No | — |

#### Payload CREATE pregunta

```json
POST /api/encuestas/cuestionarios/{cuestionarioId}/preguntas
{
  "texto": "¿Cómo califica la atención recibida?",
  "codigoInterno": "Q_SAT_01",
  "descripcion": "Lea la pregunta completa",
  "tipoRespuesta": "escala",
  "requerida": true,
  "habilitada": true,
  "opciones": [
    { "texto": "Muy satisfecho", "esNegativa": false },
    { "texto": "Muy insatisfecho", "esNegativa": true }
  ],
  "servicioAplicable": "Urgencias",
  "canalCaptura": "presencial",
  "logica": { "activa": false, "condiciones": [] },
  "comportamientoAlerta": "ninguno"
}
```

#### Payload UPDATE

```json
PUT /api/encuestas/cuestionarios/{id}/preguntas/{preguntaId}
{ ...campos editables; preservar id opciones existentes }
```

---

### 15. Lógica condicional (`ConfiguracionLogicaPanel`)

**Evidencia:** `editor-cuestionario/components/ConfiguracionLogicaPanel.tsx`

```json
PUT /api/encuestas/cuestionarios/{id}/preguntas/{preguntaId}/logica
{
  "activa": true,
  "condiciones": [
    { "variable": "edad", "operador": ">=", "valor": "65" }
  ]
}
```

---

### 16. Nueva regla parámetros (`NuevaReglaForm`)

**Evidencia:** `parametros/components/NuevaReglaForm.tsx`

| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| `campoDatos` | string (select) | Sí |
| `operador` | string (select) | Sí |
| `valor` | string | Sí |
| `accion` | string (select) | Sí |
| `objetivo` | string (select) | Sí |

#### Payload CREATE

```json
POST /api/encuestas/parametros/reglas
{
  "campoDatos": "EPS del Paciente",
  "operador": "Es exactamente igual a",
  "valor": "Sura EPS",
  "accion": "Mostrar pregunta específica",
  "objetivo": "Calidad del servicio percibido"
}
```

---

### 17. Captura encuesta — respuestas (`SeccionEncuestaCard`, `EscalaSatisfaccionInput`)

**Evidencia:** `captura-encuesta/components/`, `types/capture.ts`

Por sección/pregunta según `TipoPreguntaEncuesta`:

| Tipo | Payload respuesta |
|------|-------------------|
| `escala_satisfaccion` | `{ preguntaId, valor: ValorSatisfaccion }` |
| `opcion_unica` | `{ preguntaId, opcionId }` |
| `texto_libre` | `{ preguntaId, texto }` |

#### Payload guardado parcial

```json
PUT /api/encuestas/captura/{encuestaId}/respuestas
{
  "seccionId": "sec-2",
  "respuestas": [
    { "preguntaId": "p-5", "valor": "satisfecho" },
    { "preguntaId": "p-6", "opcionId": "opt-a" }
  ]
}
```

#### Payload completar

```json
POST /api/encuestas/captura/{encuestaId}/completar
{
  "respuestas": [ ...todas las secciones ],
  "canal": "presencial",
  "encuestadorId": "usr-12"
}
```

---

### 18. Gestión llamada telefónica (`GestionLlamadaSheet`)

**Evidencia:** `captura-telefonica/components/GestionLlamadaSheet.tsx`

| Campo | Tipo | Obligatorio | Condición |
|-------|------|-------------|-----------|
| `resultado` | `ResultadoLlamada` | Sí | Radio |
| `fechaReintento` | date | Condicional | Si `solicita_posterior` |
| `horaReintento` | time | Condicional | Si `solicita_posterior` |
| `observaciones` | string | No | Textarea |

#### Payload

```json
POST /api/encuestas/captura/telefonica/{id}/intento
{
  "resultado": "solicita_posterior",
  "fechaReintento": "2026-07-26",
  "horaReintento": "15:30",
  "observaciones": "Paciente en consulta, llamar tarde"
}
```

---

### 19. Anular encuesta (`AnularEncuestaDialog`)

**Evidencia:** `encuestas-realizadas/components/AnularEncuestaDialog.tsx`

| Campo | Obligatorio | Validación |
|-------|-------------|------------|
| `motivo` | Sí | trim no vacío |
| `entendido` | Sí | Checkbox aceptación irreversible |

```json
POST /api/encuestas/realizadas/{id}/anular
{ "motivo": "Duplicado por error de digitación en documento" }
```

---

### 20. Usuarios Encuestas

Patrón análogo a Dietas §13 con roles `Administrador` | `Encuestador` (`types/enums.ts`).

---

## Matriz create vs update resumida

| Formulario | Create | Update | Acción especial |
|------------|--------|--------|-----------------|
| Solicitud dieta | PUT solicitud (no-solicitada→guardado) | PUT solicitud | POST confirmar |
| Novedad | POST novedad | — | — |
| Cancelación | — | — | POST cancelar |
| Catálogo dieta | POST catalogo/dietas | PUT catalogo/dietas/{id} | POST desactivar |
| Tarifa | POST tarifas | — | — |
| Conciliación | — | PATCH conciliado/pendiente | — |
| Devolución | — | PATCH devolucion | POST foto |
| Pregunta cuestionario | POST preguntas | PUT preguntas/{id} | PUT logica |
| Captura encuesta | POST iniciar | PUT respuestas | POST completar |
| Usuario | POST usuarios | PUT usuarios/{id} | PATCH rol/estado |

---

## Validaciones de negocio pendientes en backend

1. **Ventana horaria:** `obtenerVentanaComida()` + `cierreVentanaMinutos` deben validarse server-side al guardar/confirmar/novedad.
2. **Cancelación tardía:** Flag `cancelacionTardia` + aceptación facturación (`DietasCancelarDialog`).
3. **Transiciones ciclo bandejas:** Replicar `cicloBandejasValidaciones.ts` en PATCH de órdenes/etiquetas.
4. **Solapamiento tarifas:** `validarSolapamientoVigencia` en POST tarifas.
5. **Encuesta anulada:** Auditoría obligatoria (`AnularEncuestaDialog`).
