/*
  RioSoft — añade ListarConciliacion (30) al rol Proveedor si falta.
  Idempotente. Ejecutar en BitalNegocio si la BD ya estaba instalada antes de 1.2.5.
*/
SET NOCOUNT ON;
GO

DECLARE @RolProveedor uniqueidentifier = '11111111-1111-1111-1111-111111000003';
DECLARE @AhoraUtc datetime2 = SYSUTCDATETIME();

IF NOT EXISTS (
    SELECT 1
    FROM bital.PermisosRol
    WHERE RolModuloId = @RolProveedor AND Ruta = 30
)
BEGIN
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    VALUES (NEWID(), @RolProveedor, 30, 1, @AhoraUtc, N'seed-07-proveedor-conciliacion');
    PRINT 'Proveedor: permiso ListarConciliacion (30) añadido.';
END
ELSE
    PRINT 'Proveedor: permiso ListarConciliacion (30) ya existía.';
GO
