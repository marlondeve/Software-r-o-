using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPermisosCatalogoDietas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
                SELECT NEWID(), rol.Id, r.Ruta, 1, GETUTCDATE(), N'migration'
                FROM bital.RolesModulo rol
                CROSS JOIN (VALUES (5), (6), (7), (8)) AS r(Ruta)
                WHERE rol.Nombre IN (N'Administrador', N'Nutricionista', N'Doctor')
                  AND NOT EXISTS (
                    SELECT 1
                    FROM bital.PermisosRol p
                    WHERE p.RolModuloId = rol.Id AND p.Ruta = r.Ruta
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM bital.PermisosRol
                WHERE Ruta IN (5, 6, 7, 8);
                """);
        }
    }
}
