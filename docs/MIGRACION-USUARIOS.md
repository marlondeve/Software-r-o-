# Migración de usuarios — Dietas y Cocina

Guía para migrar usuarios institucionales desde el sistema de la clínica hacia BITAL (módulo **Dietas y Cocina**). El módulo **Encuestas** comparte la misma tabla de usuarios en base de datos.

---

## Columnas visibles en la tabla (UI)

| Columna en pantalla | Campo real en BD / API | Obligatorio para migrar |
|---------------------|------------------------|-------------------------|
| **Nombre** | `NombreCompleto` | Sí |
| **Usuario** | `Identificacion` | Sí — es el login |
| **Correo** | `Email` | Sí — único |
| **Rol** | `RolModuloId` → `RolesModulo.Nombre` | Sí — GUID del rol |
| **Servicio/Área** | `Observaciones` | No — texto libre |
| **Org. Proveedora** | Parte de `Observaciones` (`Org: …`) o derivado en UI | No — solo si rol Proveedor |
| **Estado** | `Activo` (`true` / `false`) | Sí |
| **Último acceso** | `UltimoAcceso` | No — se llena al iniciar sesión |
| **Origen** | No existe en BD | No — la UI muestra `"Bital"` por defecto |

> **Nota:** La UI muestra columnas que no tienen columna propia en base de datos. Para la migración solo importan los campos de la sección siguiente.

---

## Modelo real en base de datos

### Tabla `bital.UsuariosModulo`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `Id` | `uniqueidentifier` | PK — generar con `NEWID()` |
| `NombreCompleto` | `nvarchar` | Nombre visible del usuario |
| `Email` | `nvarchar` | Correo — **único** |
| `Identificacion` | `nvarchar` | Login — **único** (case-insensitive) |
| `RolModuloId` | `uniqueidentifier` | FK → `bital.RolesModulo` |
| `Activo` | `bit` | `1` = activo, `0` = inactivo |
| `Observaciones` | `nvarchar` | Servicio/área, notas internas |
| `PasswordHash` | `nvarchar` | Hash de la contraseña |
| `UltimoAcceso` | `datetime2` | Opcional — se actualiza al login |
| `CreadoEn` | `datetime2` | Fecha de creación |
| `CreadoPor` | `nvarchar` | Quién creó el registro |
| `ModificadoEn` | `datetime2` | Opcional |
| `ModificadoPor` | `nvarchar` | Opcional |

### Tabla relacionada `bital.RolesModulo`

Los roles deben existir **antes** de insertar usuarios. Cada usuario apunta a un rol mediante `RolModuloId`. Los permisos de acceso al módulo se definen en `bital.PermisosRol`.

---

## Roles del sistema (GUIDs fijos)

| Rol | GUID |
|-----|------|
| Administrador | `11111111-1111-1111-1111-111111000001` |
| Nutricionista | `11111111-1111-1111-1111-111111000002` |
| Proveedor | `11111111-1111-1111-1111-111111000003` |
| Enfermera | `11111111-1111-1111-1111-111111000004` |
| Doctor | `11111111-1111-1111-1111-111111000005` |
| Auxiliar de Cocina | `11111111-1111-1111-1111-111111000006` |

Referencia en código: `backend/Bital.Infrastructure/DietasCocina/RolModuloSeed.cs`

---

## API — Crear usuario

**Endpoint:** `POST /api/v1/dietas-cocina/usuarios`

**Body (JSON):**

```json
{
  "nombreCompleto": "María López",
  "email": "maria.lopez@clinica.com",
  "identificacion": "mlopez",
  "rolModuloId": "11111111-1111-1111-1111-111111000002",
  "observaciones": "Nutrición clínica · Pabellón 3"
}
```

### Reglas de negocio

- `email` e `identificacion` deben ser **únicos**.
- `identificacion` es **obligatoria** — es el nombre de usuario para el login.
- Al crear por API, la contraseña inicial es **igual al valor de `identificacion`**.
- El usuario debe cambiarla en el primer acceso (mínimo 8 caracteres).
- Para editar: `PUT /api/v1/dietas-cocina/usuarios/{id}` (no cambia el rol; eso va en endpoint aparte).
- Para cambiar rol: endpoint de cambio de rol del mismo controlador.
- Para listar: `GET /api/v1/dietas-cocina/usuarios?rolModuloId=&estado=&page=1&pageSize=24`

---

## Mapeo desde datos típicos de la clínica

| Dato en sistema anterior | Campo destino en BITAL |
|--------------------------|------------------------|
| Nombre y apellidos | `NombreCompleto` |
| Usuario / login / cédula usada como login | `Identificacion` |
| Correo institucional | `Email` |
| Rol (Nutricionista, Enfermera, etc.) | `RolModuloId` (GUID del rol) |
| Activo / inactivo | `Activo` |
| Servicio, área, pabellón | `Observaciones` |
| Contraseña | `PasswordHash` (ver sección siguiente) |

### Campos que no migrar como columnas separadas

| Campo UI | Tratamiento |
|----------|-------------|
| `orgProveedora` | Incluir en `Observaciones` como `Org: Catering XYZ` si aplica |
| `origen` | Solo visual — no persiste en BD |
| `ultimoAcceso` | Se actualiza automáticamente al login |

---

## Contraseñas en la migración

Política actual del sistema:

1. **Creación normal:** password = valor de `Identificacion` (hasheada).
2. **Login:** usa `Identificacion` + password.
3. **Restablecer clave:** vuelve a poner password = `Identificacion`.

### Hash para migración SQL

En `backend/scripts/02-MigrateData.sql` el hash se genera así (SHA-256 en hex mayúsculas):

```sql
UPPER(CONVERT(varchar(64), HASHBYTES('SHA2_256', CAST(Identificacion AS varchar(100))), 2))
```

Ejemplo: usuario `nutricionista` → contraseña inicial `nutricionista`.

---

## Script de migración existente en el repo

Archivo: [`backend/scripts/02-MigrateData.sql`](../backend/scripts/02-MigrateData.sql) — sección **3. USUARIOS INSTITUCIONALES**.

El script:

1. Inserta roles en `bital.RolesModulo`.
2. Inserta usuarios en `bital.UsuariosModulo`.
3. Asigna permisos por rol en `bital.PermisosRol`.
4. Genera `PasswordHash` inicial.

### Usuarios de ejemplo incluidos

| NombreCompleto | Email | Identificacion | Rol |
|----------------|-------|----------------|-----|
| Administrador BITAL | admin@clinicadelrio.com | admin | Administrador |
| Nutricionista Clínica | nutricionista@clinicadelrio.com | nutricionista | Nutricionista |
| Jefe de Cocina | cocinero@clinicadelrio.com | cocinero | Proveedor |
| Enfermería Pabellón | enfermera@clinicadelrio.com | enfermera | Enfermera |

### Plantilla para agregar usuarios propios

```sql
;WITH UsuariosSeed AS (
    SELECT *
    FROM (VALUES
        (N'Nombre Completo', N'correo@clinica.com', N'login', @RolNutricionista),
        (N'Otro Usuario',    N'otro@clinica.com',   N'ouser',  @RolEnfermera)
    ) AS v(NombreCompleto, Email, Identificacion, RolModuloId)
)
MERGE bital.UsuariosModulo AS tgt
USING UsuariosSeed AS src
    ON tgt.Email = src.Email
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        Id, NombreCompleto, Email, Identificacion, RolModuloId, Activo,
        PasswordHash, CreadoEn, CreadoPor
    )
    VALUES (
        NEWID(), src.NombreCompleto, src.Email, src.Identificacion, src.RolModuloId, 1,
        UPPER(CONVERT(varchar(64), HASHBYTES('SHA2_256', CAST(src.Identificacion AS varchar(100))), 2)),
        SYSUTCDATETIME(), N'Migracion'
    );
```

---

## Mapeo frontend ↔ backend

El mapper en `frontend/src/modules/dietas-cocina/api/mappers/usuarios.mapper.ts` traduce:

| Frontend (`UsuarioModulo`) | Backend |
|----------------------------|---------|
| `nombre` | `nombreCompleto` |
| `usuario` | `identificacion` |
| `correo` | `email` |
| `rolId` | `rolModuloId` |
| `rol` | `rolNombre` (solo lectura) |
| `servicioArea` | `observaciones` |
| `orgProveedora` | Concatenado en `observaciones` al crear/editar |
| `estado` | `activo` |
| `ultimoAcceso` | `ultimoAcceso` |
| `origen` | No se persiste — default `"Bital"` |

Formulario de alta/edición: `frontend/src/modules/dietas-cocina/usuarios/components/NuevoUsuarioDialog.tsx`

Campos del formulario:

- Nombre completo *(obligatorio)*
- Usuario *(obligatorio)*
- Correo *(obligatorio)*
- Rol *(obligatorio solo al crear)*
- Servicio / Área *(opcional)*

---

## Módulo Encuestas

El módulo **Encuestas** reutiliza la misma infraestructura:

- Tabla: `bital.UsuariosModulo`
- Servicio: `UsuariosPermisosService`
- Endpoints encuestas: `GET/POST /api/v1/encuestas/users` (proxy sobre el mismo backend)

La tabla de usuarios en encuestas muestra los mismos conceptos; la migración es **una sola** para ambos módulos.

---

## Checklist de migración

- [ ] Exportar de la clínica: nombre, login, email, rol, activo, área/servicio.
- [ ] Mapear cada rol antiguo → uno de los 6 roles del sistema (o crear rol custom en `RolesModulo`).
- [ ] Verificar que no haya emails ni logins duplicados.
- [ ] Ejecutar migraciones EF si la BD está vacía: `dotnet ef database update --context BitalNegocioDbContext`
- [ ] Insertar usuarios vía `02-MigrateData.sql` o vía API `POST /usuarios`.
- [ ] Comunicar a cada usuario: login = `Identificacion`, password inicial = mismo valor.
- [ ] Probar login en la pantalla de acceso del módulo.
- [ ] Verificar permisos según rol en la matriz de permisos (`GET /api/v1/dietas-cocina/permisos`).

---

## Referencias en el repositorio

| Recurso | Ruta |
|---------|------|
| Entidad de dominio | `backend/Bital.Domain/Entities/DietasCocina/UsuarioModulo.cs` |
| DTOs API | `backend/Bital.Application/DTOs/DietasCocina/UsuariosPermisosDtos.cs` |
| Servicio | `backend/Bital.Infrastructure/Services/UsuariosPermisosService.cs` |
| Controlador | `backend/Bital.ApiNegocio/Controllers/UsuariosPermisosController.cs` |
| Seed de roles | `backend/Bital.Infrastructure/DietasCocina/RolModuloSeed.cs` |
| Script SQL migración | `backend/scripts/02-MigrateData.sql` |
| Tabla UI | `frontend/src/modules/dietas-cocina/usuarios/components/UsuariosTabla.tsx` |
| Endpoints documentados | `backend/Bital.ApiNegocio/README-ENDPOINTS-DIETAS.md` |
