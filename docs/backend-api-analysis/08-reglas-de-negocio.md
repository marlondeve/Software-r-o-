# 08 — Reglas de negocio

> **Fuente de verdad de tipos:** `frontend/src/modules/dietas-cocina/types/`, `frontend/src/types/`, `frontend/src/modules/encuestas/types/`  
> **Alcance:** Reglas extraídas del código frontend (Confirmado) e inferencias marcadas explícitamente.

---

## Convenciones

| Campo | Descripción |
| ----- | ----------- |
| **ID** | Identificador único sugerido para trazabilidad backend |
| **Nivel** | `Confirmado` = implementado en código; `Inferido` = deducido de UI/mock sin validación server-side |
| **Recomendación backend** | Dónde y cómo replicar la regla en Bital.ApiNegocio |

---

## A. Ciclo operativo de bandejas (cocina → etiquetas → logística)

Referencia principal: `modules/dietas-cocina/lib/cicloBandejasValidaciones.ts`  
Tipos: `OrdenCocina`, `EtiquetaEnfermera`, `EstadoCocina`, `EstadoLogisticaEtiqueta` en `types/kitchen.ts`, `types/labels.ts`, `types/enums.ts`.

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-DC-001** | Checklist obligatorio completo | `OrdenCocina`, `ChecklistItem` | Todos los ítems con `obligatorio: true` deben tener `completado: true` | Permite avanzar a estado `lista` | `checklistObligatorioCompleto()` | Validar en `PATCH /ordenes/{id}/marcar-lista`; rechazar 422 si faltan ítems |
| **RN-DC-002** | Edición de checklist restringida por estado | `OrdenCocina` | `estadoCocina` ∈ `{por_iniciar, en_preparacion}` | Checklist editable | `puedeEditarChecklist()` | Solo permitir actualización de checklist en esos estados |
| **RN-DC-003** | Marcar bandeja como lista | `OrdenCocina` | `estadoCocina === en_preparacion` AND checklist obligatorio completo | Transición a `lista` | `puedeMarcarLista()`, `motivoNoMarcarLista()` | Endpoint atómico con validación de checklist; mensajes de error alineados con frontend |
| **RN-DC-004** | Bloqueo marcar lista — ya despachada/cancelada | `OrdenCocina` | `estadoCocina` ∈ `{despachada, cancelada}` | Acción denegada: "La bandeja ya salió de cocina." | `motivoNoMarcarLista()` | 409 Conflict |
| **RN-DC-005** | Bloqueo marcar lista — ya lista | `OrdenCocina` | `estadoCocina === lista` | Acción denegada: "La bandeja ya está marcada como lista." | `motivoNoMarcarLista()` | Idempotencia: retornar 200 si ya está en `lista` o 409 según política |
| **RN-DC-006** | Bloqueo marcar lista — sin iniciar preparación | `OrdenCocina` | `estadoCocina === por_iniciar` | Acción denegada: "Inicia la preparación antes de marcar como lista." | `motivoNoMarcarLista()` | Forzar secuencia: `por_iniciar` → `en_preparacion` → `lista` |
| **RN-DC-007** | Generar etiqueta | `OrdenCocina` | `estadoCocina === lista` AND `etiquetaGenerada === false` | Permite generar etiqueta y vincular `etiquetaId` | `puedeGenerarEtiqueta()` | `POST /ordenes/{id}/etiquetas`; crear registro `EtiquetaEnfermera` con `estadoLogistica: generada` |
| **RN-DC-008** | Imprimir etiqueta desde orden | `OrdenCocina` | `estadoCocina` ∈ `{lista, despachada}` AND (`etiquetaId != null` OR `etiquetaGenerada`) | Permite impresión | `puedeImprimirEtiquetaOrden()` | Validar existencia de etiqueta antes de marcar `impresa` |
| **RN-DC-009** | Despachar bandeja | `OrdenCocina`, `EtiquetaEnfermera` | `estadoCocina === lista`, etiqueta generada con `etiquetaId`, logística `impresa` o estado etiqueta `impresa`/`reimpresa` | Transición orden a `despachada`; logística coherente | `puedeDespachar()` | `PATCH /ordenes/{id}/despachar`; verificar cadena etiqueta impresa |
| **RN-DC-010** | Imprimir etiqueta (enfermería) | `EtiquetaEnfermera` | `estado` imprimible (`pendiente`, `generada`, `impresa`, `reimpresa` según `estadoEtiquetaImprimible`) | Permite imprimir | `puedeImprimirEtiqueta()` | Centralizar enum de estados imprimibles en backend |
| **RN-DC-011** | Reimprimir etiqueta | `EtiquetaEnfermera` | `estado` ∈ `{impresa, reimpresa}` OR `estadoLogistica === impresa` | Permite reimpresión → `reimpresa` | `puedeReimprimirEtiqueta()` | Auditar cada reimpresión; no retroceder logística |
| **RN-DC-012** | Confirmar pre-entrega | `OrdenCocina`, `EtiquetaEnfermera` | `estadoLogistica === impresa` AND orden `despachada` | Logística → `pre_entregada`; registrar `recibidoPor`, `horaPreEntrega` | `puedeConfirmarPreEntrega()`, `motivoNoConfirmarPreEntrega()` | `PATCH /etiquetas/{id}/pre-entrega`; validar orden vinculada |
| **RN-DC-013** | Confirmar entrega al paciente | `EtiquetaEnfermera` | `estadoLogistica === pre_entregada` | Logística → `entregada`; `horaEntrega` | `puedeConfirmarEntrega()` | `PATCH /etiquetas/{id}/entregar` |
| **RN-DC-014** | Confirmar devolución | `EtiquetaEnfermera` | `estadoLogistica` ∈ `{pre_entregada, entregada}` | Logística → `devuelta`; capturar motivo, observaciones, foto | `puedeConfirmarDevolucion()` | `PATCH /etiquetas/{id}/devolver` con `ConfirmarDevolucionInput` (`types/tray-cycle.ts`) |
| **RN-DC-015** | Cancelar orden de cocina | `OrdenCocina` | `estadoCocina` ∈ `{por_iniciar, en_preparacion, lista}` | Orden → `cancelada` | `puedeCancelarOrdenCocina()` | No cancelar si ya `despachada`; propagar a `FilaDieta` si aplica |
| **RN-DC-016** | Secuencia de seguimiento timeline | `OrdenCocina`, `EtiquetaEnfermera` | Estados cocina + logística determinan paso activo (0–7) | UI muestra progreso Solicitud→Recogida | `cocina/lib/cocinaSeguimiento.ts` | Exponer campo calculado `pasoSeguimiento` o derivar en consulta |
| **RN-DC-017** | Continuar preparación | `OrdenCocina` | Paso seguimiento ≤ 2 AND estado ∈ `{por_iniciar, en_preparacion}` | Permite acciones de preparación | `puedeContinuarPreparacion()` | Alinear con RN-DC-002 y RN-DC-003 |

---

## B. Solicitudes de dieta y estados clínicos

Referencia: `modules/dietas-cocina/dietas/lib/solicitudDieta.ts`, `types/diets.ts` (`FilaDieta`, `EstadoDieta`).

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-DC-018** | Solicitud editable | `FilaDieta` | `estado` ∈ `{no-solicitada, guardado}` | Formulario editable (crear/editar) | `esSolicitudEditable()` | PUT/PATCH solo en esos estados; bloquear en `confirmada`+ |
| **RN-DC-019** | Registrar novedad | `FilaDieta` | `estado` ∈ `{confirmada, devuelta}` | Permite modificación con motivo (`MOTIVOS_NOVEDAD`) | `puedeRegistrarNovedad()` | `POST /dietas/{id}/novedad`; auditar cambio; posible re-confirmación |
| **RN-DC-020** | Cancelar dieta | `FilaDieta` | `estado === confirmada` | Cancelación con motivo (`MOTIVOS_CANCELACION`) | `puedeCancelarDieta()` | `PATCH /dietas/{id}/cancelar`; registrar motivo obligatorio |
| **RN-DC-021** | Cancelación tardía | `FilaDieta` | Fuera de `ventanaCambios` del tiempo de comida (`cancelacionTardia: true`) | Flag visible en UI; flujo diferenciado | `esCancelacionTardia()`, `obtenerVentanaComida()` | Backend debe calcular flag según `ParametrosTiempoComida.ventanaCambios`; no confiar en frontend |
| **RN-DC-022** | Ventana horaria de cambios | `TiempoComida`, parámetros | Hora actual fuera de `[inicio, fin]` de ventana | Bloqueo o marcado tardío de novedades/cancelaciones | `mockParametrosTiempos`, `obtenerVentanaComida()` | Servicio de calendario operativo por comida; timezone institucional |
| **RN-DC-023** | Derivación estado dieta desde ciclo | `FilaDieta`, `OrdenCocina`, `EtiquetaEnfermera` | Orden/etiqueta existen | `EstadoDieta` UI derivado (ej. `devuelta`, `recibida`, `despachada`) | `lib/mapearEstadoDietaOrden.ts` | Backend puede persistir `estadoOperativo` calculado o exponerlo en GET agregado |
| **RN-DC-024** | Confirmación genera orden cocina | `FilaDieta` → `OrdenCocina` | Dieta confirmada | Crear orden con datos paciente/ubicación/dieta | `CicloBandejasContext`, `CrearOrdenDesdeDietaInput` | Transacción: confirmar dieta + crear orden; idempotencia por `(pacienteId, comida, fecha)` |

---

## C. Catálogo, tarifas y conciliación

Referencia: `lib/resolverTarifaDieta.ts`, `dietas-tarifas/lib/dietasTarifasEstilos.ts`, `types/catalog.ts`, `types/reconciliation.ts`.

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-DC-025** | Normalización tipo dieta HIS→catálogo | `DietaCatalogo`, texto tipo | Alias en `ALIAS_TIPO_DIETA` (ej. `General`→`Normal`, `BLANDA`→`Blanda Hospitalaria`) | Nombre canónico para matching | `normalizarNombreTipoDieta()` | Tabla alias en Bital o normalización en capa integración Vital |
| **RN-DC-026** | Resolución tarifa por tipo | `DietaCatalogo` | Catálogo activo (`activa: true`); match exacto, includes o fallback `"Normal"` | `tarifaVigente` aplicable | `resolverTarifaPorTipoDieta()` | `GET /catalogo-dietas/resolver?tipo=&fecha=` con tarifa vigente a fecha operativa |
| **RN-DC-027** | Formato monetario COP | Montos | Locale `es-CO`, separador miles `.`, decimales `,` | Parse/format consistente | `parseMonedaCOP()`, `formatearMonedaCOP()` | Backend: `decimal(18,2)`; API JSON numérico; formateo solo en UI |
| **RN-DC-028** | Solapamiento vigencia tarifa | `TarifaHistorico`, `DietaCatalogo` | Nueva `fechaInicio` cae dentro de rango tarifa `vigente` | Advertencia/bloqueo de solapamiento | `validarSolapamientoVigencia()` | UNIQUE constraint por `(dietaId, vigenciaDesde)`; cerrar tarifa anterior al crear nueva |
| **RN-DC-029** | Tarifa vigente única | `TarifaHistorico` | Solo un registro con `vigente: true` por dieta | Una tarifa activa | `obtenerTarifaVigente()` | Trigger o regla de negocio al activar tarifa |
| **RN-DC-030** | Conciliación por diferencias | `FilaConciliacion` | Comparar cantidades sistema vs facturación y tarifas | Estados: `coincide`, `dif-cantidad`, `dif-tarifa`, `pendiente`, `conciliado-manual` | `types/reconciliation.ts`, `lib/construirConciliacionDesdeCiclo.ts` | Job batch o endpoint `GET /conciliacion?periodo=`; no editar manualmente cantidades sistema |
| **RN-DC-031** | Desactivar dieta catálogo | `DietaCatalogo` | Dieta con órdenes activas | **Inferido:** confirmación antes de inactivar | `DesactivarDietaDialog.tsx` | Validar dependencias; soft-delete (`activa: false`) |

---

## D. Parámetros operativos

Referencia: `types/parameters.ts`, `parametros/lib/clasificarEdadPaciente.ts`, `parametros/datos/mockTiempos.ts`.

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-DC-032** | Clasificación edad paciente | `CategoriaEdad`, edad | Rangos no solapados; categoría `activo` | Tipo paciente asignado | `clasificarEdadPaciente()` | Validar rangos al CRUD categorías; rechazar solapamientos |
| **RN-DC-033** | Tiempos de comida activos | `ParametrosTiempoComida`, `ConfigTiempos` | `activo: true` en comida | Comida disponible en tabs/filtros | `types/parameters.ts` | Config administrable; afecta RN-DC-021/022 |
| **RN-DC-034** | Modo carga anticipada | `ConfigTiempos.modoCarga` | `todas-desde-manana` vs `ventana-por-comida` | Determina cuándo cargar censo/dietas | `mockTiempos`, UI parámetros | Regla de negocio para job de precarga de dietas |

---

## E. Autorización y permisos (reglas de acceso)

Referencia: `lib/permisos.ts`, `lib/configAccesoModulos.ts`, `usuarios/lib/permisosValidaciones.ts`, `lib/modulos.ts`.

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-AUTH-001** | Super Admin equivale a Admin en módulo | `Usuario` | `esAdministrador === true` | `obtenerRolEnModulo()` retorna `"Administrador"` | `lib/modulos.ts` | Claim JWT `platform.admin`; bypass checks módulo |
| **RN-AUTH-002** | Doctor hereda permisos Nutricionista | `RolDietas` | Rol `Doctor` | Mismas rutas que Nutricionista | `resolverRolPermisos()` | Mapear permisos backend: `Doctor` ⊆ `Nutricionista` |
| **RN-AUTH-003** | Rutas dietas por rol (default) | `RolDietas`, `RutaDietas` | Matriz `PERMISOS_POR_ROL_DEFAULT` | Acceso sección sidebar/ruta | `permisos.ts`, `configAccesoModulos.ts` | Policies por claim `dietas-cocina.{recurso}.{accion}` |
| **RN-AUTH-004** | Rol debe incluir Inicio | Permisos rol módulo | Edición permisos sin ruta `inicio` | Validación fallida | `validarPermisosRol()` | Constraint: todo rol módulo tiene al menos `inicio` |
| **RN-AUTH-005** | Gestión usuarios requiere ruta usuarios | `RolDietas` | Rol `Administrador` o ruta `usuarios` en permisos | Puede gestionar usuarios módulo | `puedeGestionarUsuariosRoles()` | `dietas-cocina.admin.users.manage` |
| **RN-AUTH-006** | Cambio a rol Administrador módulo | `UsuarioModulo` | Asignar rol `Administrador` | Advertencia acceso completo módulo | `validarCambioRol()` | Auditar elevación privilegios |
| **RN-AUTH-007** | Guard ruta dietas | Sesión + rol | `puedeAccederRuta(rol, pathname)` false | Redirect a `/dietas-cocina/inicio` | `RequireDietasRuta.tsx` | Middleware autorización por ruta/recurso |
| **RN-AUTH-008** | Flujos enfermería etiquetas | Rol `Enfermera` | Rutas pre-entrega/entrega/devolución | Guard `RequireEnfermeraEtiquetas` | `etiquetas/views/RequireEnfermeraEtiquetas.tsx` | Permisos `dietas-cocina.etiquetas.deliver`, `.return` |
| **RN-AUTH-009** | Encuestas sin restricción aún | `RolEncuestas` | Cualquier rol encuestas | Acceso total a rutas módulo | `encuestas/lib/permisos.ts` (comentario explícito) | **Pendiente:** aplicar `permisosEncuestas` de `configAccesoModulos.ts` |

---

## F. Integración HIS (Vital) vs Bital

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-INT-001** | Censo desde atenciones hospitalarias | `FilaDieta`, atención HIS | `GET /atenciones/hospitalarias` | Mapeo a fila dieta operativa | `lib/mapearAtencionHospitalariaAFilaDieta.ts`, `censoRepository` | ApiNegocio orquesta ApiConsultas; enriquecer con estado Bital |
| **RN-INT-002** | Datos paciente read-only desde Vital | `pacienteId`, `idIngreso`, ubicación | Origen ApiConsultas | Campos HIS no editables en solicitud | `FilaDieta` (`types/diets.ts`) | Separar DTO `PacienteHIS` vs `SolicitudDietaBital` |
| **RN-INT-003** | Usuario origen Vital vs Bital | `UsuarioModulo` | `origen: "Vital API" \| "Bital"` | Distinción procedencia usuario | `types/users.ts`, `types/enums.ts` | SSO/LDAP vs usuarios locales Bital |

---

## G. Auditoría transversal

Referencia: `types/audit.ts` (global y módulo), `modules/dietas-cocina/types/audit.ts`.

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-AUD-001** | Registro auditoría por acción | `FilaAuditoria` | Toda mutación crítica | Log con `codigoAuditoria`, `cambios`, `resultado` | Mock auditoría, tipos | Event sourcing ligero o tabla `audit_log` append-only |
| **RN-AUD-002** | Detalle con justificación e impacto | `DetalleAuditoria` | Cambios parámetros/tarifas/dietas | Campos `justificacion`, `impacto.riesgoClinico`, `impacto.impactoTarifa` | `types/audit.ts` (módulo) | Obligatorio en cambios tarifa y novedades clínicas |
| **RN-AUD-003** | Metadatos sesión | `DetalleAuditoria.metadatos` | Cada evento | IP, dispositivo, sistema | Tipos auditoría | Capturar en middleware; no confiar en cliente |

---

## H. Encuestas SIAO (scaffold — reglas inferidas)

| ID | Descripción | Entidades | Condición | Resultado | Ubicación | Recomendación backend |
| -- | ----------- | --------- | --------- | --------- | --------- | --------------------- |
| **RN-ENC-001** | Captura encuesta vinculada a paciente | Encuesta, Paciente | Identificación previa | Wizard captura | `captura-encuesta/` | Validar paciente existe (HIS o local) antes de iniciar |
| **RN-ENC-002** | Cuestionario versionado | Cuestionario | Editor con preguntas/opciones | Versiones inmutables post-publicación | `editor-cuestionario/` | **Inferido:** no editar respuestas históricas al cambiar cuestionario |
| **RN-ENC-003** | Indicadores agregados | Respuestas | Periodo + filtros | KPIs calculados | `indicadores/` | Endpoints analíticos read-only; no persistir KPIs como campos |

---

## Resumen cuantitativo

| Categoría | Cantidad |
| --------- | -------- |
| Reglas ciclo bandejas (RN-DC-001–017) | 17 |
| Reglas dietas clínicas (RN-DC-018–024) | 7 |
| Reglas tarifas/conciliación (RN-DC-025–031) | 7 |
| Reglas parámetros (RN-DC-032–034) | 3 |
| Reglas autorización (RN-AUTH-001–009) | 9 |
| Reglas integración (RN-INT-001–003) | 3 |
| Reglas auditoría (RN-AUD-001–003) | 3 |
| Reglas encuestas inferidas (RN-ENC-001–003) | 3 |
| **Total documentado** | **52** |

---

## Prioridad de implementación en backend

1. **Críticas (transaccionales):** RN-DC-001–015, RN-DC-018–024 — ciclo operativo completo.
2. **Alta (financiero/clínico):** RN-DC-025–030, RN-AUD-002 — tarifas y conciliación.
3. **Media (configuración):** RN-DC-032–034, RN-AUTH-001–008 — parámetros y RBAC.
4. **Pendiente definición:** RN-AUTH-009, RN-ENC-* — encuestas y permisos no aplicados.
