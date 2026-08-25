/*
================================================================================
  BITAL — Migración de datos SQL Server 2019+
  Base destino : BitalNegocio (esquemas bital + dietas)
  Base origen  : Hosvital (HIS Vital, solo lectura)

  Replica GetAtencionesHospitalariasAsync:
    INGRESOS + CAPBAS + TMPFAC + MAEPAB
    IngFecEgr = 1753-01-01 (centinela Vital, no NULL)
    IngEstSld = 0, INGATNACT = 2, pabellones 3-7 vía TMPFAC.TFcCodPab

  Ejecutar DESPUÉS de aplicar migraciones EF:
    dotnet ef database update --project Bital.Infrastructure --startup-project Bital.ApiNegocio --context BitalNegocioDbContext

  Uso con sqlcmd (UTF-8):
    sqlcmd -S localhost\SQLEXPRESS -d BitalNegocio -f 65001 ^
      -v DatabaseName="BitalNegocio" VitalDatabase="Hosvital_Pruebas" FechaOperativa="2026-08-13" ^
      -i backend\scripts\02-MigrateData.sql

  O usar:  .\backend\scripts\Migrate-BitalNegocio.ps1
================================================================================
*/

:setvar DatabaseName BitalNegocio
:setvar VitalDatabase Hosvital_Pruebas
:setvar FechaOperativa ""

SET NOCOUNT ON;
SET XACT_ABORT ON;

USE [$(DatabaseName)];
GO

IF SCHEMA_ID(N'dietas') IS NULL EXEC(N'CREATE SCHEMA [dietas];');
IF SCHEMA_ID(N'bital') IS NULL EXEC(N'CREATE SCHEMA [bital];');
GO

DECLARE @VitalDb sysname = N'$(VitalDatabase)';
DECLARE @FechaOperativa date = TRY_CONVERT(date, NULLIF(N'$(FechaOperativa)', N''), 23);

IF @FechaOperativa IS NULL
    SET @FechaOperativa = CAST(GETDATE() AS date);

IF OBJECT_ID(N'dietas.TarifasHistorico', N'U') IS NULL
   OR OBJECT_ID(N'bital.RolesModulo', N'U') IS NULL
BEGIN
    RAISERROR(N'Faltan tablas de esquema. Ejecute primero: dotnet ef database update --context BitalNegocioDbContext', 16, 1);
    RETURN;
END

IF COL_LENGTH(N'dietas.TarifasHistorico', N'TiempoComida') IS NULL
BEGIN
    RAISERROR(N'Falta dietas.TarifasHistorico.TiempoComida. Aplique migraciones EF (o 04-TiempoComidaTarifaHistorico.sql).', 16, 1);
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = @VitalDb)
BEGIN
    RAISERROR(N'La base Vital "%s" no existe en este servidor. Verifique el parámetro VitalDatabase.', 16, 1, @VitalDb);
    RETURN;
END

PRINT '============================================================';
PRINT 'BITAL — Inicio migración de datos (SQL Server 2019+)';
PRINT '  Motor      : ' + CAST(SERVERPROPERTY('ProductVersion') AS varchar(32));
PRINT '  Destino    : ' + DB_NAME();
PRINT '  Vital      : ' + @VitalDb;
PRINT '  Fecha op.  : ' + CONVERT(varchar(10), @FechaOperativa, 120);
PRINT '============================================================';
GO

/* ============================================================================
   1. CATÁLOGO FCR + TARIFAS POR TIEMPO DE COMIDA (idempotente)
      Fuente: CatalogoDietasFcrSeed.cs / 06-SeedCleanInstall.sql
   ============================================================================ */
USE [$(DatabaseName)];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

;WITH DietasSeed AS (
    SELECT *
    FROM (VALUES
        ('aaaaaaaa-0001-4000-8000-000000000001', N'D-001', N'Normales y derivadas',              N'Tarifa FCR — Normales y derivadas'),
        ('aaaaaaaa-0002-4000-8000-000000000002', N'D-002', N'Hiperproteico',                     N'Tarifa FCR — Hiperproteico'),
        ('aaaaaaaa-0003-4000-8000-000000000003', N'D-003', N'Hipoproteico',                      N'Tarifa FCR — Hipoproteico'),
        ('aaaaaaaa-0004-4000-8000-000000000004', N'D-004', N'Renal',                             N'Tarifa FCR — Renal'),
        ('aaaaaaaa-0005-4000-8000-000000000005', N'D-005', N'Líquidos claros',                   N'Tarifa FCR — Líquidos claros'),
        ('aaaaaaaa-0006-4000-8000-000000000006', N'D-006', N'Niños de 6 a 10 meses',             N'Tarifa FCR — Niños de 6 a 10 meses'),
        ('aaaaaaaa-0007-4000-8000-000000000007', N'D-007', N'Niños de 10 m en adelante',         N'Tarifa FCR — Niños de 10 m en adelante'),
        ('aaaaaaaa-0008-4000-8000-000000000008', N'D-008', N'Líquido completa',                  N'Tarifa FCR — Líquido completa'),
        ('aaaaaaaa-0009-4000-8000-000000000009', N'D-009', N'Hiperproteico licuado completa',    N'Tarifa FCR — Hiperproteico licuado completa'),
        ('aaaaaaaa-0010-4000-8000-000000000010', N'D-010', N'Merienda mañana',                   N'Tarifa FCR — Merienda mañana'),
        ('aaaaaaaa-0011-4000-8000-000000000011', N'D-011', N'Merienda tarde',                    N'Tarifa FCR — Merienda tarde'),
        ('aaaaaaaa-0012-4000-8000-000000000012', N'D-012', N'Merienda noche',                    N'Tarifa FCR — Merienda noche')
    ) AS v(Id, Codigo, Nombre, Descripcion)
)
MERGE dietas.DietasCatalogo AS tgt
USING DietasSeed AS src
    ON tgt.Codigo = src.Codigo
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Codigo, Nombre, Descripcion, FechaInicio, FechaFin, Usuario, Activa, CreadoEn, CreadoPor)
    VALUES (
        CAST(src.Id AS uniqueidentifier),
        src.Codigo,
        src.Nombre,
        src.Descripcion,
        '2026-01-01',
        NULL,
        N'seed-fcr',
        1,
        @AhoraUtc,
        N'Migracion'
    )
WHEN MATCHED THEN
    UPDATE SET
        tgt.Nombre = src.Nombre,
        tgt.Descripcion = src.Descripcion,
        tgt.Activa = 1,
        tgt.ModificadoEn = @AhoraUtc,
        tgt.ModificadoPor = N'Migracion';

-- Catálogo legado (DN001…) deja de usarse; el seed FCR de la API no corre si hay filas
UPDATE dietas.DietasCatalogo
SET Activa = 0, ModificadoEn = @AhoraUtc, ModificadoPor = N'Migracion'
WHERE Codigo IN (N'DN001', N'DB001', N'DL001', N'DD001', N'DH001')
  AND Activa = 1;

;WITH TarifasSeed AS (
    SELECT *
    FROM (VALUES
        (N'D-001', 1, 2025,  9766.00, 0), (N'D-001', 1, 2026, 10743.00, 1),
        (N'D-001', 3, 2025, 12479.00, 0), (N'D-001', 3, 2026, 13727.00, 1),
        (N'D-001', 5, 2025, 12479.00, 0), (N'D-001', 5, 2026, 13727.00, 1),

        (N'D-002', 1, 2025, 11108.00, 0), (N'D-002', 1, 2026, 12219.00, 1),
        (N'D-002', 3, 2025, 13213.00, 0), (N'D-002', 3, 2026, 14534.00, 1),
        (N'D-002', 5, 2025, 12862.00, 0), (N'D-002', 5, 2026, 14148.00, 1),

        (N'D-003', 1, 2025,  8770.00, 0), (N'D-003', 1, 2026,  9647.00, 1),
        (N'D-003', 3, 2025,  9354.00, 0), (N'D-003', 3, 2026, 10289.00, 1),
        (N'D-003', 5, 2025, 10407.00, 0), (N'D-003', 5, 2026, 11448.00, 1),

        (N'D-004', 3, 2025, 12021.00, 0), (N'D-004', 3, 2026, 13223.00, 1),
        (N'D-004', 5, 2025, 12646.00, 0), (N'D-004', 5, 2026, 13911.00, 1),

        (N'D-005', 1, 2025,  5518.00, 0), (N'D-005', 1, 2026,  6070.00, 1),
        (N'D-005', 3, 2025,  6300.00, 0), (N'D-005', 3, 2026,  6930.00, 1),
        (N'D-005', 5, 2025,  5518.00, 0), (N'D-005', 5, 2026,  6070.00, 1),

        (N'D-006', 3, 2025,  8185.00, 0), (N'D-006', 3, 2026,  9004.00, 1),
        (N'D-006', 5, 2025,  8185.00, 0), (N'D-006', 5, 2026,  9004.00, 1),

        (N'D-007', 1, 2025,  7016.00, 0), (N'D-007', 1, 2026,  7718.00, 1),
        (N'D-007', 3, 2025, 12269.00, 0), (N'D-007', 3, 2026, 13496.00, 1),
        (N'D-007', 5, 2025, 12269.00, 0), (N'D-007', 5, 2026, 13496.00, 1),

        (N'D-008', 1, 2025,  8419.00, 0), (N'D-008', 1, 2026,  9261.00, 1),
        (N'D-008', 3, 2025,  9289.00, 0), (N'D-008', 3, 2026, 10218.00, 1),
        (N'D-008', 5, 2025,  9939.00, 0), (N'D-008', 5, 2026, 10933.00, 1),

        (N'D-009', 1, 2025, 11108.00, 0), (N'D-009', 1, 2026, 12219.00, 1),
        (N'D-009', 3, 2025, 13213.00, 0), (N'D-009', 3, 2026, 14534.00, 1),
        (N'D-009', 5, 2025, 12862.00, 0), (N'D-009', 5, 2026, 14148.00, 1),

        (N'D-010', 2, 2025,  6080.00, 0), (N'D-010', 2, 2026,  6688.00, 1),
        (N'D-011', 4, 2025,  6080.00, 0), (N'D-011', 4, 2026,  6688.00, 1),
        (N'D-012', 6, 2025,  6080.00, 0), (N'D-012', 6, 2026,  6688.00, 1)
    ) AS v(Codigo, TiempoComida, Anio, Monto, Activa)
)
INSERT INTO dietas.TarifasHistorico (
    Id, DietaCatalogoId, TiempoComida, Anio, Monto,
    VigenciaDesde, VigenciaHasta, Activa, Observaciones, CreadoEn, CreadoPor
)
SELECT
    NEWID(),
    dc.Id,
    ts.TiempoComida,
    ts.Anio,
    ts.Monto,
    DATEFROMPARTS(ts.Anio, 1, 1),
    DATEFROMPARTS(ts.Anio, 12, 31),
    ts.Activa,
    CASE WHEN ts.Anio = 2025 THEN N'Tarifa FCR 2025 (histórico)' ELSE N'Propuesta tarifa FCR 2026 (+10%)' END,
    @AhoraUtc,
    N'Migracion'
FROM TarifasSeed ts
INNER JOIN dietas.DietasCatalogo dc ON dc.Codigo = ts.Codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM dietas.TarifasHistorico th
    WHERE th.DietaCatalogoId = dc.Id
      AND th.TiempoComida = ts.TiempoComida
      AND th.Anio = ts.Anio
);

PRINT 'Catálogo FCR y tarifas: OK';
GO

/* ============================================================================
   2. PARÁMETROS OPERATIVOS + TIEMPOS DE COMIDA
   ============================================================================ */
USE [$(DatabaseName)];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

IF NOT EXISTS (SELECT 1 FROM dietas.ParametrosOperativos)
BEGIN
    INSERT INTO dietas.ParametrosOperativos (Id, ModoCarga, CreadoEn, CreadoPor)
    VALUES (NEWID(), N'todas-desde-manana', @AhoraUtc, N'Migracion');
END

;WITH TiemposSeed AS (
    SELECT *
    FROM (VALUES
        (1, '08:15:00', '07:30:00', '08:00:00', 30),
        (2, '10:30:00', '10:00:00', '10:15:00', 30),
        (3, '12:00:00', '10:30:00', '11:30:00', 30),
        (4, '14:45:00', '14:15:00', '14:30:00', 30),
        (5, '17:30:00', '15:30:00', '17:00:00', 30),
        (6, '20:45:00', '20:15:00', '20:30:00', 30)
    ) AS v(Comida, HoraPreparacion, HoraCierre, HoraEntrega, MinutosAlerta)
)
MERGE bital.TiemposComida AS tgt
USING TiemposSeed AS src
    ON tgt.Comida = src.Comida
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        Id, Comida, HoraPreparacion, HoraCierre, HoraEntrega, Activo,
        MinutosAlertaCierre, ModificadoPor, ModificadoEn, CreadoEn, CreadoPor
    )
    VALUES (
        NEWID(), src.Comida, src.HoraPreparacion, src.HoraCierre, src.HoraEntrega, 1,
        src.MinutosAlerta, N'Migracion', @AhoraUtc, @AhoraUtc, N'Migracion'
    );

;WITH CategoriasSeed AS (
    SELECT *
    FROM (VALUES
        (N'Lactante',       0,  2, 0.50, 1),
        (N'Infante',        3, 11, 0.75, 2),
        (N'Adolescente',   12, 17, 1.00, 3),
        (N'Adulto',        18, 59, 1.00, 4),
        (N'Adulto mayor',  60, 120, 0.90, 5)
    ) AS v(Nombre, EdadMinima, EdadMaxima, FactorPorcion, Orden)
)
MERGE bital.CategoriasEdad AS tgt
USING CategoriasSeed AS src
    ON tgt.Nombre = src.Nombre
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        Id, Nombre, EdadMinima, EdadMaxima, FactorPorcion, Activa, Orden,
        ModificadoPor, ModificadoEn, CreadoEn, CreadoPor
    )
    VALUES (
        NEWID(), src.Nombre, src.EdadMinima, src.EdadMaxima, src.FactorPorcion, 1, src.Orden,
        N'Migracion', @AhoraUtc, @AhoraUtc, N'Migracion'
    );

PRINT 'Parámetros operativos: OK';
GO

/* ============================================================================
   3. USUARIOS INSTITUCIONALES + PERMISOS POR ROL (RolesModulo / RolModuloId)
   Requiere migración EF 20260728120000_AddRolesModuloDinamicos aplicada.
   Contraseña inicial por defecto: igual al nombre de usuario (Identificacion)
   Hash: SHA-256 en hex mayúsculas, igual que la API (.NET Convert.ToHexString)
   ============================================================================ */
USE [$(DatabaseName)];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

DECLARE @RolAdmin uniqueidentifier = '11111111-1111-1111-1111-111111000001';
DECLARE @RolNutricionista uniqueidentifier = '11111111-1111-1111-1111-111111000002';
DECLARE @RolProveedor uniqueidentifier = '11111111-1111-1111-1111-111111000003';
DECLARE @RolEnfermera uniqueidentifier = '11111111-1111-1111-1111-111111000004';
DECLARE @RolAuxiliar uniqueidentifier = '11111111-1111-1111-1111-111111000006';

;WITH RolesSeed AS (
    SELECT *
    FROM (VALUES
        (@RolAdmin,         N'Administrador',      1),
        (@RolNutricionista, N'Nutricionista',      1),
        (@RolProveedor,     N'Proveedor',          1),
        (@RolEnfermera,     N'Enfermera',          1),
        (@RolAuxiliar,      N'Auxiliar de Cocina', 1)
    ) AS v(Id, Nombre, EsSistema)
)
MERGE bital.RolesModulo AS tgt
USING RolesSeed AS src
    ON tgt.Id = src.Id
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Nombre, EsSistema, Activo, CreadoEn, CreadoPor)
    VALUES (src.Id, src.Nombre, src.EsSistema, 1, @AhoraUtc, N'Migracion')
WHEN MATCHED AND tgt.Nombre <> src.Nombre THEN
    UPDATE SET
        tgt.Nombre = src.Nombre,
        tgt.EsSistema = src.EsSistema,
        tgt.Activo = 1,
        tgt.ModificadoEn = @AhoraUtc,
        tgt.ModificadoPor = N'Migracion';

;WITH UsuariosSeed AS (
    SELECT *
    FROM (VALUES
        (N'Administrador RioSoft',   N'admin@clinicadelrio.com',         N'admin',         @RolAdmin),
        (N'Nutricionista Clínica', N'nutricionista@clinicadelrio.com', N'nutricionista', @RolNutricionista),
        (N'Jefe de Cocina',        N'cocinero@clinicadelrio.com',      N'cocinero',      @RolProveedor),
        (N'Enfermería Pabellón',   N'enfermera@clinicadelrio.com',     N'enfermera',      @RolEnfermera)
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
        @AhoraUtc, N'Migracion'
    );

-- Usuarios seed ya existentes: alinear contraseña al nombre de usuario si aún no la cambiaron
UPDATE u
SET
    PasswordHash = UPPER(CONVERT(varchar(64), HASHBYTES('SHA2_256', CAST(u.Identificacion AS varchar(100))), 2)),
    ModificadoEn = @AhoraUtc,
    ModificadoPor = N'Migracion'
FROM bital.UsuariosModulo u
INNER JOIN (
    SELECT Email FROM (VALUES
        (N'admin@clinicadelrio.com'),
        (N'nutricionista@clinicadelrio.com'),
        (N'cocinero@clinicadelrio.com'),
        (N'enfermera@clinicadelrio.com')
    ) AS v(Email)
) seed ON seed.Email = u.Email
WHERE u.Identificacion IS NOT NULL
  AND (
        u.PasswordHash IS NULL
        OR u.PasswordHash = N'3ab36e2aa3c89926e88a03fbfcfc86dc08c7aa3e1823781c63e1154f577a22e2'
        OR u.PasswordHash = UPPER(N'3ab36e2aa3c89926e88a03fbfcfc86dc08c7aa3e1823781c63e1154f577a22e2')
      );

;WITH RutasPorRol AS (
    SELECT @RolAdmin AS RolModuloId, r.Ruta
    FROM (VALUES
        (1),(2),(3),(4),(5),(6),(7),(8),
        (10),(11),(12),(13),
        (20),(21),(22),(23),(24),(25),(26),
        (30),(31),(32),
        (40),(41),
        (50),(51),
        (60),
        (70),(71)
    ) AS r(Ruta)
    UNION ALL
    SELECT @RolNutricionista, r.Ruta FROM (VALUES (1),(2),(3),(5),(6),(7),(8),(10),(30),(40),(41),(50),(60)) AS r(Ruta)
    UNION ALL
    SELECT @RolProveedor, r.Ruta FROM (VALUES (10),(11),(12),(13),(20),(21),(30),(40),(41)) AS r(Ruta)
    UNION ALL
    SELECT @RolEnfermera, r.Ruta FROM (VALUES (1),(20),(22),(40)) AS r(Ruta)
    UNION ALL
    SELECT @RolAuxiliar, r.Ruta FROM (VALUES (20),(23),(24),(25),(40)) AS r(Ruta)
)
INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
SELECT NEWID(), rr.RolModuloId, rr.Ruta, 1, @AhoraUtc, N'Migracion'
FROM RutasPorRol rr
WHERE NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol p
    WHERE p.RolModuloId = rr.RolModuloId AND p.Ruta = rr.Ruta
);

DELETE FROM bital.PermisosRol
WHERE RolModuloId = @RolEnfermera AND Ruta = 21;

UPDATE bital.RolesModulo
SET Activo = 0, ModificadoEn = @AhoraUtc, ModificadoPor = N'Migracion'
WHERE Id = '11111111-1111-1111-1111-111111000005' AND Activo = 1;

PRINT 'Usuarios, roles y permisos: OK';
GO

/* ============================================================================
   4. SINCRONIZAR CENSO DESDE VITAL
      Misma lógica que GetAtencionesHospitalariasAsync + ObtenerCensoAsync
   ============================================================================ */
USE [$(DatabaseName)];
GO

DECLARE @VitalDb sysname = N'$(VitalDatabase)';
DECLARE @FechaOperativa date = TRY_CONVERT(date, NULLIF(N'$(FechaOperativa)', N''), 23);
DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();
DECLARE @Sql nvarchar(max);
DECLARE @Insertados int = 0;
DECLARE @VitalObject nvarchar(261);

IF @FechaOperativa IS NULL
    SET @FechaOperativa = CAST(GETDATE() AS date);

SET @VitalObject = @VitalDb + N'.dbo.INGRESOS';
IF OBJECT_ID(@VitalObject, N'U') IS NULL
BEGIN
    RAISERROR(N'No existe %s. Verifique VitalDatabase y el esquema HIS.', 16, 1, @VitalObject);
    RETURN;
END

SET @VitalObject = @VitalDb + N'.dbo.CAPBAS';
IF OBJECT_ID(@VitalObject, N'U') IS NULL
BEGIN
    RAISERROR(N'No existe %s.', 16, 1, @VitalObject);
    RETURN;
END

SET @VitalObject = @VitalDb + N'.dbo.TMPFAC';
IF OBJECT_ID(@VitalObject, N'U') IS NULL
BEGIN
    RAISERROR(N'No existe %s (cama/pabellón actual del ingreso). La consulta de censo la requiere.', 16, 1, @VitalObject);
    RETURN;
END

SET @VitalObject = @VitalDb + N'.dbo.MAEPAB';
IF OBJECT_ID(@VitalObject, N'U') IS NULL
BEGIN
    RAISERROR(N'No existe %s.', 16, 1, @VitalObject);
    RETURN;
END

SET @Sql = N'
;WITH Comidas AS (
    SELECT Comida FROM (VALUES (1),(2),(3),(4),(5),(6)) AS c(Comida)
),
CensoVital AS (
    SELECT
        IdIngreso, TipoDocumento, Cedula, NombreCompleto, Pabellon, Cama, Edad, Servicio
    FROM (
        SELECT
            i.IngCsc AS IdIngreso,
            RTRIM(LTRIM(i.MPTDoc)) AS TipoDocumento,
            RTRIM(LTRIM(i.MPcedu)) AS Cedula,
            LTRIM(RTRIM(CONCAT_WS(N'' '',
                NULLIF(RTRIM(LTRIM(cap.MPNom1)), N''''),
                NULLIF(RTRIM(LTRIM(cap.MPNom2)), N''''),
                NULLIF(RTRIM(LTRIM(cap.MPApe1)), N''''),
                NULLIF(RTRIM(LTRIM(cap.MPApe2)), N'''')
            ))) AS NombreCompleto,
            RTRIM(LTRIM(map.MPNomP)) AS Pabellon,
            RTRIM(LTRIM(tmp.TFcCodCam)) AS Cama,
            CASE
                WHEN cap.MPFchN IS NULL THEN 0
                ELSE DATEDIFF(year, cap.MPFchN, GETDATE())
                    - CASE WHEN DATEADD(year, DATEDIFF(year, cap.MPFchN, GETDATE()), cap.MPFchN) > GETDATE() THEN 1 ELSE 0 END
            END AS Edad,
            CASE
                WHEN map.MPNomP LIKE N''%UCI%'' THEN N''UCI''
                WHEN map.MPNomP LIKE N''%URGENCI%'' THEN N''Urgencias''
                WHEN map.MPNomP LIKE N''%NEONATAL%'' THEN N''Neonatal''
                WHEN map.MPNomP LIKE N''%HOSPITALIZ%'' OR map.MPNomP LIKE N''%PISO%'' THEN N''Hospitalización''
                WHEN NULLIF(RTRIM(LTRIM(map.MPNomP)), N'''') IS NULL THEN N''Sin servicio''
                ELSE RTRIM(LTRIM(map.MPNomP))
            END AS Servicio,
            ROW_NUMBER() OVER (
                PARTITION BY i.IngCsc, RTRIM(LTRIM(i.MPcedu)), RTRIM(LTRIM(i.MPTDoc))
                ORDER BY tmp.TFcCodCam
            ) AS rn
        FROM ' + QUOTENAME(@VitalDb) + N'.dbo.INGRESOS i
        INNER JOIN ' + QUOTENAME(@VitalDb) + N'.dbo.CAPBAS cap
            ON RTRIM(LTRIM(cap.MPCedu)) = RTRIM(LTRIM(i.MPcedu))
           AND RTRIM(LTRIM(cap.MPTDoc)) = RTRIM(LTRIM(i.MPTDoc))
        INNER JOIN ' + QUOTENAME(@VitalDb) + N'.dbo.TMPFAC tmp
            ON RTRIM(LTRIM(tmp.TFCedu)) = RTRIM(LTRIM(i.MPCedu))
        INNER JOIN ' + QUOTENAME(@VitalDb) + N'.dbo.MAEPAB map
            ON map.MPCodP = tmp.TFcCodPab
        WHERE map.MPCodP IN (3, 4, 5, 6, 7)
          AND i.IngFecEgr = CONVERT(datetime, ''17530101'', 112)
          AND i.IngEstSld = 0
          AND i.INGATNACT = 2
    ) x
    WHERE rn = 1
)
INSERT INTO dietas.FilasDietas (
    Id, PacienteId, IdIngreso, Cedula, TipoDocumento, Paciente, Edad,
    Servicio, Pabellon, Habitacion, Comida, Consistencia,
    Aislado, Aislamiento, Alergico, Alergias,
    Estado, CancelacionTardia, FechaOperativa, CreadoEn, CreadoPor
)
SELECT
    NEWID(),
    CONCAT(cv.TipoDocumento, N''-'', cv.Cedula),
    cv.IdIngreso,
    cv.Cedula,
    cv.TipoDocumento,
    LEFT(cv.NombreCompleto, 200),
    cv.Edad,
    LEFT(cv.Servicio, 100),
    LEFT(cv.Pabellon, 50),
    LEFT(ISNULL(NULLIF(cv.Cama, N''''), N''—''), 50),
    c.Comida,
    NULL,
    0,
    N'''',
    0,
    N'''',
    1,
    0,
    @FechaOperativa,
    @AhoraUtc,
    N''Migracion-Vital''
FROM CensoVital cv
CROSS JOIN Comidas c
WHERE NOT EXISTS (
    SELECT 1
    FROM dietas.FilasDietas f
    WHERE f.PacienteId = CONCAT(cv.TipoDocumento, N''-'', cv.Cedula)
      AND f.FechaOperativa = @FechaOperativa
      AND f.Comida = c.Comida
);

SET @Insertados = @@ROWCOUNT;
';

EXEC sp_executesql
    @Sql,
    N'@FechaOperativa date, @AhoraUtc datetime2, @Insertados int OUTPUT',
    @FechaOperativa = @FechaOperativa,
    @AhoraUtc = @AhoraUtc,
    @Insertados = @Insertados OUTPUT;

PRINT 'Censo sincronizado desde ' + @VitalDb + ': ' + CAST(@Insertados AS varchar(10)) + ' fila(s) nuevas';
GO

/* ============================================================================
   5. RESUMEN
   ============================================================================ */
USE [$(DatabaseName)];
GO

SELECT N'Resumen post-migración' AS Seccion, Metrica, Valor
FROM (
    SELECT N'Dietas catálogo' AS Metrica, CAST(COUNT(*) AS sql_variant) AS Valor FROM dietas.DietasCatalogo
    UNION ALL
    SELECT N'Tarifas histórico', COUNT(*) FROM dietas.TarifasHistorico
    UNION ALL
    SELECT N'Roles módulo', COUNT(*) FROM bital.RolesModulo
    UNION ALL
    SELECT N'Usuarios módulo', COUNT(*) FROM bital.UsuariosModulo
    UNION ALL
    SELECT N'Permisos por rol', COUNT(*) FROM bital.PermisosRol
    UNION ALL
    SELECT N'Tiempos comida', COUNT(*) FROM bital.TiemposComida
    UNION ALL
    SELECT N'Categorías edad', COUNT(*) FROM bital.CategoriasEdad
    UNION ALL
    SELECT N'Filas censo hoy', COUNT(*)
    FROM dietas.FilasDietas
    WHERE FechaOperativa = ISNULL(TRY_CONVERT(date, NULLIF(N'$(FechaOperativa)', N''), 23), CAST(GETDATE() AS date))
) AS r;

PRINT '============================================================';
PRINT 'BITAL — Migración de datos completada';
PRINT 'Contraseña inicial usuarios seed: igual al nombre de usuario (Identificacion). Cambiar en «Cambiar contraseña» del login.';
PRINT '============================================================';
GO
