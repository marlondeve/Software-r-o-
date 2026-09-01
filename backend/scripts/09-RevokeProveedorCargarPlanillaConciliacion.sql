/*
  RioSoft — quita CargarPlanillaConciliacion (33) al rol Proveedor.
  Ejecutar en BitalNegocio si la migración EF aún no se aplicó.
*/
DECLARE @ProveedorId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111000003';
DECLARE @Ruta INT = 33;

DELETE FROM bital.PermisosRol
WHERE RolModuloId = @ProveedorId AND Ruta = @Ruta;

PRINT 'Proveedor: permiso CargarPlanillaConciliacion (33) revocado.';
