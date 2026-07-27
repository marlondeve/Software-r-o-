# Migración BitalNegocio — SQL Server 2019+

Guía para desplegar la base de datos operativa **BitalNegocio** e importar datos iniciales desde el HIS Vital (**Hosvital_Pruebas**).

**Audiencia:** DevOps / backend / DBA  
**Última actualización:** 2026-07-26

---

## Resumen

| Base | Rol | Acceso |
|------|-----|--------|
| **BitalNegocio** | Datos operativos Bital (dietas, cocina, usuarios, auditoría) | Lectura/escritura — `Bital.ApiNegocio` |
| **Hosvital_Pruebas** | HIS Vital (pacientes, ingresos hospitalarios) | Solo lectura — no se modifica |

La migración **no escribe en Vital**. Solo lee el censo hospitalario activo y lo replica en `dietas.FilasDietas`.

---

## Archivos del paquete

| Archivo | Función |
|---------|---------|
| [`backend/scripts/Migrate-BitalNegocio.ps1`](../backend/scripts/Migrate-BitalNegocio.ps1) | Orquestador principal (**recomendado**) |
| [`backend/scripts/01-CreateDatabase.sql`](../backend/scripts/01-CreateDatabase.sql) | Crea BD + esquemas `dietas` y `bital` |
| [`backend/scripts/02-MigrateData.sql`](../backend/scripts/02-MigrateData.sql) | Datos iniciales + sincronización censo Vital |
| [`backend/Bital.Infrastructure/Data/SeedData.sql`](../backend/Bital.Infrastructure/Data/SeedData.sql) | Solo catálogo de dietas (legacy; usar `02-MigrateData.sql` para migración completa) |

---

## Qué hace la migración

1. **Crea** la base `BitalNegocio` y los esquemas `dietas` + `bital` (si no existen).
2. **Aplica** migraciones Entity Framework Core (`dotnet ef database update`).
3. **Carga datos iniciales** (idempotente — se puede re-ejecutar sin duplicar):
   - Catálogo de dietas (`dietas.DietasCatalogo`)
   - Tarifas históricas 2025 y año de la fecha operativa (`dietas.TarifasHistorico`)
   - Parámetros operativos (`dietas.ParametrosOperativos`)
   - Tiempos de comida (`bital.TiemposComida`)
   - Categorías de edad (`bital.CategoriasEdad`)
   - Usuarios del módulo + permisos por rol (`bital.UsuariosModulo`, `bital.PermisosRol`)
4. **Sincroniza censo** desde `Hosvital_Pruebas`:
   - Tablas: `INGRESOS`, `CAPBAS`, `MAEPAB`
   - Filtro: ingresos activos en pabellones 3–7 (misma lógica que `GetAtencionesHospitalariasAsync`)
   - Destino: `dietas.FilasDietas` — una fila por paciente × comida (6 comidas) × fecha operativa
   - Estado inicial: `Pendiente` (sin solicitud)

Al finalizar imprime un **resumen** con conteos por tabla.

---

## Prerrequisitos

- **SQL Server 2019+** (Express, Standard o Enterprise)
- **sqlcmd** en PATH ([SQL Server Command Line Utilities](https://learn.microsoft.com/en-us/sql/tools/sqlcmd/sqlcmd-utility))
- **.NET SDK 8** (para migraciones EF)
- Base **Hosvital_Pruebas** accesible en el mismo servidor (consulta cross-database)
- Tablas Vital requeridas: `INGRESOS`, `CAPBAS`, `MAEPAB`
- Permisos: crear BD, ejecutar EF migrations, `SELECT` en Vital, `INSERT/UPDATE` en BitalNegocio

---

## Ejecución

### Opción 1 — PowerShell (recomendada)

Entorno local (Windows Auth):

```powershell
cd backend\scripts
.\Migrate-BitalNegocio.ps1
```

Servidor remoto (SQL Auth):

```powershell
.\Migrate-BitalNegocio.ps1 `
  -ServerInstance "10.238.97.69" `
  -BitalDatabase "BitalNegocio" `
  -VitalDatabase "Hosvital_Pruebas" `
  -SqlUser "tu_usuario" `
  -SqlPassword "tu_clave" `
  -FechaOperativa "2026-07-26"
```

Parámetros opcionales:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `-ServerInstance` | `localhost\SQLEXPRESS` | Instancia SQL Server |
| `-BitalDatabase` | `BitalNegocio` | Base destino |
| `-VitalDatabase` | `Hosvital_Pruebas` | Base HIS Vital |
| `-FechaOperativa` | Hoy (`yyyy-MM-dd`) | Fecha del censo a generar |
| `-SkipCreateDatabase` | — | Omitir `01-CreateDatabase.sql` |
| `-SkipEfMigration` | — | Omitir `dotnet ef database update` |
| `-SkipDataMigration` | — | Omitir `02-MigrateData.sql` |

### Opción 2 — Pasos manuales

```powershell
# 1. Crear base
sqlcmd -S localhost\SQLEXPRESS -E -f 65001 -i backend\scripts\01-CreateDatabase.sql

# 2. Migraciones EF
cd backend
dotnet ef database update `
  --project Bital.Infrastructure `
  --startup-project Bital.ApiNegocio

# 3. Datos + censo Vital
sqlcmd -S localhost\SQLEXPRESS -d BitalNegocio -E -f 65001 `
  -v VitalDatabase="Hosvital_Pruebas" FechaOperativa="2026-07-26" `
  -i backend\scripts\02-MigrateData.sql
```

> Usar siempre **`-f 65001`** (UTF-8) para nombres con tildes (Hiposódica, Líquida, etc.).

---

## Usuarios seed (login institucional)

Contraseña temporal para todos: **`Bital2026!`**  
(Cambiar en el primer acceso vía pestaña *Cambiar contraseña* en login.)

| Email | Rol | Rol (API num) |
|-------|-----|---------------|
| `admin@clinicadelrio.com` | Administrador | 1 |
| `nutricionista@clinicadelrio.com` | Nutricionista | 2 |
| `cocinero@clinicadelrio.com` | Cocinero | 3 |
| `enfermera@clinicadelrio.com` | Enfermera | 4 |

El hash almacenado es **SHA-256 hex** (mismo algoritmo que `UsuariosPermisosService.HashPassword`).

---

## Esquemas y tablas principales

### Esquema `dietas`

| Tabla | Contenido |
|-------|-----------|
| `DietasCatalogo` | Tipos de dieta |
| `TarifasHistorico` | Tarifas por año |
| `FilasDietas` | Censo operativo por paciente/comida |
| `OrdenesCocina` | Órdenes de producción |
| `EventosTrazabilidad` | Historial de cambios por fila |
| `ParametrosOperativos` | Config global (modo carga anticipada) |

### Esquema `bital`

| Tabla | Contenido |
|-------|-----------|
| `UsuariosModulo` | Usuarios del módulo dietas-cocina |
| `PermisosRol` | Matriz rol → rutas |
| `TiemposComida` | Ventanas horarias por comida |
| `CategoriasEdad` | Clasificación etaria |
| `EtiquetasEnfermeria` | Etiquetas logísticas |
| `FilasConciliacion` | Conciliación facturación |
| `EventosAuditoria` | Auditoría forense |

---

## Post-migración

1. Verificar connection strings en `Bital.ApiNegocio/appsettings.Development.json` (o producción):

   ```json
   "BitalDatabase": "Server=...;Database=BitalNegocio;...",
   "VitalDatabase": "Server=...;Database=Hosvital_Pruebas;..."
   ```

2. Iniciar API:

   ```powershell
   dotnet run --project backend/Bital.ApiNegocio
   ```

3. Frontend: `VITE_DIETAS_COCINA_API=true` en `.env.local`.

4. Login institucional con usuarios seed → cambiar contraseña.

5. Verificar censo: `GET /api/v1/dietas-cocina/censo?fecha=YYYY-MM-DD&comida=Desayuno`

---

## Re-sincronizar censo (sin repetir seed)

Si solo necesitas actualizar pacientes hospitalizados del día:

```powershell
sqlcmd -S localhost\SQLEXPRESS -d BitalNegocio -E -f 65001 `
  -v VitalDatabase="Hosvital_Pruebas" FechaOperativa="2026-07-26" `
  -i backend\scripts\02-MigrateData.sql
```

El script es **idempotente**: no duplica filas existentes (misma clave `PacienteId` + `FechaOperativa` + `Comida`).

En operación normal, la API también sincroniza censo al llamar `GET /censo` (`DietasService.ObtenerCensoAsync`).

---

## Troubleshooting

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| `La base Vital "..." no existe` | Nombre incorrecto o BD en otro servidor | Ajustar `-VitalDatabase` o usar linked server |
| Error en `INGRESOS` / `CAPBAS` | Tablas legacy con otro nombre | Revisar esquema Vital con `DiagnosticoController` |
| Caracteres corruptos (Hipos�dica) | sqlcmd sin UTF-8 | Agregar `-f 65001` |
| `PasswordHash` column missing | EF migrations no aplicadas | Ejecutar paso 2 antes del SQL de datos |
| 0 filas de censo | Sin ingresos activos en pabellones 3–7 | Normal si no hay hospitalizados; verificar query Vital |
| `dotnet ef` falla | SDK 8 no instalado o connection string | Ver [`backend/README.md`](../backend/README.md) |

---

## Referencias

- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) — checklist producción
- [ARQUITECTURA_DETALLADA.md](./ARQUITECTURA_DETALLADA.md) — modelo de datos Vital vs Bital
- [GUIA_CONSUMO_FRONTEND.md](./GUIA_CONSUMO_FRONTEND.md) — integración frontend
- Migración EF más reciente: `20260727013734_AddChecklistAndParametrosOperativos`
