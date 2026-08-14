/*
================================================================================
  BITAL — Instalación limpia: catálogo FCR + roles predefinidos
  SQL Server 2019+ | Base: BitalNegocio (esquemas bital + dietas)

  NO incluye: censo Vital, órdenes, etiquetas.

  SÍ incluye: catálogo FCR, parámetros operativos, roles predefinidos,
              permisos y usuario administrador inicial.

  Ejecutar DESPUÉS de migraciones EF:
    dotnet ef database update --project Bital.Infrastructure --startup-project Bital.ApiNegocio

  Uso:
    sqlcmd -S localhost\SQLEXPRESS -d BitalNegocio -E -f 65001 ^
      -v DatabaseName="BitalNegocio" ^
      -i backend\scripts\06-SeedCleanInstall.sql

  O usar: .\backend\scripts\Initialize-BitalNegocioClean.ps1
================================================================================
*/

:setvar DatabaseName BitalNegocio

SET NOCOUNT ON;
SET XACT_ABORT ON;

USE [$(DatabaseName)];
GO

IF OBJECT_ID(N'dietas.DietasCatalogo', N'U') IS NULL
   OR OBJECT_ID(N'bital.RolesModulo', N'U') IS NULL
BEGIN
    RAISERROR(N'Aplique primero las migraciones EF (dotnet ef database update).', 16, 1);
    RETURN;
END

IF COL_LENGTH(N'dietas.TarifasHistorico', N'TiempoComida') IS NULL
BEGIN
    RAISERROR(N'Falta dietas.TarifasHistorico.TiempoComida. Aplique migraciones EF (o 04-TiempoComidaTarifaHistorico.sql).', 16, 1);
    RETURN;
END
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

/* ============================================================================
   1. CATÁLOGO FCR (12 dietas + tarifas 2025/2026 por tiempo de comida)
      Fuente: CatalogoDietasFcrSeed.cs
   ============================================================================ */
PRINT '==> Catálogo FCR';

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
        N'seed-clean'
    )
WHEN MATCHED THEN
    UPDATE SET
        tgt.Nombre = src.Nombre,
        tgt.Descripcion = src.Descripcion,
        tgt.Activa = 1,
        tgt.ModificadoEn = @AhoraUtc,
        tgt.ModificadoPor = N'seed-clean';

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
    N'seed-clean'
FROM TarifasSeed ts
INNER JOIN dietas.DietasCatalogo dc ON dc.Codigo = ts.Codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM dietas.TarifasHistorico th
    WHERE th.DietaCatalogoId = dc.Id
      AND th.TiempoComida = ts.TiempoComida
      AND th.Anio = ts.Anio
);

PRINT '    Catálogo FCR: OK';
GO

/* ============================================================================
   2. PARÁMETROS OPERATIVOS + TIEMPOS DE COMIDA + CATEGORÍAS DE EDAD
   ============================================================================ */
USE [$(DatabaseName)];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

PRINT '==> Parámetros operativos';

IF NOT EXISTS (SELECT 1 FROM dietas.ParametrosOperativos)
BEGIN
    INSERT INTO dietas.ParametrosOperativos (Id, ModoCarga, CreadoEn, CreadoPor)
    VALUES (NEWID(), N'todas-desde-manana', @AhoraUtc, N'seed-clean');
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
        src.MinutosAlerta, N'seed-clean', @AhoraUtc, @AhoraUtc, N'seed-clean'
    );

;WITH CategoriasSeed AS (
    SELECT *
    FROM (VALUES
        (N'Lactante',       0,   2, 0.50, 1),
        (N'Infante',        3,  11, 0.75, 2),
        (N'Adolescente',   12,  17, 1.00, 3),
        (N'Adulto',        18,  59, 1.00, 4),
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
        N'seed-clean', @AhoraUtc, @AhoraUtc, N'seed-clean'
    );

PRINT '    Parámetros operativos: OK';
GO

/* ============================================================================
   3. ROLES PREDEFINIDOS + PERMISOS (sin usuarios)
      Fuente: RolModuloSeed.cs + permisos granulares etiquetas
   ============================================================================ */
USE [$(DatabaseName)];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

DECLARE @RolAdmin         uniqueidentifier = '11111111-1111-1111-1111-111111000001';
DECLARE @RolNutricionista uniqueidentifier = '11111111-1111-1111-1111-111111000002';
DECLARE @RolProveedor     uniqueidentifier = '11111111-1111-1111-1111-111111000003';
DECLARE @RolEnfermera     uniqueidentifier = '11111111-1111-1111-1111-111111000004';
DECLARE @RolDoctor        uniqueidentifier = '11111111-1111-1111-1111-111111000005';
DECLARE @RolAuxiliar      uniqueidentifier = '11111111-1111-1111-1111-111111000006';

PRINT '==> Roles predefinidos';

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
    VALUES (src.Id, src.Nombre, src.EsSistema, 1, @AhoraUtc, N'seed-clean')
WHEN MATCHED THEN
    UPDATE SET
        tgt.Nombre = src.Nombre,
        tgt.EsSistema = src.EsSistema,
        tgt.Activo = 1,
        tgt.ModificadoEn = @AhoraUtc,
        tgt.ModificadoPor = N'seed-clean';

UPDATE bital.RolesModulo
SET Activo = 0, ModificadoEn = @AhoraUtc, ModificadoPor = N'seed-clean'
WHERE Id = @RolDoctor AND Activo = 1;

PRINT '==> Permisos por rol';

;WITH RutasPorRol AS (
    /* Administrador: acceso completo al módulo */
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
    /* Nutricionista */
    SELECT @RolNutricionista, r.Ruta
    FROM (VALUES (1),(2),(3),(5),(6),(7),(8),(10),(30),(40),(41),(50),(60)) AS r(Ruta)
    UNION ALL
    /* Proveedor */
    SELECT @RolProveedor, r.Ruta
    FROM (VALUES (10),(11),(12),(13),(20),(21),(40),(41)) AS r(Ruta)
    UNION ALL
    /* Enfermera */
    SELECT @RolEnfermera, r.Ruta
    FROM (VALUES (1),(20),(22),(40)) AS r(Ruta)
    UNION ALL
    /* Auxiliar de Cocina — bandejas en piso */
    SELECT @RolAuxiliar, r.Ruta
    FROM (VALUES (20),(23),(24),(25),(40)) AS r(Ruta)
)
INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
SELECT NEWID(), rr.RolModuloId, rr.Ruta, 1, @AhoraUtc, N'seed-clean'
FROM RutasPorRol rr
WHERE NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol p
    WHERE p.RolModuloId = rr.RolModuloId AND p.Ruta = rr.Ruta
);

/* Enfermera: sin impresión de etiquetas */
DELETE FROM bital.PermisosRol
WHERE RolModuloId = @RolEnfermera AND Ruta = 21;

PRINT '    Roles y permisos: OK';
GO

/* ============================================================================
   4. USUARIO ADMINISTRADOR INICIAL
      Login: usuario = admin | contraseña inicial = admin (cambiar en primer acceso)
      Hash: SHA-256 hex (compatible con PasswordHasher legacy), igual que 02-MigrateData.sql
   ============================================================================ */
USE [$(DatabaseName)];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();
DECLARE @RolAdmin uniqueidentifier = '11111111-1111-1111-1111-111111000001';
DECLARE @AdminId uniqueidentifier = '22222222-2222-2222-2222-222222000001';

PRINT '==> Usuario administrador';

MERGE bital.UsuariosModulo AS tgt
USING (
    SELECT
        @AdminId AS Id,
        N'Administrador' AS NombreCompleto,
        N'admin@clinicadelrio.com' AS Email,
        N'admin' AS Identificacion,
        @RolAdmin AS RolModuloId
) AS src
    ON tgt.Identificacion = src.Identificacion
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        Id, NombreCompleto, Email, Identificacion, RolModuloId, Activo,
        PasswordHash, CreadoEn, CreadoPor
    )
    VALUES (
        src.Id,
        src.NombreCompleto,
        src.Email,
        src.Identificacion,
        src.RolModuloId,
        1,
        UPPER(CONVERT(varchar(64), HASHBYTES('SHA2_256', CAST(src.Identificacion AS varchar(100))), 2)),
        @AhoraUtc,
        N'seed-clean'
    )
WHEN MATCHED THEN
    UPDATE SET
        tgt.NombreCompleto = src.NombreCompleto,
        tgt.Email = src.Email,
        tgt.RolModuloId = src.RolModuloId,
        tgt.Activo = 1,
        tgt.ModificadoEn = @AhoraUtc,
        tgt.ModificadoPor = N'seed-clean';

PRINT '    Usuario admin: OK (admin / admin)';
GO

/* ============================================================================
   5. RESUMEN
   ============================================================================ */
USE [$(DatabaseName)];
GO

PRINT '';
PRINT '--- Instalación limpia — resumen ---';

SELECT N'Dietas catálogo (FCR)' AS Metrica, CAST(COUNT(*) AS varchar(20)) AS Valor FROM dietas.DietasCatalogo
UNION ALL
SELECT N'Tarifas histórico', CAST(COUNT(*) AS varchar(20)) FROM dietas.TarifasHistorico
UNION ALL
SELECT N'Roles activos', CAST(COUNT(*) AS varchar(20)) FROM bital.RolesModulo WHERE Activo = 1
UNION ALL
SELECT N'Permisos por rol', CAST(COUNT(*) AS varchar(20)) FROM bital.PermisosRol
UNION ALL
SELECT N'Parámetros operativos', CAST(COUNT(*) AS varchar(20)) FROM dietas.ParametrosOperativos
UNION ALL
SELECT N'Tiempos comida', CAST(COUNT(*) AS varchar(20)) FROM bital.TiemposComida
UNION ALL
SELECT N'Categorías edad', CAST(COUNT(*) AS varchar(20)) FROM bital.CategoriasEdad
UNION ALL
SELECT N'Usuarios módulo', CAST(COUNT(*) AS varchar(20)) FROM bital.UsuariosModulo
UNION ALL
SELECT N'Filas dietas (censo)', CAST(COUNT(*) AS varchar(20)) FROM dietas.FilasDietas;

PRINT '';
PRINT 'OK — Base lista: catálogo FCR, parámetros, roles y usuario admin (admin / admin).';
GO
