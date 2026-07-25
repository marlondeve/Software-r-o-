# 09 — Roles y permisos

> **Fuente de verdad:** `frontend/src/types/user.ts`, `frontend/src/types/module.ts`, `frontend/src/lib/configAccesoModulos.ts`, `frontend/src/modules/dietas-cocina/types/enums.ts` (`RolDietas`), `frontend/src/modules/dietas-cocina/lib/permisos.ts`, `frontend/src/modules/dietas-cocina/lib/roles.ts`, `frontend/src/services/authService.ts`

---

## 1. Modelo jerárquico (3 niveles)

```text
Nivel 1 — Super Administrador (plataforma)
    │
    ├── /administracion/* (usuarios, roles, permisos globales)
    ├── Configuración acceso por módulo (ConfiguracionAccesoModulosDialog)
    └── Acceso total a todos los módulos como "Administrador" efectivo
    │
Nivel 2 — Administrador de módulo
    │
    ├── /dietas-cocina/usuarios  (rol Administrador en dietas-cocina)
    └── /encuestas/usuarios      (rol Administrador en encuestas)
    │
Nivel 3 — Roles operativos
    │
    ├── Dietas: Nutricionista, Doctor, Proveedor, Enfermera
    └── Encuestas: Analista SIAO, Operador de encuestas
```

### Nivel 1 — Super Administrador

| Aspecto | Detalle |
| ------- | ------- |
| Flag | `Usuario.esAdministrador === true` (`types/user.ts`) |
| Guard ruta | `RequireAdmin` → `/administracion/*` |
| Función | `usuarioEsAdministrador()` en `lib/modulos.ts` |
| Rol efectivo en módulo | Siempre `"Administrador"` vía `obtenerRolEnModulo()` |
| Mock | Correo prefijo `admin@` (`authService.ts`) |
| **No confundir con** | Administrador de módulo asignado a usuario operativo |

**Capacidades exclusivas plataforma:**
- Crear/editar roles globales (`/administracion/roles` — scaffold)
- Gestionar usuarios institucionales (`/administracion/usuarios` — scaffold)
- Matriz permisos global (`/administracion/permisos` — scaffold)
- Configurar qué roles acceden a cada módulo (`configAccesoModulos.ts` → `rolesConAcceso`)

### Nivel 2 — Administrador de módulo

| Módulo | Rol en `AccesoModulo.rol` | Rutas administrativas |
| ------ | ------------------------- | --------------------- |
| Dietas y Cocina | `"Administrador"` | Todas las secciones + `/dietas-cocina/usuarios` |
| Encuestas SIAO | `"Administrador"` | Todas las secciones + `/encuestas/usuarios` |

**Puede:**
- Gestionar usuarios del módulo (`puedeGestionarUsuariosRoles()`)
- Editar permisos por rol (`EditarPermisosRolDialog`, `configAccesoModulos`)
- Acceder parámetros, auditoría, usuarios del módulo

**No puede:**
- Acceder `/administracion/*`
- Crear roles a nivel plataforma
- Gestionar usuarios de otro módulo

### Nivel 3 — Roles operativos

#### Dietas y Cocina (`RolDietas` en `types/enums.ts`)

| Rol | Alias | Dashboard | Rutas default |
| --- | ----- | --------- | ------------- |
| Nutricionista | — | NutricionistaDashboard | Clínicas*: inicio, dietas, dietas-tarifas, reportes, conciliación, parámetros, auditoría |
| Doctor | — | Comparte Nutricionista (`comparteDashboardNutricion`) | Igual Nutricionista (permisos resueltos como Nutricionista) |
| Proveedor | `"Operador de dietas"` | ProveedorDashboard | inicio, cocina, etiquetas, reportes |
| Enfermera | — | EnfermeraDashboard | inicio, dietas, etiquetas (+ flujos pre-entrega/entrega/devolución) |

\*Clínicas = todas excepto cocina y etiquetas (`RUTAS_CLINICAS` en `permisos.ts`).

#### Encuestas SIAO

| Rol técnico (`configAccesoModulos`) | Alias frontend | Rutas default |
| ----------------------------------- | -------------- | ------------- |
| Administrador | — | Todas |
| Analista SIAO | Encuestador | Todas |
| Operador de encuestas | Encuestador | inicio, captura-presencial, captura-telefonica, encuestas-realizadas |

> **Inconsistencia detectada:** `encuestas/lib/permisos.ts` otorga **todas las rutas a todos los roles** (comentario: "Sin restricciones todavía"). La matriz en `configAccesoModulos.ts` sí diferencia roles pero **no se aplica en runtime** para Encuestas.

---

## 2. Estructura de sesión (`Usuario`)

```typescript
// types/user.ts
interface Usuario {
  id: string
  email: string
  nombre: string
  iniciales: string
  esAdministrador: boolean
  accesos: AccesoModulo[]  // types/module.ts
}

interface AccesoModulo {
  moduloId: "dietas-cocina" | "encuestas"
  rol: string
}
```

Persistencia mock: `sessionStorage` clave `bital:session` (`authService.ts`).

---

## 3. Matriz de permisos técnicos

Convención: `{namespace}.{recurso}.{accion}`

Namespaces:
- `platform.*` — Super Administrador
- `dietas-cocina.*` — Módulo Dietas y Cocina
- `encuestas.*` — Módulo Encuestas SIAO

### 3.1 Platform (`platform.*`)

| Permiso | Acción | Nivel | Alcance | Restricciones |
| ------- | ------ | ----- | ------- | ------------- |
| `platform.auth.login` | Iniciar sesión | Público→Autenticado | Global | Reemplazar mock `authService.ts` |
| `platform.auth.logout` | Cerrar sesión | Autenticado | Global | — |
| `platform.users.read` | Listar usuarios institucionales | Super Admin | `/administracion/usuarios` | Scaffold |
| `platform.users.manage` | CRUD usuarios institucionales | Super Admin | Global | Scaffold |
| `platform.roles.create` | Crear roles globales | Super Admin | `/administracion/roles` | Scaffold |
| `platform.roles.read` | Consultar roles | Super Admin | Global | Scaffold |
| `platform.roles.update` | Editar roles | Super Admin | Global | Scaffold |
| `platform.permissions.read` | Ver matriz permisos | Super Admin | `/administracion/permisos` | Scaffold |
| `platform.permissions.manage` | Editar permisos globales | Super Admin | Global | Scaffold |
| `platform.modules.configure` | Config acceso módulos por rol | Super Admin | `ConfiguracionAccesoModulosDialog` | Persistir en BD, no localStorage |

### 3.2 Dietas y Cocina — Administración módulo

| Permiso | Acción | Rol sugerido | Evidencia frontend |
| ------- | ------ | ------------ | -------------------- |
| `dietas-cocina.admin.users.read` | Listar usuarios módulo | Admin módulo | `usuarios/UsuariosRolesPage.tsx` |
| `dietas-cocina.admin.users.manage` | CRUD usuarios módulo | Admin módulo | `permisosValidaciones.puedeGestionarUsuariosRoles` |
| `dietas-cocina.admin.permissions.read` | Ver permisos por rol | Admin módulo | `RolesPermisosPanel` |
| `dietas-cocina.admin.permissions.edit` | Editar rutas por rol | Admin módulo | `configAccesoModulos.alternarPermisoRutaDietas` |
| `dietas-cocina.auditoria.read` | Consultar auditoría | Admin, Nutricionista, Doctor | Ruta `auditoria` en permisos default |

### 3.3 Dietas y Cocina — Operaciones de negocio

| Permiso | Acción | Roles default | Restricciones |
| ------- | ------ | ------------- | ------------- |
| `dietas-cocina.inicio.read` | Dashboard por rol | Todos | Obligatorio en todo rol (`validarPermisosRol`) |
| `dietas-cocina.dietas.read` | Listar censo/solicitudes | Nutricionista, Doctor, Enfermera, Admin | — |
| `dietas-cocina.dietas.create` | Nueva solicitud | Nutricionista, Doctor, Enfermera | Solo estados `no-solicitada`/`guardado` |
| `dietas-cocina.dietas.update` | Editar solicitud | Nutricionista, Doctor, Enfermera | `esSolicitudEditable()` |
| `dietas-cocina.dietas.confirm` | Confirmar dieta | Nutricionista, Doctor | Genera orden cocina |
| `dietas-cocina.dietas.novelty` | Registrar novedad | Nutricionista, Doctor, Enfermera | Estados `confirmada`/`devuelta` |
| `dietas-cocina.dietas.cancel` | Cancelar dieta | Nutricionista, Doctor | Solo `confirmada` |
| `dietas-cocina.catalog.read` | Ver catálogo/tarifas | Nutricionista, Doctor, Admin | — |
| `dietas-cocina.catalog.manage` | CRUD catálogo/tarifas | Admin, Nutricionista | — |
| `dietas-cocina.cocina.read` | Ver órdenes cocina | Proveedor, Admin | — |
| `dietas-cocina.cocina.prepare` | Iniciar/continuar preparación | Proveedor | Estados `por_iniciar`/`en_preparacion` |
| `dietas-cocina.cocina.checklist.update` | Marcar checklist | Proveedor | `puedeEditarChecklist()` |
| `dietas-cocina.cocina.complete` | Marcar lista | Proveedor | `puedeMarcarLista()` |
| `dietas-cocina.cocina.dispatch` | Despachar | Proveedor | `puedeDespachar()` |
| `dietas-cocina.cocina.cancel` | Cancelar orden | Proveedor, Admin | `puedeCancelarOrdenCocina()` |
| `dietas-cocina.etiquetas.generate` | Generar etiqueta | Proveedor | `puedeGenerarEtiqueta()` |
| `dietas-cocina.etiquetas.print` | Imprimir/reimprimir | Proveedor, Enfermera | — |
| `dietas-cocina.etiquetas.pre-deliver` | Pre-entrega | Enfermera | `RequireEnfermeraEtiquetas` |
| `dietas-cocina.etiquetas.deliver` | Entrega paciente | Enfermera | `puedeConfirmarEntrega()` |
| `dietas-cocina.etiquetas.return` | Devolución | Enfermera | `puedeConfirmarDevolucion()` |
| `dietas-cocina.reportes.read` | Reportes/KPIs | Nutricionista, Doctor, Proveedor, Admin | — |
| `dietas-cocina.reportes.export` | Exportar reportes | Nutricionista, Doctor, Admin | **Inferido** |
| `dietas-cocina.reconciliation.read` | Conciliación | Nutricionista, Doctor, Admin | — |
| `dietas-cocina.reconciliation.manage` | Conciliación manual | Nutricionista, Admin | Estado `conciliado-manual` |
| `dietas-cocina.params.read` | Ver parámetros | Nutricionista, Doctor, Admin | — |
| `dietas-cocina.params.manage` | Editar tiempos/tipos paciente | Admin | — |
| `dietas-cocina.census.sync` | Actualizar censo HIS | Nutricionista, Doctor, Admin | `censoRepository` |

### 3.4 Encuestas SIAO

| Permiso | Acción | Roles sugeridos (config) | Estado aplicación |
| ------- | ------ | ------------------------ | ----------------- |
| `encuestas.admin.users.manage` | Usuarios módulo | Administrador | Scaffold UI |
| `encuestas.admin.permissions.edit` | Permisos por rol | Administrador | **No aplicado** |
| `encuestas.patients.identify` | Identificar paciente | Operador, Analista | Scaffold |
| `encuestas.capture.presencial` | Captura presencial | Operador | Scaffold |
| `encuestas.capture.phone` | Captura telefónica | Operador | Scaffold |
| `encuestas.capture.submit` | Registrar encuesta | Operador | Scaffold |
| `encuestas.surveys.read` | Encuestas realizadas | Todos | Scaffold |
| `encuestas.questionnaires.read` | Listar cuestionarios | Analista, Admin | Scaffold |
| `encuestas.questionnaires.manage` | Editor cuestionarios | Analista, Admin | Scaffold |
| `encuestas.indicators.read` | Indicadores | Analista, Admin | Scaffold |
| `encuestas.gaps.read` | Análisis brechas | Analista, Admin | Scaffold |
| `encuestas.params.manage` | Parámetros | Admin | Scaffold |
| `encuestas.auditoria.read` | Auditoría | Admin, Analista | Scaffold |
| `encuestas.respond` | Alias captura encuesta | Operador | **Inferido** |

---

## 4. Matriz rutas ↔ permisos (Dietas y Cocina)

Fuente: `PERMISOS_POR_ROL_DEFAULT` + overrides `configAccesoModulos.permisosDietas`

| Ruta (`RutaDietas`) | Admin | Nutricionista | Doctor | Proveedor | Enfermera |
| ------------------- | :---: | :-----------: | :----: | :-------: | :-------: |
| inicio | ✓ | ✓ | ✓ | ✓ | ✓ |
| dietas | ✓ | ✓ | ✓ | — | ✓ |
| dietas-tarifas | ✓ | ✓ | ✓ | — | — |
| cocina | ✓ | — | — | ✓ | — |
| etiquetas | ✓ | — | — | ✓ | ✓ |
| reportes | ✓ | ✓ | ✓ | ✓ | — |
| conciliacion | ✓ | ✓ | ✓ | — | — |
| parametros | ✓ | ✓ | ✓ | — | — |
| auditoria | ✓ | ✓ | ✓ | — | — |
| usuarios | ✓ | — | — | — | — |

Guard: `RequireDietasRuta` valida contra `puedeAccederRuta()`.

---

## 5. Matriz rutas ↔ permisos (Encuestas — configuración vs runtime)

| Ruta | Config Admin | Config Analista | Config Operador | Runtime actual |
| ---- | :----------: | :-------------: | :-------------: | :------------: |
| inicio | ✓ | ✓ | ✓ | ✓ todos |
| captura-presencial | ✓ | ✓ | ✓ | ✓ todos |
| captura-telefonica | ✓ | ✓ | ✓ | ✓ todos |
| encuestas-realizadas | ✓ | ✓ | ✓ | ✓ todos |
| cuestionarios | ✓ | ✓ | — | ✓ todos ⚠️ |
| indicadores | ✓ | ✓ | — | ✓ todos ⚠️ |
| analisis-brechas | ✓ | ✓ | — | ✓ todos ⚠️ |
| parametros | ✓ | ✓ | — | ✓ todos ⚠️ |
| usuarios | ✓ | ✓ | — | ✓ todos ⚠️ |
| auditoria | ✓ | ✓ | — | ✓ todos ⚠️ |

⚠️ = Discrepancia entre `configAccesoModulos.permisosEncuestas` y `encuestas/lib/permisos.ts`.

---

## 6. Guards y enforcement frontend

| Guard | Ubicación | Función |
| ----- | --------- | ------- |
| `RequireAuth` | `features/autenticacion/` | Sesión activa |
| `RequireModuleAccess` | `features/autenticacion/` | `usuarioTieneAcceso(moduloId)` |
| `RequireAdmin` | `features/autenticacion/` | `esAdministrador` |
| `RequireDietasRuta` | `features/autenticacion/` | Permisos ruta dietas |
| `RequireEnfermeraEtiquetas` | `etiquetas/views/` | Flujos logísticos enfermería |
| `GuestRoute` | `features/autenticacion/` | Solo no autenticados en `/login` |

**Gap backend:** Ningún guard valida permisos a nivel de acción (solo rutas). El backend debe implementar autorización fina por endpoint.

---

## 7. Propuesta JWT / claims

```json
{
  "sub": "uuid-usuario",
  "email": "nutricionista@clinicadelrio.com.co",
  "platform_admin": false,
  "modules": [
    {
      "id": "dietas-cocina",
      "role": "Nutricionista",
      "permissions": [
        "dietas-cocina.inicio.read",
        "dietas-cocina.dietas.read",
        "dietas-cocina.dietas.create"
      ]
    }
  ]
}
```

Super Admin: `"platform_admin": true` + permisos wildcard `platform.*`, `dietas-cocina.*`, `encuestas.*`.

---

## 8. Usuarios mock de referencia (`authService.ts`)

| Correo (prefijo) | Tipo | Rol(es) |
| ---------------- | ---- | ------- |
| `admin@` | Super Admin | Administrador en ambos módulos |
| `nutricionista@` | Operativo | Nutricionista |
| `doctor@` | Operativo | Doctor |
| `proveedor@` / `dietas@` | Operativo | Proveedor |
| `enfermera@` | Operativo | Enfermera |
| `encuestas@` | Operativo | Analista SIAO |
| Otros | Mixto default | Proveedor + Operador encuestas |

**Pendiente:** Usuario mock dedicado como Administrador de módulo sin ser Super Admin.
