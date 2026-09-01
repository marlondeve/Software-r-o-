using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    [DbContext(typeof(Bital.Infrastructure.Data.BitalNegocioDbContext))]
    [Migration("20260831183000_RevokeProveedorCargarPlanillaConciliacion")]
    public partial class RevokeProveedorCargarPlanillaConciliacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM bital.PermisosRol
                WHERE RolModuloId = '11111111-1111-1111-1111-111111000003'
                  AND Ruta = 33;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM bital.PermisosRol
                    WHERE RolModuloId = '11111111-1111-1111-1111-111111000003' AND Ruta = 33)
                BEGIN
                    INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
                    VALUES (NEWID(), '11111111-1111-1111-1111-111111000003', 33, 1, SYSUTCDATETIME(), N'migration-revoke-proveedor-planilla-down');
                END
                """);
        }
    }
}
