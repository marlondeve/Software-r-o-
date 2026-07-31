using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEtiquetasCapacidadesYAuxiliarCocina : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO bital.RolesModulo (Id, Nombre, EsSistema, Activo, CreadoEn, CreadoPor)
                SELECT '11111111-1111-1111-1111-111111000006', N'Auxiliar de Cocina', 1, 1, GETUTCDATE(), N'migration'
                WHERE NOT EXISTS (
                    SELECT 1 FROM bital.RolesModulo WHERE Id = '11111111-1111-1111-1111-111111000006'
                );
                """);

            migrationBuilder.Sql("""
                DELETE FROM bital.PermisosRol
                WHERE RolModuloId = '11111111-1111-1111-1111-111111000004'
                  AND Ruta = 21;
                """);

            migrationBuilder.Sql("""
                INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
                SELECT NEWID(), rol.Id, r.Ruta, 1, GETUTCDATE(), N'migration'
                FROM bital.RolesModulo rol
                CROSS JOIN (VALUES (22)) AS r(Ruta)
                WHERE rol.Nombre = N'Enfermera'
                  AND NOT EXISTS (
                    SELECT 1 FROM bital.PermisosRol p
                    WHERE p.RolModuloId = rol.Id AND p.Ruta = r.Ruta
                  );
                """);

            migrationBuilder.Sql("""
                INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
                SELECT NEWID(), '11111111-1111-1111-1111-111111000006', r.Ruta, 1, GETUTCDATE(), N'migration'
                FROM (VALUES (20), (23), (24), (25), (40)) AS r(Ruta)
                WHERE NOT EXISTS (
                    SELECT 1 FROM bital.PermisosRol p
                    WHERE p.RolModuloId = '11111111-1111-1111-1111-111111000006'
                      AND p.Ruta = r.Ruta
                );
                """);

            migrationBuilder.Sql("""
                INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
                SELECT NEWID(), rol.Id, r.Ruta, 1, GETUTCDATE(), N'migration'
                FROM bital.RolesModulo rol
                CROSS JOIN (VALUES (22), (23), (24), (25)) AS r(Ruta)
                WHERE rol.Nombre = N'Administrador'
                  AND NOT EXISTS (
                    SELECT 1 FROM bital.PermisosRol p
                    WHERE p.RolModuloId = rol.Id AND p.Ruta = r.Ruta
                  );
                """);

            migrationBuilder.Sql("""
                INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
                SELECT NEWID(), rol.Id, r.Ruta, 1, GETUTCDATE(), N'migration'
                FROM bital.RolesModulo rol
                CROSS JOIN (VALUES (20)) AS r(Ruta)
                WHERE rol.Nombre = N'Proveedor'
                  AND NOT EXISTS (
                    SELECT 1 FROM bital.PermisosRol p
                    WHERE p.RolModuloId = rol.Id AND p.Ruta = r.Ruta
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM bital.PermisosRol
                WHERE RolModuloId = '11111111-1111-1111-1111-111111000006';
                """);

            migrationBuilder.Sql("""
                DELETE FROM bital.RolesModulo
                WHERE Id = '11111111-1111-1111-1111-111111000006';
                """);

            migrationBuilder.Sql("""
                DELETE FROM bital.PermisosRol
                WHERE Ruta IN (22, 23, 24, 25);
                """);
        }
    }
}
