/*
  BITAL — Columna TiempoComida en dietas.TarifasHistorico (idempotente)
  Ejecutar en BitalNegocio si el catálogo falla por esquema desactualizado.

  sqlcmd -S 10.238.97.66 -d BitalNegocio -U soporterio -P "***" -f 65001 -i backend\scripts\04-TiempoComidaTarifaHistorico.sql
*/

SET NOCOUNT ON;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_TarifaHistorico_DietaAnioActiva'
      AND object_id = OBJECT_ID(N'dietas.TarifasHistorico')
)
BEGIN
    DROP INDEX [IX_TarifaHistorico_DietaAnioActiva] ON [dietas].[TarifasHistorico];
END

IF COL_LENGTH('dietas.TarifasHistorico', 'TiempoComida') IS NULL
BEGIN
    ALTER TABLE [dietas].[TarifasHistorico]
    ADD [TiempoComida] int NOT NULL CONSTRAINT [DF_TarifasHistorico_TiempoComida] DEFAULT 3;
END

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_TarifaHistorico_DietaComidaAnioActiva'
      AND object_id = OBJECT_ID(N'dietas.TarifasHistorico')
)
BEGIN
    CREATE INDEX [IX_TarifaHistorico_DietaComidaAnioActiva]
    ON [dietas].[TarifasHistorico] ([DietaCatalogoId], [TiempoComida], [Anio], [Activa]);
END

-- Registrar migración EF si aún no está (evita que Migrate() la reintente)
IF OBJECT_ID(N'[__EFMigrationsHistory]', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM [__EFMigrationsHistory]
       WHERE [MigrationId] = N'20260731141351_AddTiempoComidaTarifaHistorico'
   )
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260731141351_AddTiempoComidaTarifaHistorico', N'8.0.11');
END

PRINT 'OK — TiempoComida en TarifasHistorico';
