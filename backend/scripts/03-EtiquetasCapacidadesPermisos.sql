/*
================================================================================
  BITAL — Permisos granulares de etiquetas / bandejas (SQL Server 2019+)
  Base destino : BitalNegocio (esquema bital)

  Equivalente a la migración EF:
    20260731120000_AddEtiquetasCapacidadesYAuxiliarCocina

  Rutas nuevas (RutaDietas):
    20 = ListarEtiquetas
    21 = ImprimirEtiquetas
    22 = RecepcionProveedor   (recepción enfermería)
    23 = EntregaPaciente
    24 = RechazoAntesEntrega
    25 = RecogidaBandeja

  Ejecutar en SSMS o sqlcmd (UTF-8):
    sqlcmd -S <servidor> -d BitalNegocio -f 65001 -i backend\scripts\03-EtiquetasCapacidadesPermisos.sql

  Idempotente: se puede ejecutar más de una vez sin duplicar filas.
================================================================================
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

USE [BitalNegocio];
GO

IF OBJECT_ID(N'bital.RolesModulo', N'U') IS NULL
   OR OBJECT_ID(N'bital.PermisosRol', N'U') IS NULL
BEGIN
    RAISERROR(N'Faltan tablas bital.RolesModulo o bital.PermisosRol. Aplique primero las migraciones EF base.', 16, 1);
    RETURN;
END
GO

DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

DECLARE @RolAdmin         uniqueidentifier = '11111111-1111-1111-1111-111111000001';
DECLARE @RolNutricionista uniqueidentifier = '11111111-1111-1111-1111-111111000002';
DECLARE @RolProveedor     uniqueidentifier = '11111111-1111-1111-1111-111111000003';
DECLARE @RolEnfermera     uniqueidentifier = '11111111-1111-1111-1111-111111000004';
DECLARE @RolDoctor        uniqueidentifier = '11111111-1111-1111-1111-111111000005';
DECLARE @RolAuxiliar      uniqueidentifier = '11111111-1111-1111-1111-111111000006';

BEGIN TRANSACTION;

BEGIN TRY

    PRINT '==> Rol Auxiliar de Cocina';
    IF NOT EXISTS (SELECT 1 FROM bital.RolesModulo WHERE Id = @RolAuxiliar)
    BEGIN
        INSERT INTO bital.RolesModulo (Id, Nombre, EsSistema, Activo, CreadoEn, CreadoPor)
        VALUES (@RolAuxiliar, N'Auxiliar de Cocina', 1, 1, @AhoraUtc, N'SQL-03-EtiquetasCapacidades');
        PRINT '    Insertado rol Auxiliar de Cocina';
    END
    ELSE
        PRINT '    Rol Auxiliar de Cocina ya existe';

    PRINT '==> Enfermera: quitar impresión (21), asegurar recepción (22)';
    DELETE FROM bital.PermisosRol
    WHERE RolModuloId = @RolEnfermera AND Ruta = 21;

    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    SELECT NEWID(), @RolEnfermera, r.Ruta, 1, @AhoraUtc, N'SQL-03-EtiquetasCapacidades'
    FROM (VALUES (1), (20), (22), (40)) AS r(Ruta)
    WHERE NOT EXISTS (
        SELECT 1 FROM bital.PermisosRol p
        WHERE p.RolModuloId = @RolEnfermera AND p.Ruta = r.Ruta
    );

    PRINT '==> Auxiliar de Cocina: bandejas en piso';
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    SELECT NEWID(), @RolAuxiliar, r.Ruta, 1, @AhoraUtc, N'SQL-03-EtiquetasCapacidades'
    FROM (VALUES (20), (23), (24), (25), (40)) AS r(Ruta)
    WHERE NOT EXISTS (
        SELECT 1 FROM bital.PermisosRol p
        WHERE p.RolModuloId = @RolAuxiliar AND p.Ruta = r.Ruta
    );

    PRINT '==> Administrador: rutas granulares 22-26';
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    SELECT NEWID(), @RolAdmin, r.Ruta, 1, @AhoraUtc, N'SQL-03-EtiquetasCapacidades'
    FROM (VALUES (22), (23), (24), (25), (26)) AS r(Ruta)
    WHERE NOT EXISTS (
        SELECT 1 FROM bital.PermisosRol p
        WHERE p.RolModuloId = @RolAdmin AND p.Ruta = r.Ruta
    );

    PRINT '==> Proveedor: listar etiquetas (20) si falta';
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    SELECT NEWID(), @RolProveedor, r.Ruta, 1, @AhoraUtc, N'SQL-03-EtiquetasCapacidades'
    FROM (VALUES (20)) AS r(Ruta)
    WHERE NOT EXISTS (
        SELECT 1 FROM bital.PermisosRol p
        WHERE p.RolModuloId = @RolProveedor AND p.Ruta = r.Ruta
    );

    PRINT '==> Registrar migración EF (evita re-ejecución al arrancar la API)';
    IF OBJECT_ID(N'[__EFMigrationsHistory]', N'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM [__EFMigrationsHistory]
            WHERE MigrationId = N'20260731120000_AddEtiquetasCapacidadesYAuxiliarCocina'
        )
        BEGIN
            INSERT INTO [__EFMigrationsHistory] (MigrationId, ProductVersion)
            VALUES (N'20260731120000_AddEtiquetasCapacidadesYAuxiliarCocina', N'8.0.13');
            PRINT '    Fila añadida en __EFMigrationsHistory';
        END
        ELSE
            PRINT '    Migración ya registrada en __EFMigrationsHistory';
    END
    ELSE
        PRINT '    AVISO: no existe __EFMigrationsHistory; la API intentará aplicar la migración al iniciar';

    COMMIT TRANSACTION;
    PRINT '';
    PRINT 'OK — Permisos de etiquetas actualizados';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @Msg nvarchar(4000) = ERROR_MESSAGE();
    RAISERROR(N'Error en 03-EtiquetasCapacidadesPermisos: %s', 16, 1, @Msg);
    RETURN;
END CATCH
GO

/* Verificación */
PRINT '';
PRINT '--- Permisos por rol (etiquetas / bandejas) ---';

SELECT
    rm.Nombre AS Rol,
    p.Ruta,
    CASE p.Ruta
        WHEN 20 THEN N'ListarEtiquetas'
        WHEN 21 THEN N'ImprimirEtiquetas'
        WHEN 22 THEN N'RecepcionProveedor'
        WHEN 23 THEN N'EntregaPaciente'
        WHEN 24 THEN N'RechazoAntesEntrega'
        WHEN 25 THEN N'RecogidaBandeja'
        WHEN 26 THEN N'VerBandejasPiso'
        WHEN 40 THEN N'VerDashboard'
        WHEN  1 THEN N'ListarDietas'
        ELSE N'Otro'
    END AS Descripcion
FROM bital.PermisosRol p
INNER JOIN bital.RolesModulo rm ON rm.Id = p.RolModuloId
WHERE p.Ruta IN (1, 20, 21, 22, 23, 24, 25, 26, 40)
  AND rm.Nombre IN (N'Administrador', N'Enfermera', N'Proveedor', N'Auxiliar de Cocina')
ORDER BY rm.Nombre, p.Ruta;
GO
