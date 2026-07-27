/*
================================================================================
  BITAL — Migración de datos SQL Server 2019+
  Base destino : BitalNegocio (esquemas bital + dietas)
  Base origen  : Hosvital_Pruebas (HIS Vital, solo lectura)

  Ejecutar DESPUÉS de aplicar migraciones EF:
    dotnet ef database update --project Bital.Infrastructure --startup-project Bital.ApiNegocio

  Uso con sqlcmd (UTF-8):
    sqlcmd -S localhost\SQLEXPRESS -d BitalNegocio -f 65001 ^
      -v VitalDatabase="Hosvital_Pruebas" FechaOperativa="2026-07-26" ^
      -i backend\scripts\02-MigrateData.sql

  O usar:  .\backend\scripts\Migrate-BitalNegocio.ps1
================================================================================
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

USE [BitalNegocio];
GO

IF SCHEMA_ID(N'dietas') IS NULL EXEC(N'CREATE SCHEMA [dietas];');
IF SCHEMA_ID(N'bital') IS NULL EXEC(N'CREATE SCHEMA [bital];');
GO

DECLARE @VitalDb sysname = N'$(VitalDatabase)';
DECLARE @FechaOperativa date = TRY_CONVERT(date, N'$(FechaOperativa)', 23);
DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();
DECLARE @Anio int = YEAR(ISNULL(@FechaOperativa, GETDATE()));

IF @FechaOperativa IS NULL
    SET @FechaOperativa = CAST(GETDATE() AS date);

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = @VitalDb)
BEGIN
    RAISERROR(N'La base Vital "%s" no existe en este servidor. Verifique el parámetro VitalDatabase.', 16, 1, @VitalDb);
    RETURN;
END

PRINT '============================================================';
PRINT 'BITAL — Inicio migración de datos';
PRINT '  Vital      : ' + @VitalDb;
PRINT '  Fecha op.  : ' + CONVERT(varchar(10), @FechaOperativa, 120);
PRINT '============================================================';
GO

/* ============================================================================
   1. CATÁLOGO DE DIETAS + TARIFAS (idempotente por Codigo / Anio)
   ============================================================================ */
USE [BitalNegocio];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();
DECLARE @Anio int = YEAR(CAST(N'$(FechaOperativa)' AS date));

;WITH CatalogoSeed AS (
    SELECT *
    FROM (VALUES
        ('DN001', N'Dieta Normal',           N'Dieta completa y balanceada sin restricciones especiales',                    25000.00),
        ('DB001', N'Dieta Blanda',           N'Alimentos de fácil digestión y textura suave',                                28000.00),
        ('DL001', N'Dieta Líquida',          N'Solo líquidos claros o completos según indicación',                          22000.00),
        ('DD001', N'Dieta Diabética',        N'Control de carbohidratos y azúcares para pacientes diabéticos',                32000.00),
        ('DH001', N'Dieta Hiposódica',       N'Baja en sodio para pacientes con hipertensión o problemas renales',          30000.00)
    ) AS v(Codigo, Nombre, Descripcion, Monto2025)
)
MERGE dietas.DietasCatalogo AS tgt
USING CatalogoSeed AS src
    ON tgt.Codigo = src.Codigo
WHEN NOT MATCHED BY TARGET THEN
    INSERT (Id, Codigo, Nombre, Descripcion, FechaInicio, FechaFin, Usuario, Activa, CreadoEn, CreadoPor)
    VALUES (NEWID(), src.Codigo, src.Nombre, src.Descripcion, '2025-01-01', NULL, N'Sistema', 1, @AhoraUtc, N'Migracion');
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();
DECLARE @Anio int = YEAR(CAST(N'$(FechaOperativa)' AS date));

INSERT INTO dietas.TarifasHistorico (
    Id, DietaCatalogoId, Anio, Monto, VigenciaDesde, VigenciaHasta, Activa, CreadoEn, CreadoPor
)
SELECT
    NEWID(),
    dc.Id,
    2025,
    v.Monto,
    '2025-01-01',
    '2025-12-31',
    1,
    @AhoraUtc,
    N'Migracion'
FROM dietas.DietasCatalogo dc
INNER JOIN (VALUES
    ('DN001', 25000.00),
    ('DB001', 28000.00),
    ('DL001', 22000.00),
    ('DD001', 32000.00),
    ('DH001', 30000.00)
) AS v(Codigo, Monto) ON v.Codigo = dc.Codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM dietas.TarifasHistorico th
    WHERE th.DietaCatalogoId = dc.Id AND th.Anio = 2025
);

INSERT INTO dietas.TarifasHistorico (
    Id, DietaCatalogoId, Anio, Monto, VigenciaDesde, VigenciaHasta, Activa, CreadoEn, CreadoPor
)
SELECT
    NEWID(),
    dc.Id,
    @Anio,
    v.Monto,
    DATEFROMPARTS(@Anio, 1, 1),
    DATEFROMPARTS(@Anio, 12, 31),
    1,
    @AhoraUtc,
    N'Migracion'
FROM dietas.DietasCatalogo dc
INNER JOIN (VALUES
    ('DN001', 26500.00),
    ('DB001', 29500.00),
    ('DL001', 23500.00),
    ('DD001', 33500.00),
    ('DH001', 31500.00)
) AS v(Codigo, Monto) ON v.Codigo = dc.Codigo
WHERE NOT EXISTS (
    SELECT 1
    FROM dietas.TarifasHistorico th
    WHERE th.DietaCatalogoId = dc.Id AND th.Anio = @Anio
);

PRINT 'Catálogo y tarifas: OK';
GO

/* ============================================================================
   2. PARÁMETROS OPERATIVOS + TIEMPOS DE COMIDA
   ============================================================================ */
USE [BitalNegocio];
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
   3. USUARIOS INSTITUCIONALES + PERMISOS POR ROL
   Clave temporal por defecto: Bital2026!  (SHA-256 hex, igual que la API)
   ============================================================================ */
USE [BitalNegocio];
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();
DECLARE @PasswordHash nvarchar(128) = N'3ab36e2aa3c89926e88a03fbfcfc86dc08c7aa3e1823781c63e1154f577a22e2';

;WITH UsuariosSeed AS (
    SELECT *
    FROM (VALUES
        (N'Administrador BITAL',   N'admin@clinicadelrio.com',        N'admin', 1),
        (N'Nutricionista Clínica', N'nutricionista@clinicadelrio.com', N'nutricionista', 2),
        (N'Jefe de Cocina',        N'cocinero@clinicadelrio.com',     N'cocinero', 3),
        (N'Enfermería Pabellón',   N'enfermera@clinicadelrio.com',    N'enfermera', 4)
    ) AS v(NombreCompleto, Email, Identificacion, Rol)
)
MERGE bital.UsuariosModulo AS tgt
USING UsuariosSeed AS src
    ON tgt.Email = src.Email
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        Id, NombreCompleto, Email, Identificacion, Rol, Activo,
        PasswordHash, CreadoEn, CreadoPor
    )
    VALUES (
        NEWID(), src.NombreCompleto, src.Email, src.Identificacion, src.Rol, 1,
        @PasswordHash, @AhoraUtc, N'Migracion'
    );

-- Permisos: insertar rutas faltantes por rol (no duplicar)
;WITH RutasPorRol AS (
    SELECT 1 AS Rol, r.Ruta
    FROM (VALUES
        (1),(2),(3),(4),(10),(11),(12),(13),(20),(21),(30),(31),(32),(40),(41),(50),(51),(60),(70),(71)
    ) AS r(Ruta)
    UNION ALL
    SELECT 2, r.Ruta FROM (VALUES (1),(2),(3),(10),(40),(41),(50),(60)) AS r(Ruta)
    UNION ALL
    SELECT 3, r.Ruta FROM (VALUES (10),(11),(12),(13),(21),(40)) AS r(Ruta)
    UNION ALL
    SELECT 4, r.Ruta FROM (VALUES (20),(21),(40)) AS r(Ruta)
)
INSERT INTO bital.PermisosRol (Id, Rol, Ruta, Permitido, CreadoEn, CreadoPor)
SELECT NEWID(), rr.Rol, rr.Ruta, 1, @AhoraUtc, N'Migracion'
FROM RutasPorRol rr
WHERE NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol p
    WHERE p.Rol = rr.Rol AND p.Ruta = rr.Ruta
);

PRINT 'Usuarios y permisos: OK';
GO

/* ============================================================================
   4. SINCRONIZAR CENSO DESDE VITAL (Hosvital_Pruebas)
      Replica la lógica de GetAtencionesHospitalariasAsync + ObtenerCensoAsync
   ============================================================================ */
USE [BitalNegocio];
GO

DECLARE @VitalDb sysname = N'$(VitalDatabase)';
DECLARE @FechaOperativa date = TRY_CONVERT(date, N'$(FechaOperativa)', 23);
DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();
DECLARE @Sql nvarchar(max);
DECLARE @Insertados int = 0;

IF @FechaOperativa IS NULL
    SET @FechaOperativa = CAST(GETDATE() AS date);

SET @Sql = N'
;WITH Comidas AS (
    SELECT Comida FROM (VALUES (1),(2),(3),(4),(5),(6)) AS c(Comida)
),
CensoVital AS (
    SELECT
        i.IngCsc AS IdIngreso,
        RTRIM(LTRIM(i.MPTDoc)) AS TipoDocumento,
        RTRIM(LTRIM(i.MPcedu)) AS Cedula,
        LTRIM(RTRIM(CONCAT(
            RTRIM(LTRIM(cap.MPNom1)), N'' '',
            RTRIM(LTRIM(ISNULL(cap.MPNom2, N''''))), N'' '',
            RTRIM(LTRIM(cap.MPApe1)), N'' '',
            RTRIM(LTRIM(ISNULL(cap.MPApe2, N'''')))
        ))) AS NombreCompleto,
        RTRIM(LTRIM(map.MPNomP)) AS Pabellon,
        RTRIM(LTRIM(i.MPNumC)) AS Cama,
        CASE
            WHEN cap.MPFchN IS NULL THEN 0
            ELSE DATEDIFF(year, cap.MPFchN, GETDATE())
                - CASE WHEN DATEADD(year, DATEDIFF(year, cap.MPFchN, GETDATE()), cap.MPFchN) > GETDATE() THEN 1 ELSE 0 END
        END AS Edad
    FROM ' + QUOTENAME(@VitalDb) + N'.dbo.INGRESOS i
    INNER JOIN ' + QUOTENAME(@VitalDb) + N'.dbo.CAPBAS cap
        ON RTRIM(LTRIM(cap.MPCedu)) = RTRIM(LTRIM(i.MPcedu))
       AND RTRIM(LTRIM(cap.MPTDoc)) = RTRIM(LTRIM(i.MPTDoc))
    INNER JOIN ' + QUOTENAME(@VitalDb) + N'.dbo.MAEPAB map
        ON map.MPCodP = i.MPCodP
    WHERE i.MPCodP IN (3, 4, 5, 6, 7)
      AND i.IngFecEgr IS NULL
      AND (i.IngEstSld = 0 OR i.IngEstSld IS NULL)
      AND (i.IngHsp = ''S'' OR i.IngHsp IS NULL)
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
    N''Hospitalización'',
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
USE [BitalNegocio];
GO

SELECT N'Resumen post-migración' AS Seccion, Metrica, Valor
FROM (
    SELECT N'Dietas catálogo' AS Metrica, CAST(COUNT(*) AS sql_variant) AS Valor FROM dietas.DietasCatalogo
    UNION ALL
    SELECT N'Tarifas histórico', COUNT(*) FROM dietas.TarifasHistorico
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
    WHERE FechaOperativa = TRY_CONVERT(date, N'$(FechaOperativa)', 23)
) AS r;

PRINT '============================================================';
PRINT 'BITAL — Migración de datos completada';
PRINT 'Clave temporal usuarios: Bital2026! (cambiar en primer acceso)';
PRINT '============================================================';
GO
