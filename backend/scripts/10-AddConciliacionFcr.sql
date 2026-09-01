/*
  RioSoft — columnas FCR en bital.FilasConciliacion (conciliación v1.2.8+)
  Ejecutar en BitalNegocio si Conciliación responde 500 por esquema desactualizado.

  sqlcmd -S SERVIDOR -d BitalNegocio -U usuario -P "***" -f 65001 -i backend\scripts\10-AddConciliacionFcr.sql
*/
SET NOCOUNT ON;

IF OBJECT_ID(N'bital.FilasConciliacion', N'U') IS NULL
BEGIN
    RAISERROR(N'No existe bital.FilasConciliacion. Aplique primero las migraciones base.', 16, 1);
    RETURN;
END

IF COL_LENGTH('bital.FilasConciliacion', 'CantidadCocina') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [CantidadCocina] int NULL;
END

IF COL_LENGTH('bital.FilasConciliacion', 'CantidadSistema') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [CantidadSistema] int NOT NULL CONSTRAINT [DF_FilasConciliacion_CantidadSistema] DEFAULT 0;
END

IF COL_LENGTH('bital.FilasConciliacion', 'EtiquetaPlanilla') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [EtiquetaPlanilla] nvarchar(max) NOT NULL CONSTRAINT [DF_FilasConciliacion_EtiquetaPlanilla] DEFAULT N'';
END

IF COL_LENGTH('bital.FilasConciliacion', 'Huerfanas') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [Huerfanas] int NOT NULL CONSTRAINT [DF_FilasConciliacion_Huerfanas] DEFAULT 0;
END

IF COL_LENGTH('bital.FilasConciliacion', 'LineaFcr') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [LineaFcr] nvarchar(max) NOT NULL CONSTRAINT [DF_FilasConciliacion_LineaFcr] DEFAULT N'';
END

IF COL_LENGTH('bital.FilasConciliacion', 'PeriodoDesde') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [PeriodoDesde] datetime2 NOT NULL CONSTRAINT [DF_FilasConciliacion_PeriodoDesde] DEFAULT '0001-01-01';
END

IF COL_LENGTH('bital.FilasConciliacion', 'PeriodoHasta') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [PeriodoHasta] datetime2 NOT NULL CONSTRAINT [DF_FilasConciliacion_PeriodoHasta] DEFAULT '0001-01-01';
END

IF COL_LENGTH('bital.FilasConciliacion', 'SinEtiqueta') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [SinEtiqueta] int NOT NULL CONSTRAINT [DF_FilasConciliacion_SinEtiqueta] DEFAULT 0;
END

IF COL_LENGTH('bital.FilasConciliacion', 'ValorCocina') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [ValorCocina] decimal(18,2) NOT NULL CONSTRAINT [DF_FilasConciliacion_ValorCocina] DEFAULT 0;
END

IF COL_LENGTH('bital.FilasConciliacion', 'ValorSistema') IS NULL
BEGIN
    ALTER TABLE [bital].[FilasConciliacion]
    ADD [ValorSistema] decimal(18,2) NOT NULL CONSTRAINT [DF_FilasConciliacion_ValorSistema] DEFAULT 0;
END

IF OBJECT_ID(N'[__EFMigrationsHistory]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM [__EFMigrationsHistory]
        WHERE [MigrationId] = N'20260831120000_AddConciliacionFcr')
    BEGIN
        INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
        VALUES (N'20260831120000_AddConciliacionFcr', N'8.0.11');
    END

    IF NOT EXISTS (
        SELECT 1 FROM [__EFMigrationsHistory]
        WHERE [MigrationId] = N'20260831183000_RevokeProveedorCargarPlanillaConciliacion')
    BEGIN
        INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
        VALUES (N'20260831183000_RevokeProveedorCargarPlanillaConciliacion', N'8.0.11');
    END
END

-- Quitar captura manual de planilla al Proveedor (nutricionista/admin la registran)
DELETE FROM bital.PermisosRol
WHERE RolModuloId = '11111111-1111-1111-1111-111111000003'
  AND Ruta = 33;

PRINT 'OK — Conciliación FCR: columnas y permisos actualizados.';
