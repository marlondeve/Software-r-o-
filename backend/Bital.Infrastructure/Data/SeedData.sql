-- LEGACY — no usar en instalaciones nuevas.
-- El catálogo vigente es FCR (D-001 … D-012) con TiempoComida en TarifasHistorico.
-- Preferir:
--   .\backend\scripts\Initialize-BitalNegocioClean.ps1
--   .\backend\scripts\Migrate-BitalNegocio.ps1
--   backend\scripts\06-SeedCleanInstall.sql
--   backend\scripts\02-MigrateData.sql
--
-- Base de datos: BitalNegocio | SQL Server 2019+
-- IMPORTANTE: usar UTF-8 → sqlcmd ... -f 65001

USE BitalNegocio;
GO

-- Crear esquema si no existe
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dietas')
BEGIN
	EXEC('CREATE SCHEMA dietas');
END
GO

-- Insertar tipos de dietas básicos
DECLARE @DietaNormalId UNIQUEIDENTIFIER = NEWID();
DECLARE @DietaBlandaId UNIQUEIDENTIFIER = NEWID();
DECLARE @DietaLiquidaId UNIQUEIDENTIFIER = NEWID();
DECLARE @DietaDiabeticaId UNIQUEIDENTIFIER = NEWID();
DECLARE @DietaHiposodicaId UNIQUEIDENTIFIER = NEWID();

-- Dieta Normal
INSERT INTO dietas.DietasCatalogo (Id, Codigo, Nombre, Descripcion, FechaInicio, FechaFin, Usuario, Activa, CreadoEn, CreadoPor)
VALUES (
	@DietaNormalId,
	'DN001',
	'Dieta Normal',
	'Dieta completa y balanceada sin restricciones especiales',
	'2025-01-01',
	NULL,
	'Sistema',
	1,
	GETUTCDATE(),
	'Sistema'
);

-- Tarifa año 2025
INSERT INTO dietas.TarifasHistorico (Id, DietaCatalogoId, Anio, Monto, VigenciaDesde, VigenciaHasta, Activa, CreadoEn, CreadoPor)
VALUES (
	NEWID(),
	@DietaNormalId,
	2025,
	25000.00,
	'2025-01-01',
	'2025-12-31',
	1,
	GETUTCDATE(),
	'Sistema'
);

-- Dieta Blanda
INSERT INTO dietas.DietasCatalogo (Id, Codigo, Nombre, Descripcion, FechaInicio, FechaFin, Usuario, Activa, CreadoEn, CreadoPor)
VALUES (
	@DietaBlandaId,
	'DB001',
	'Dieta Blanda',
	'Alimentos de fácil digestión y textura suave',
	'2025-01-01',
	NULL,
	'Sistema',
	1,
	GETUTCDATE(),
	'Sistema'
);

INSERT INTO dietas.TarifasHistorico (Id, DietaCatalogoId, Anio, Monto, VigenciaDesde, VigenciaHasta, Activa, CreadoEn, CreadoPor)
VALUES (
	NEWID(),
	@DietaBlandaId,
	2025,
	28000.00,
	'2025-01-01',
	'2025-12-31',
	1,
	GETUTCDATE(),
	'Sistema'
);

-- Dieta Líquida
INSERT INTO dietas.DietasCatalogo (Id, Codigo, Nombre, Descripcion, FechaInicio, FechaFin, Usuario, Activa, CreadoEn, CreadoPor)
VALUES (
	@DietaLiquidaId,
	'DL001',
	'Dieta Líquida',
	'Solo líquidos claros o completos según indicación',
	'2025-01-01',
	NULL,
	'Sistema',
	1,
	GETUTCDATE(),
	'Sistema'
);

INSERT INTO dietas.TarifasHistorico (Id, DietaCatalogoId, Anio, Monto, VigenciaDesde, VigenciaHasta, Activa, CreadoEn, CreadoPor)
VALUES (
	NEWID(),
	@DietaLiquidaId,
	2025,
	22000.00,
	'2025-01-01',
	'2025-12-31',
	1,
	GETUTCDATE(),
	'Sistema'
);

-- Dieta Diabética
INSERT INTO dietas.DietasCatalogo (Id, Codigo, Nombre, Descripcion, FechaInicio, FechaFin, Usuario, Activa, CreadoEn, CreadoPor)
VALUES (
	@DietaDiabeticaId,
	'DD001',
	'Dieta Diabética',
	'Control de carbohidratos y azúcares para pacientes diabéticos',
	'2025-01-01',
	NULL,
	'Sistema',
	1,
	GETUTCDATE(),
	'Sistema'
);

INSERT INTO dietas.TarifasHistorico (Id, DietaCatalogoId, Anio, Monto, VigenciaDesde, VigenciaHasta, Activa, CreadoEn, CreadoPor)
VALUES (
	NEWID(),
	@DietaDiabeticaId,
	2025,
	32000.00,
	'2025-01-01',
	'2025-12-31',
	1,
	GETUTCDATE(),
	'Sistema'
);

-- Dieta Hiposódica
INSERT INTO dietas.DietasCatalogo (Id, Codigo, Nombre, Descripcion, FechaInicio, FechaFin, Usuario, Activa, CreadoEn, CreadoPor)
VALUES (
	@DietaHiposodicaId,
	'DH001',
	'Dieta Hiposódica',
	'Baja en sodio para pacientes con hipertensión o problemas renales',
	'2025-01-01',
	NULL,
	'Sistema',
	1,
	GETUTCDATE(),
	'Sistema'
);

INSERT INTO dietas.TarifasHistorico (Id, DietaCatalogoId, Anio, Monto, VigenciaDesde, VigenciaHasta, Activa, CreadoEn, CreadoPor)
VALUES (
	NEWID(),
	@DietaHiposodicaId,
	2025,
	30000.00,
	'2025-01-01',
	'2025-12-31',
	1,
	GETUTCDATE(),
	'Sistema'
);

GO

PRINT 'Catálogo de dietas inicializado correctamente';
GO
