/*
  RioSoft — añade CargarPlanillaConciliacion (33) a Nutricionista si falta.
  El Proveedor ya no debe capturar planilla (ver script 09 / migración 20260831183000).
*/
DECLARE @NutricionistaId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111000002';
DECLARE @Ruta INT = 33;

IF NOT EXISTS (
    SELECT 1 FROM bital.PermisosRol
    WHERE RolModuloId = @NutricionistaId AND Ruta = @Ruta)
BEGIN
    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
    VALUES (NEWID(), @NutricionistaId, @Ruta, 1, SYSUTCDATETIME(), N'script-08');
    PRINT 'Nutricionista: permiso CargarPlanillaConciliacion (33) añadido.';
END
ELSE
    PRINT 'Nutricionista: permiso CargarPlanillaConciliacion (33) ya existía.';
