using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizarRolesModuloDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE bital.RolesModulo
                SET Nombre = N'Administrador', EsSistema = 1, Activo = 1
                WHERE Id = '11111111-1111-1111-1111-111111000001';

                UPDATE bital.RolesModulo
                SET Activo = 0
                WHERE Id = '11111111-1111-1111-1111-111111000005';

                INSERT INTO bital.RolesModulo (Id, Nombre, EsSistema, Activo, CreadoEn, CreadoPor)
                SELECT '11111111-1111-1111-1111-111111000006', N'Auxiliar de Cocina', 1, 1, GETUTCDATE(), N'migration'
                WHERE NOT EXISTS (
                    SELECT 1 FROM bital.RolesModulo WHERE Id = '11111111-1111-1111-1111-111111000006'
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE bital.RolesModulo
                SET Nombre = N'Administrador'
                WHERE Id = '11111111-1111-1111-1111-111111000001';

                UPDATE bital.RolesModulo
                SET Activo = 1
                WHERE Id = '11111111-1111-1111-1111-111111000005';
                """);
        }
    }
}
