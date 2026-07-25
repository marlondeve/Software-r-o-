Actúa como arquitecto de software, analista funcional y desarrollador backend senior.

Necesito que realices una auditoría extremadamente detallada de todo el frontend de este proyecto para identificar la información que deberá manejar la API del backend.

---

## Contexto del proyecto BITAL

### Cliente e identidad

| Concepto | Valor |
| -------- | ----- |
| Nombre código | **BITAL** |
| Cliente | **Clínica del Río** (Colombia) |
| Tipo de repositorio | Monorepo (`pnpm workspaces`) |
| Raíz del repo | `Software-r-o-/` |

La institución aún no ha definido el nombre comercial definitivo de la plataforma.

### Arquitectura general

```text
Frontend (React/Vite, puerto 5173)
      ↓
Bital.ApiNegocio (puerto 5042)     ← único punto de entrada del frontend (scaffold)
      ↓
Bital.ApiConsultas (puerto 5013)   ← bridge read-only hacia Vital HIS (implementada)
      ↓
SQL Server (Vital)
```

| Componente | Ubicación | Estado actual |
| ---------- | --------- | ------------- |
| Frontend React | `frontend/` | Shell compartido + módulos de negocio |
| Módulo Dietas y Cocina | `frontend/src/modules/dietas-cocina/` | **Prototipo funcional** (único módulo con flujos operativos completos) |
| Módulo Encuestas SIAO | `frontend/src/modules/encuestas/` | **Scaffold** de pantallas y navegación |
| Administración transversal | `frontend/src/features/administracion/` | **Scaffold** (solo Super Administrador) |
| Bital.ApiConsultas | `backend/Bital.ApiConsultas/` | Implementada (pacientes, atenciones, health, Swagger) |
| Bital.ApiNegocio | `backend/Bital.ApiNegocio/` | Scaffold; pendiente exposición de endpoints de negocio |
| Autenticación real | — | Pendiente (mock en frontend) |
| Integración frontend ↔ backend | Parcial | Censo hospitalario conectado vía ApiConsultas |

**Importante para la auditoría:** el frontend **no debe consumir ApiConsultas directamente en producción**. ApiConsultas es un servicio interno read-only hacia el HIS Vital. Los endpoints de negocio que el frontend necesite (dietas, órdenes, etiquetas, encuestas, etc.) deben diseñarse en **Bital.ApiNegocio**, que orquestará consultas al HIS cuando corresponda.

### Stack del frontend

React 19 · Vite 8 · TypeScript 6 · Tailwind CSS v4 · shadcn/ui · React Router 7 · React Hook Form · Zod · Recharts · TanStack Table · Axios

Alias de importación: `@/` → `frontend/src/`

### Estructura del frontend

```text
frontend/src/
├── app/                    # Router principal (router.tsx)
├── components/             # Layout (Sidebar, TopBar, MainLayout), UI compartida (shadcn)
├── features/               # Autenticación, administración transversal
│   ├── autenticacion/      # AuthProvider, guards de ruta
│   └── administracion/     # usuarios, roles, permisos (solo admin)
├── api/                    # Capa HTTP global → Bital.ApiConsultas
├── modules/                # Módulos de negocio
│   ├── dietas-cocina/      # Prototipo funcional
│   └── encuestas/          # Scaffold
├── services/              # authService (mock)
├── lib/                    # Utilidades globales
├── hooks/
├── types/
└── estilos/
```

### Flujo de navegación

```text
/login → /modulos → /dietas-cocina/* | /encuestas/*
                         ↓
              /administracion/* (solo Super Administrador, no es módulo seleccionable)
```

Definido en `frontend/src/app/router.tsx`.

### Módulos y rutas

#### 1. Dietas y Cocina (`/dietas-cocina`) — prototipo funcional

Subsecciones y rutas reales:

| Sección | Ruta | Carpeta principal |
| ------- | ---- | ----------------- |
| Inicio (dashboard por rol) | `/dietas-cocina/inicio` | `inicio/` |
| Gestión de dietas | `/dietas-cocina/dietas` | `dietas/` |
| Catálogo y tarifas | `/dietas-cocina/dietas-tarifas` | `dietas-tarifas/` |
| Cocina y seguimiento | `/dietas-cocina/cocina` | `cocina/` |
| Etiquetas (QR, entrega, devolución) | `/dietas-cocina/etiquetas/*` | `etiquetas/` |
| Reportes | `/dietas-cocina/reportes` | `reportes/` |
| Conciliación | `/dietas-cocina/conciliacion` | `conciliacion/` |
| Parámetros | `/dietas-cocina/parametros/tiempos`, `/tipos-paciente` | `parametros/` |
| Auditoría | `/dietas-cocina/auditoria` | `auditoria/` |
| Usuarios y roles | `/dietas-cocina/usuarios` | `usuarios/` |

Rutas anidadas de etiquetas (flujo enfermería):

- `/dietas-cocina/etiquetas/consulta/:codigo`
- `/dietas-cocina/etiquetas/pre-entrega`
- `/dietas-cocina/etiquetas/entrega`
- `/dietas-cocina/etiquetas/devolucion`
- `/dietas-cocina/etiquetas/exito`

Contextos compartidos del módulo (estado operativo):

- `context/CicloBandejasContext.tsx` — ciclo de bandejas (órdenes cocina, etiquetas, entregas, devoluciones)
- `context/DietasOperativasContext.tsx` — censo operativo de dietas

Repositorios del módulo (`modules/dietas-cocina/api/`):

- `censoRepository` — mock / HTTP (censo hospitalario)
- `cicloBandejasRepository` — mock / HTTP
- `dietasRepository` — stub HTTP (TODO backend)

#### 2. Encuestas SIAO (`/encuestas`) — scaffold

| Sección | Ruta | Carpeta principal |
| ------- | ---- | ----------------- |
| Inicio | `/encuestas/inicio` | `inicio/` |
| Identificación paciente | `/encuestas/identificacion-paciente` | `identificacion-paciente/` |
| Captura presencial | `/encuestas/captura-presencial` | `captura-presencial/` |
| Captura telefónica | `/encuestas/captura-telefonica` | `captura-telefonica/` |
| Captura de encuesta (wizard) | `/encuestas/captura-encuesta` | `captura-encuesta/` |
| Encuesta registrada | `/encuestas/captura-encuesta/registrada` | `captura-encuesta/` |
| Encuestas realizadas | `/encuestas/encuestas-realizadas` | `encuestas-realizadas/` |
| Cuestionarios | `/encuestas/cuestionarios` | `cuestionarios/` |
| Editor de cuestionario | `/encuestas/cuestionarios/:cuestionarioId/editor` | `editor-cuestionario/` |
| Indicadores | `/encuestas/indicadores` | `indicadores/` |
| Análisis de brechas | `/encuestas/analisis-brechas` | `analisis-brechas/` |
| Parámetros | `/encuestas/parametros` | `parametros/` |
| Usuarios y roles | `/encuestas/usuarios` | `usuarios/` |
| Auditoría | `/encuestas/auditoria` | `auditoria/` |

Repositorio del módulo: `modules/encuestas/api/pacientesRepository` (mock / HTTP).

#### 3. Administración global (`/administracion`) — scaffold, solo Super Administrador

Área transversal de la plataforma. **No es un módulo seleccionable** en `/modulos`; se accede desde el TopBar cuando el usuario es Super Administrador (`RequireAdmin`).

| Sección | Ruta | Propósito |
| ------- | ---- | --------- |
| Usuarios | `/administracion/usuarios` | Gestión institucional de usuarios |
| Roles | `/administracion/roles` | **Creación y administración de roles** a nivel plataforma |
| Permisos | `/administracion/permisos` | Matriz global de permisos |

El Super Administrador es quien define qué roles existen y cómo se relacionan con los módulos. Los administradores de cada módulo **no** tienen acceso a esta sección.

#### 4. Compartidos

- Layout: `frontend/src/components/layout/` (Sidebar, TopBar, MainLayout, AdminLayout)
- Autenticación: `frontend/src/features/autenticacion/`
- API global: `frontend/src/api/` (cliente Axios, pacientes, atenciones, health)

### Modelo de roles y permisos (jerarquía)

El sistema distingue **tres niveles** de autorización. La auditoría debe documentar endpoints y reglas para cada uno por separado.

```text
Super Administrador (plataforma)
      │
      ├── Crea roles globales (/administracion/roles)
      ├── Gestiona usuarios y permisos institucionales (/administracion/*)
      ├── Configura acceso por módulo (ConfiguracionAccesoModulosDialog)
      └── Acceso total a todos los módulos y secciones
      │
      ├── Administrador de Dietas y Cocina (rol de módulo)
      │     └── Gestiona usuarios, permisos y auditoría del módulo (/dietas-cocina/usuarios)
      │
      ├── Administrador de Encuestas SIAO (rol de módulo)
      │     └── Gestiona usuarios, permisos y auditoría del módulo (/encuestas/usuarios)
      │
      └── Roles operativos (sin administración de plataforma)
            ├── Dietas: Nutricionista, Doctor, Proveedor, Enfermera
            └── Encuestas: Encuestador (Analista SIAO, Operador de encuestas)
```

#### Super Administrador (nivel plataforma)

| Aspecto | Detalle |
| ------- | ------- |
| Flag en frontend | `Usuario.esAdministrador === true` |
| Guard de ruta | `RequireAdmin` → `/administracion/*` |
| Función clave | `usuarioEsAdministrador()` en `lib/modulos.ts` |
| Capacidades | Acceso total; **crear y administrar roles**; gestionar usuarios globales; configurar qué roles tienen acceso a cada módulo |
| En mock | Correo `admin@...` |

Cuando `esAdministrador` es true, `obtenerRolEnModulo()` devuelve `"Administrador"` en cualquier módulo al que tenga acceso, pero eso **no equivale** al rol de Administrador de módulo asignado a un usuario operativo: el Super Administrador opera por encima de la jerarquía modular.

Referencia UI de configuración global: `features/autenticacion/components/ConfiguracionAccesoModulosDialog.tsx` y `lib/configAccesoModulos.ts`.

#### Administrador de módulo (nivel módulo)

Rol `"Administrador"` **dentro de un módulo concreto**, distinto del Super Administrador.

| Módulo | Rol | Rutas permitidas (default) | Gestión de usuarios |
| ------ | --- | ---------------------------- | ------------------- |
| Dietas y Cocina | Administrador | Todas las secciones del módulo | `/dietas-cocina/usuarios` |
| Encuestas SIAO | Administrador | Todas las secciones del módulo | `/encuestas/usuarios` |

Un Administrador de módulo puede:

* Gestionar usuarios y asignar roles **dentro de su módulo**.
* Editar permisos por rol en su módulo (`RolesPermisosPanel`, `EditarPermisosRolDialog`).
* Acceder a parámetros, auditoría y usuarios del módulo.

Un Administrador de módulo **no puede**:

* Acceder a `/administracion/*`.
* Crear roles a nivel plataforma (eso es exclusivo del Super Administrador).
* Gestionar usuarios de otro módulo.

Validaciones relevantes: `modules/dietas-cocina/usuarios/lib/permisosValidaciones.ts` (`puedeGestionarUsuariosRoles`, `validarCambioRol`).

#### Roles operativos por módulo

##### Dietas y Cocina (`modules/dietas-cocina/lib/roles.ts`)

| Rol | Rutas permitidas (default) |
| --- | -------------------------- |
| Nutricionista | inicio, dietas, dietas-tarifas, reportes, conciliación, parámetros, auditoría |
| Doctor | Igual que Nutricionista (comparte dashboard clínico) |
| Proveedor | inicio, cocina, etiquetas, reportes |
| Enfermera | inicio, dietas, etiquetas |

Permisos configurables vía `lib/configAccesoModulos.ts`. Guard de rutas: `RequireDietasRuta`.

Dashboards por rol en `inicio/dashboards/`: NutricionistaDashboard, ProveedorDashboard, EnfermeraDashboard.

##### Encuestas SIAO (`modules/encuestas/lib/roles.ts`)

| Rol | Alias |
| --- | ----- |
| Encuestador | Analista SIAO, Operador de encuestas |

### Autenticación mock

Implementada en `frontend/src/services/authService.ts`. La contraseña puede ser cualquier valor no vacío.

| Correo | Tipo de usuario | Acceso |
| ------ | --------------- | ------ |
| `admin@clinicadelrio.com.co` | **Super Administrador** | Todos los módulos + `/administracion/*` (`esAdministrador: true`) |
| `nutricionista@...` | Operativo Dietas | Nutricionista |
| `doctor@...` | Operativo Dietas | Doctor |
| `dietas@...` / `proveedor@...` | Operativo Dietas | Proveedor |
| `enfermera@...` | Operativo Dietas | Enfermera |
| `encuestas@...` | Operativo Encuestas | Analista SIAO / Encuestador |
| Otros correos | Operador mixto | Proveedor (Dietas) + Operador de encuestas |

**Nota para la auditoría:** hoy el mock no incluye un usuario dedicado solo como Administrador de módulo (sin ser Super Administrador). Documentar ese caso como requisito de backend y marcarlo como *Inferido* o *Pendiente de definición* según corresponda.

Guards: `RequireAuth`, `RequireModuleAccess`, `RequireAdmin` (solo Super Administrador), `RequireDietasRuta`, `RequireEnfermeraEtiquetas`, `GuestRoute`.

### Patrón de datos (mock / HTTP)

Cada módulo usa repositorios con toggle por variable de entorno:

```typescript
// modules/dietas-cocina/api/index.ts
import.meta.env.VITE_DIETAS_COCINA_API === "true" ? censoRepositoryHttp : censoRepositoryMock
```

| Variable | Efecto |
| -------- | ------ |
| `VITE_BITAL_API_BASE_URL` | Base URL ApiConsultas |
| `VITE_BITAL_API_HEALTH_URL` | Health check |
| `VITE_DIETAS_COCINA_API=true` | Censo y ciclo bandejas usan HTTP |
| `VITE_ENCUESTAS_API=true` | Pacientes Encuestas usan HTTP |

Los módulos **no duplican Axios**: delegan a `@/api`.

Datos mock viven en carpetas `datos/mock*.ts` dentro de cada subsección. Persistencia local del ciclo de bandejas: `localStorage` (`lib/cicloBandejasStorage.ts`).

### Backend existente (ApiConsultas)

Documentación de referencia:

- `backend/API-FRONTEND-PRODUCCION.md` — guía de consumo en producción
- `backend/FRONTEND-API-GUIDE.md` — referencia técnica de endpoints
- `backend/README.md` — arquitectura .NET

Endpoints ya implementados (read-only, HIS Vital):

```http
GET /api/v1/pacientes/search
GET /api/v1/pacientes/{id}
GET /api/v1/pacientes/buscar
GET /api/v1/atenciones
GET /api/v1/atenciones/{id}
GET /api/v1/atenciones/paciente
GET /api/v1/atenciones/hospitalarias
GET /health
```

Primera integración operativa en frontend: **Actualizar censo** en Dietas-Cocina (`GET /atenciones/hospitalarias`), mapeado en `lib/mapearAtencionHospitalariaAFilaDieta.ts`.

Tablas legacy Vital consultadas: `CAPBAS`, `MAEPAC`, `INGRESOS`.

### Entidades de negocio clave (Dietas y Cocina)

Identificadas en tipos e interfaces del frontend (priorizar en la auditoría):

| Entidad / concepto | Archivos de referencia |
| ------------------ | ---------------------- |
| FilaDieta / solicitud de dieta | `dietas/datos/mockDietas.ts` |
| DietaCatalogo / tarifa | `dietas-tarifas/datos/mockDietasTarifas.ts` |
| OrdenCocina | `cocina/datos/mockCocina.ts` |
| EtiquetaDieta / EtiquetaEnfermera | `etiquetas/datos/mockEtiquetas.ts`, `mockEntregasEnfermera.ts` |
| Ciclo de bandejas | `context/CicloBandejasContext.tsx`, `lib/cicloBandejasValidaciones.ts` |
| Tiempos de comida / restricciones | `parametros/datos/mockTiempos.ts` |
| Tipos de paciente | `parametros/datos/mockTiposPaciente.ts` |
| Conciliación | `conciliacion/` |
| Reportes / KPIs | `reportes/datos/mockReportes*.ts` |
| Auditoría | `auditoria/datos/mockAuditoria.ts` |
| Usuarios del módulo | `usuarios/datos/mockUsuarios.ts` |

Tiempos de comida operativos: desayuno, merienda-manana, almuerzo, merienda-tarde, cena, merienda-noche.

Estados de dieta visibles en UI: definidos en `inicio/components/EstadoBadge.tsx`.

### Entidades de negocio clave (Encuestas SIAO)

| Entidad / concepto | Archivos de referencia |
| ------------------ | ---------------------- |
| Cuestionario / preguntas | `cuestionarios/datos/mockCuestionarios.ts`, `editor-cuestionario/` |
| Captura de encuesta | `captura-encuesta/datos/mockCapturaEncuesta.ts` |
| Encuestas realizadas | `encuestas-realizadas/datos/mockEncuestasRealizadas.ts` |
| Captura presencial / telefónica | `captura-presencial/`, `captura-telefonica/` |
| Indicadores / brechas | `indicadores/datos/` |
| Reglas de parametrización | `parametros/datos/mockParametrosReglas.ts` |
| Auditoría | `auditoria/datos/mockAuditoriaEncuestas.ts` |

### Documentación existente del monorepo

| Documento | Contenido |
| --------- | --------- |
| `README.md` | Visión general del monorepo |
| `frontend/README.md` | Stack, módulos, auth mock, despliegue IIS |
| `backend/README.md` | Arquitectura .NET, ejecución local |
| `backend/API-FRONTEND-PRODUCCION.md` | Endpoints ApiConsultas en producción |
| `backend/FRONTEND-API-GUIDE.md` | Referencia técnica ApiConsultas |

---

## Objetivo principal

Analiza todo el código del frontend (`frontend/src/`) y genera una especificación técnica completa que pueda entregarse al equipo backend para construir **Bital.ApiNegocio** y, cuando aplique, extender la integración con el HIS Vital.

Debes identificar todos los datos que el frontend:

* Consulta.
* Lista.
* Visualiza.
* Registra.
* Edita.
* Actualiza.
* Elimina.
* Activa o inactiva.
* Filtra.
* Busca.
* Ordena.
* Pagina.
* Exporta.
* Importa.
* Valida.
* Calcula.
* Agrupa.
* Relaciona con otros registros.
* Envía mediante formularios.
* Recibe mediante tablas, tarjetas, detalles, reportes, modales o selects.

No debes limitarte únicamente a los formularios visibles. También debes revisar tablas, columnas, filtros, componentes, tipos de TypeScript, interfaces, datos simulados, hooks, estados, contextos, servicios, validaciones, schemas, modales, drawers, selects, comboboxes y cualquier otra referencia a información que pueda provenir del backend.

Distingue explícitamente:

* Datos que ya provienen del HIS vía ApiConsultas (solo lectura).
* Datos que deben persistirse en base de datos Bital (negocio).
* Datos que hoy viven en mock o `localStorage` y requieren backend.

## Instrucciones de análisis

Revisa detalladamente:

* Todas las carpetas dentro de `frontend/src/`.
* Router y rutas en `frontend/src/app/router.tsx`.
* Sidebar y permisos por rol en `components/layout/Sidebar.tsx` y `modules/dietas-cocina/lib/permisos.ts`.
* Componentes de cada módulo en `frontend/src/modules/`.
* Formularios.
* Tablas.
* Columnas.
* Filtros.
* Buscadores.
* Paginadores.
* Modales.
* Drawers.
* Tabs.
* Cards.
* Selects y comboboxes.
* Hooks personalizados.
* Contextos (`CicloBandejasContext`, `DietasOperativasContext`, `AuthProvider`).
* Stores y persistencia local (`cicloBandejasStorage`, `dietasStorage`, `configTiemposStorage`).
* Interfaces y tipos de TypeScript.
* Schemas de Zod.
* Datos mock en carpetas `datos/`.
* Archivos JSON.
* Constantes.
* Capa API global en `frontend/src/api/`.
* Repositorios por módulo en `modules/*/api/`.
* Stubs HTTP con comentarios TODO (ej. `dietasRepository.ts`).
* Propiedades enviadas entre componentes.
* Estados locales relacionados con información de negocio.
* Botones o acciones disponibles para el usuario.
* Reportes, indicadores y dashboards.
* Importaciones y exportaciones (PDF etiquetas, etc.).
* Cualquier dato calculado o derivado.
* Validaciones de ciclo operativo en `lib/cicloBandejasValidaciones.ts`.

Prioriza el módulo **Dietas y Cocina** por ser el único prototipo funcional, pero **no omitas** Encuestas ni Administración.

No realices cambios en el código. Esta tarea es exclusivamente de auditoría, documentación y definición del contrato necesario para el backend.

## Clasificación de los campos

Para cada entidad o recurso identificado, clasifica cada campo según su uso:

* Solo lectura.
* Solo escritura.
* Lectura y escritura.
* Editable.
* No editable después de crear.
* Calculado por backend.
* Calculado por frontend.
* Generado automáticamente.
* Obligatorio.
* Opcional.
* Condicional.
* Filtro.
* Campo de búsqueda.
* Campo para ordenamiento.
* Campo para agrupación.
* Campo para exportación.
* Campo de auditoría.
* Relación con otra entidad.
* Proveniente del HIS (ApiConsultas).
* Persistido en Bital (ApiNegocio).

## Información requerida por cada campo

Para cada campo identificado, documenta:

* Nombre técnico sugerido.
* Nombre visible en la interfaz.
* Descripción funcional.
* Tipo de dato recomendado.
* Longitud máxima, cuando aplique.
* Formato esperado.
* Si es obligatorio.
* Si acepta `null`.
* Valor predeterminado.
* Valores permitidos.
* Validaciones.
* Ejemplo válido.
* Origen del dato.
* Dónde se utiliza en el frontend.
* Operaciones en las que participa.
* Si debe almacenarse en base de datos.
* Si es calculado.
* Si es sensible.
* Si requiere catálogo o tabla maestra.
* Si representa una relación.
* Nombre de la entidad relacionada.
* Posibles reglas de negocio asociadas.

Utiliza tipos backend claros, por ejemplo:

* `string`
* `text`
* `integer`
* `decimal`
* `boolean`
* `date`
* `datetime`
* `time`
* `uuid`
* `enum`
* `array`
* `object`
* `file`
* `image`
* `json`

## Entidades y relaciones

Identifica todas las entidades de negocio que necesita el sistema.

Para cada entidad entrega:

1. Nombre de la entidad.
2. Descripción.
3. Módulo al que pertenece.
4. Campos.
5. Clave primaria sugerida.
6. Campos únicos.
7. Relaciones.
8. Dependencias.
9. Catálogos utilizados.
10. Estados posibles.
11. Reglas de negocio.
12. Operaciones permitidas.
13. Posibles restricciones de eliminación.
14. Campos de auditoría.
15. Posibles índices para consultas frecuentes.

También debes generar un resumen de relaciones indicando:

* Relación uno a uno.
* Relación uno a muchos.
* Relación muchos a muchos.
* Entidad padre.
* Entidad hija.
* Tabla intermedia sugerida.
* Comportamiento esperado al eliminar o inactivar un registro.

## Operaciones CRUD

Para cada entidad determina cuáles operaciones necesita:

* Crear.
* Consultar listado.
* Consultar detalle.
* Actualizar completamente.
* Actualizar parcialmente.
* Eliminar.
* Inactivar.
* Reactivar.
* Duplicar.
* Aprobar.
* Rechazar.
* Cancelar.
* Cerrar.
* Reabrir.
* Exportar.
* Importar.
* Asignar.
* Desasignar.
* Cambiar estado.

No asumas que todos los recursos pueden eliminarse físicamente. Cuando sea más apropiado, recomienda eliminación lógica mediante estados como:

* Activo.
* Inactivo.
* Anulado.
* Eliminado.
* Archivado.

Presta atención al **ciclo operativo de bandejas** (confirmar dieta → crear orden → generar etiqueta → despachar → pre-entrega → entrega → devolución) y documenta transiciones de estado como operaciones de negocio.

## Endpoints requeridos

Para cada entidad propone los endpoints REST necesarios en **Bital.ApiNegocio**.

Utiliza una estructura consistente, por ejemplo:

```text
GET    /api/v1/dietas-cocina/dietas
GET    /api/v1/dietas-cocina/dietas/{id}
POST   /api/v1/dietas-cocina/dietas
PUT    /api/v1/dietas-cocina/dietas/{id}
PATCH  /api/v1/dietas-cocina/dietas/{id}
DELETE /api/v1/dietas-cocina/dietas/{id}
PATCH  /api/v1/dietas-cocina/dietas/{id}/estado
POST   /api/v1/dietas-cocina/ordenes
PATCH  /api/v1/dietas-cocina/ordenes/{id}/despachar
```

Separa endpoints de negocio (ApiNegocio) de consultas HIS (ApiConsultas). Indica cuáles ya existen y cuáles faltan.

Para cada endpoint documenta:

* Método HTTP.
* Ruta.
* API destino (ApiNegocio / ApiConsultas).
* Módulo.
* Descripción.
* Parámetros de ruta.
* Query parameters.
* Headers necesarios.
* Body de la petición.
* Campos obligatorios.
* Campos opcionales.
* Ejemplo de request.
* Ejemplo de response.
* Códigos de respuesta.
* Posibles errores.
* Roles o permisos requeridos.
* Reglas de negocio.
* Efectos secundarios.
* Entidades relacionadas.

## Listados, búsquedas y filtros

Revisa cada tabla o listado del frontend y especifica:

* Columnas visibles.
* Columnas ocultas.
* Filtros disponibles.
* Búsqueda global.
* Filtros avanzados.
* Ordenamiento.
* Paginación.
* Cantidad de registros por página.
* Selección múltiple.
* Acciones por fila.
* Acciones masivas.
* Exportación.
* Estados vacíos.
* Estados de carga.
* Datos necesarios para mostrar cada fila.

Propón los query parameters correspondientes, por ejemplo:

```text
?page=1
&limit=20
&search=
&sortBy=
&sortOrder=asc
&status=
&comida=almuerzo
&dateFrom=
&dateTo=
```

Indica cuáles filtros deben resolverse en backend y cuáles podrían manejarse únicamente en frontend.

## Formularios

Para cada formulario identifica:

* Nombre del formulario.
* Entidad que crea o actualiza.
* Campos.
* Secciones.
* Campos obligatorios.
* Campos opcionales.
* Validaciones.
* Dependencias entre campos.
* Campos condicionales.
* Selects que requieren catálogos.
* Datos precargados.
* Datos calculados.
* Archivos adjuntos.
* Mensajes de error.
* Payload requerido para crear.
* Payload requerido para actualizar.
* Diferencias entre creación y edición.

No incluyas en el payload campos que sean exclusivamente visuales o calculados, salvo que el backend deba recibirlos.

## Catálogos y parámetros

Identifica todos los valores que actualmente estén escritos directamente en el frontend y que probablemente deban administrarse desde backend, como:

* Tipos de dieta / catálogo de dietas.
* Tarifas por dieta y vigencia.
* Estados de dieta, orden, etiqueta y conciliación.
* Tiempos de comida (desayuno, meriendas, almuerzo, cena).
* Restricciones horarias operativas.
* Tipos de paciente y clasificación.
* Tipos de aislamiento.
* Motivos de cancelación / devolución.
* Consistencias.
* Servicios, pabellones, habitaciones, camas (¿HIS vs Bital?).
* Tipos de encuesta / cuestionarios.
* Preguntas y opciones de respuesta.
* Reglas lógicas de encuestas.
* Tipos de usuario: Super Administrador, Administrador de módulo, roles operativos.
* Roles y permisos por módulo.
* Parámetros del sistema.

Por cada catálogo indica:

* Nombre.
* Valores encontrados.
* Módulos donde se utiliza.
* Si debería ser fijo o administrable.
* Endpoint sugerido.
* Campos del catálogo.
* Posibilidad de activar o inactivar opciones.
* Orden de visualización.

## Reglas de negocio

Extrae todas las reglas de negocio que puedan inferirse desde la interfaz o el código.

Ejemplos relevantes en este proyecto:

* Campos que aparecen únicamente bajo una condición.
* Acciones deshabilitadas por estado (validaciones en `cicloBandejasValidaciones.ts`).
* Registros que no pueden editarse según rol o ruta.
* Validaciones de fechas y horarios operativos (`parametros/`).
* Dependencias entre dietas, pacientes, habitaciones y cocina.
* Restricciones para responder encuestas.
* Cálculos de cantidades y tarifas (`resolverTarifaDieta.ts`).
* Tarifas vigentes por fecha.
* Cancelación tardía de dietas fuera de horario de novedades.
* Históricos.
* Estados que habilitan o bloquean acciones en el ciclo de bandejas.
* Validaciones de duplicados.
* Reglas para anulaciones y devoluciones.
* Reglas para aprobación.
* Límites de caracteres.
* Reglas de obligatoriedad.
* Reglas por rol de usuario.

Cada regla debe incluir:

* Código o identificador.
* Descripción.
* Entidades involucradas.
* Condición.
* Resultado esperado.
* Ubicación donde fue detectada.
* Recomendación para implementarla en backend.

## Históricos y auditoría

Determina qué entidades requieren conservar historial.

Presta especial atención a:

* Tarifas.
* Dietas y cambios de estado.
* Órdenes de cocina.
* Etiquetas y entregas.
* Devoluciones con evidencia fotográfica.
* Asignaciones.
* Cambios de habitaciones o camas.
* Modificaciones de pedidos.
* Cambios de respuestas de encuesta.
* Cambios de configuración y parámetros.
* Anulaciones.
* Usuarios responsables.
* Fechas de creación y modificación.

Propón campos estándar como:

```text
id
createdAt
createdBy
updatedAt
updatedBy
deletedAt
deletedBy
isActive
status
```

No agregues estos campos automáticamente a todas las entidades sin justificar su necesidad.

## Autenticación, roles y permisos

Identifica todas las acciones que pueden necesitar control de permisos.

Propón una matriz con:

* Módulo.
* Recurso.
* Acción.
* Rol sugerido.
* Permiso técnico.
* Alcance.
* Restricciones.

Ejemplo:

```text
dietas-cocina.dietas.create
dietas-cocina.dietas.read
dietas-cocina.dietas.update
dietas-cocina.dietas.cancel
dietas-cocina.cocina.read
dietas-cocina.etiquetas.dispatch
dietas-cocina.etiquetas.deliver
encuestas.respond
encuestas.manage
administration.users.manage
```

Documenta la jerarquía de roles en tres niveles:

1. **Super Administrador** — acceso total; creación de roles; `/administracion/*`; flag `esAdministrador`.
2. **Administrador de módulo** — gestión de usuarios, permisos y auditoría **solo dentro de su módulo** (`/dietas-cocina/usuarios`, `/encuestas/usuarios`).
3. **Roles operativos** — Dietas: Nutricionista, Doctor, Proveedor, Enfermera; Encuestas: Encuestador.

Propón permisos diferenciados, por ejemplo:

```text
platform.roles.create          # Solo Super Administrador
platform.roles.read
platform.users.manage          # Super Administrador
platform.modules.configure     # Super Administrador — config acceso por módulo

dietas-cocina.admin.users.manage    # Administrador del módulo Dietas
dietas-cocina.admin.permissions.edit
encuestas.admin.users.manage        # Administrador del módulo Encuestas
encuestas.admin.permissions.edit

dietas-cocina.dietas.create    # Roles operativos según matriz
encuestas.respond
```

Indica qué acciones requiere Super Administrador vs Administrador de módulo vs rol operativo.

Diferencia entre:

* Ver.
* Crear.
* Editar.
* Eliminar.
* Anular.
* Aprobar.
* Exportar.
* Configurar.
* Administrar.

## Archivos y documentos

Identifica si algún módulo requiere:

* Carga de imágenes (ej. evidencia de devolución).
* Archivos PDF (generación de etiquetas vía `generarPdfEtiquetas.ts`).
* Documentos.
* Evidencias.
* Firmas.
* Exportaciones.
* Importaciones masivas.

Para cada caso especifica:

* Tipo de archivo.
* Extensiones permitidas.
* Tamaño máximo sugerido.
* Endpoint.
* Forma de almacenamiento.
* Si debe enviarse como `multipart/form-data`.
* Relación con la entidad correspondiente.

## Reportes e indicadores

Analiza dashboards, cards, gráficas y reportes.

Para cada indicador especifica:

* Nombre.
* Descripción.
* Fuente de datos.
* Fórmula.
* Filtros.
* Periodo.
* Agrupación.
* Endpoint sugerido.
* Ejemplo de respuesta.

Incluye dashboards por rol (Nutricionista, Proveedor, Enfermera) y reportes de conciliación.

No confundas indicadores calculados con campos almacenados.

## Formato obligatorio de entrega

Genera la documentación dentro de una carpeta nueva:

```text
docs/backend-api-analysis/
```

Crea como mínimo los siguientes archivos:

```text
docs/backend-api-analysis/
├── 00-resumen-ejecutivo.md
├── 01-inventario-modulos.md
├── 02-entidades-y-campos.md
├── 03-relaciones.md
├── 04-endpoints.md
├── 05-formularios-y-payloads.md
├── 06-listados-filtros-y-paginacion.md
├── 07-catalogos-y-parametros.md
├── 08-reglas-de-negocio.md
├── 09-roles-y-permisos.md
├── 10-reportes-e-indicadores.md
├── 11-historicos-y-auditoria.md
├── 12-preguntas-para-el-equipo.md
└── 13-matriz-trazabilidad.md
```

## Matriz de campos

En `02-entidades-y-campos.md`, utiliza una tabla por entidad con esta estructura:

| Campo | Etiqueta UI | Tipo | Obligatorio | Nullable | Lectura | Creación | Actualización | Filtro | Calculado | Relación | Validaciones | Origen |
| ----- | ----------- | ---- | ----------- | -------- | ------- | -------- | ------------- | ------ | --------- | -------- | ------------ | ------ |

## Matriz de endpoints

En `04-endpoints.md`, utiliza esta estructura:

| Método | Endpoint | API | Entidad | Operación | Request | Response | Filtros | Permiso | Evidencia frontend |
| ------ | -------- | --- | ------- | --------- | ------- | -------- | ------- | ------- | ------------------ |

## Matriz de trazabilidad

En `13-matriz-trazabilidad.md`, relaciona cada necesidad del frontend con el backend:

| Módulo | Pantalla | Componente | Acción UI | Entidad | Campo | Endpoint | Método | Estado |
| ------ | -------- | ---------- | --------- | ------- | ----- | -------- | ------ | ------ |

En la columna `Estado` utiliza:

* Confirmado.
* Inferido.
* Pendiente de definición.
* No encontrado.

## Evidencia del código

Toda conclusión debe incluir evidencia del frontend.

Para cada campo, endpoint o regla identificada, indica cuando sea posible:

* Ruta del archivo (relativa a `frontend/src/`).
* Nombre del componente.
* Nombre de la interfaz o tipo.
* Nombre de la función.
* Nombre del schema.
* Línea aproximada.
* Fragmento corto relevante.

Ejemplo:

```text
Evidencia:
- Archivo: modules/dietas-cocina/dietas/components/DietasSolicitudSheet.tsx
- Componente: DietasSolicitudSheet
- Campo: tipoDieta
- Uso: select obligatorio para solicitar una dieta
```

No inventes campos ni funcionalidades que no estén respaldados por el código.

Cuando algo sea una recomendación o inferencia, márcalo explícitamente como:

```text
Nivel de certeza: Inferido
```

Cuando se encuentre directamente implementado:

```text
Nivel de certeza: Confirmado
```

## Preguntas pendientes

En `12-preguntas-para-el-equipo.md`, agrega todas las decisiones que no puedan resolverse únicamente revisando el frontend.

Organízalas por:

* Módulo.
* Entidad.
* Pregunta.
* Motivo de la duda.
* Impacto en la API.
* Recomendación preliminar.
* Evidencia relacionada.

Incluye preguntas sobre qué datos deben vivir en Vital vs Bital, y sobre flujos scaffold sin implementación real en Encuestas.

## Reglas importantes

* No modifiques componentes.
* No implementes endpoints.
* No crees servicios reales.
* No cambies interfaces existentes.
* No elimines datos mock.
* No refactorices.
* No instales dependencias.
* No cambies configuración del proyecto.
* No asumas funcionalidades sin marcarlas como inferidas.
* No omitas campos por parecer visualmente poco importantes.
* No analices únicamente las páginas principales.
* Revisa también componentes secundarios y compartidos.
* Evita duplicar entidades que representen el mismo concepto.
* Unifica nombres inconsistentes y documenta las diferencias encontradas.
* Señala campos que tengan nombres diferentes en distintas pantallas.
* Identifica inconsistencias entre formularios, tablas y tipos.
* Identifica campos mostrados en tablas que no estén presentes en formularios.
* Identifica campos enviados por formularios que no se muestren en tablas.
* Identifica botones sin flujo implementado (stubs, `demoToast`, TODOs).
* Identifica filtros sin conexión a datos.
* Identifica persistencia en `localStorage` que deba migrarse a backend.
* Identifica posibles errores en los modelos actuales.
* Usa nombres técnicos en inglés para entidades y propiedades.
* Usa español para toda la documentación y las explicaciones.
* Conserva los textos visibles de la interfaz tal como aparecen.
* No detengas el análisis al encontrar información incompleta; documenta el vacío y continúa con los demás módulos.

## Resultado final esperado

Al finalizar, entrega un resumen con:

1. Cantidad de módulos analizados.
2. Cantidad de pantallas analizadas.
3. Cantidad de componentes revisados.
4. Cantidad de entidades identificadas.
5. Cantidad total de campos identificados.
6. Cantidad de endpoints sugeridos (ApiNegocio vs ApiConsultas).
7. Cantidad de catálogos identificados.
8. Cantidad de reglas de negocio detectadas.
9. Cantidad de preguntas pendientes.
10. Principales inconsistencias encontradas.
11. Riesgos para la construcción de la API.
12. Orden recomendado para implementar el backend.

La documentación debe permitir que un desarrollador backend comprenda exactamente qué datos necesita el frontend, cómo debe recibirlos, cómo debe enviarlos y qué operaciones debe implementar la API, sin tener que revisar inicialmente todo el código del frontend.

Comienza realizando un inventario completo de carpetas, rutas, módulos y componentes en `frontend/src/`. Después continúa con el análisis funcional y finalmente genera todos los documentos solicitados.
