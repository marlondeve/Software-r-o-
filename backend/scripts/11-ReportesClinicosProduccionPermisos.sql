/*
  RioSoft — rutas explícitas de reportes clínicos (42) y producción (43).
  Corrige que Conciliación (30) o Cocina (11–13) infieran reportes al recargar permisos.

  sqlcmd -S SERVIDOR -d BitalNegocio -U usuario -P "***" -f 65001 -i backend\scripts\11-ReportesClinicosProduccionPermisos.sql
*/
SET NOCOUNT ON;

DECLARE @NutricionistaId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111000002';
DECLARE @ProveedorId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111000003';
DECLARE @AdministradorId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111000001';

IF OBJECT_ID(N'bital.PermisosRol', N'U') IS NULL
BEGIN
    RAISERROR(N'No existe bital.PermisosRol.', 16, 1);
    RETURN;
END

-- Nutricionista: reportes clínicos
IF NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol
    WHERE RolModuloId = @NutricionistaId AND Ruta = 42)
BEGIN
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    VALUES (NEWID(), @NutricionistaId, 42, 1, SYSUTCDATETIME(), N'script-11');
END

-- Proveedor: solo reportes de producción (quitar clínicos si quedó)
DELETE FROM bital.PermisosRol
WHERE RolModuloId = @ProveedorId AND Ruta = 42;

IF NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol
    WHERE RolModuloId = @ProveedorId AND Ruta = 43)
BEGIN
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    VALUES (NEWID(), @ProveedorId, 43, 1, SYSUTCDATETIME(), N'script-11');
END

-- Administrador: ambos tipos de reporte
IF NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol
    WHERE RolModuloId = @AdministradorId AND Ruta = 42)
BEGIN
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    VALUES (NEWID(), @AdministradorId, 42, 1, SYSUTCDATETIME(), N'script-11');
END

IF NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol
    WHERE RolModuloId = @AdministradorId AND Ruta = 43)
BEGIN
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    VALUES (NEWID(), @AdministradorId, 43, 1, SYSUTCDATETIME(), N'script-11');
END

PRINT 'OK — permisos 42/43 de reportes aplicados.';
