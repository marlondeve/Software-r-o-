using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRolesModuloDinamicos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RolesModulo",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EsSistema = table.Column<bool>(type: "bit", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolesModulo", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RolesModulo_Nombre",
                schema: "bital",
                table: "RolesModulo",
                column: "Nombre",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO bital.RolesModulo (Id, Nombre, EsSistema, Activo, CreadoEn, CreadoPor)
                VALUES
                ('11111111-1111-1111-1111-111111000001', N'Administrador', 1, 1, GETUTCDATE(), N'migration'),
                ('11111111-1111-1111-1111-111111000002', N'Nutricionista', 1, 1, GETUTCDATE(), N'migration'),
                ('11111111-1111-1111-1111-111111000003', N'Proveedor', 1, 1, GETUTCDATE(), N'migration'),
                ('11111111-1111-1111-1111-111111000004', N'Enfermera', 1, 1, GETUTCDATE(), N'migration'),
                ('11111111-1111-1111-1111-111111000005', N'Doctor', 1, 1, GETUTCDATE(), N'migration');
                """);

            migrationBuilder.AddColumn<Guid>(
                name: "RolModuloId",
                schema: "bital",
                table: "PermisosRol",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RolModuloId",
                schema: "bital",
                table: "UsuariosModulo",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE p SET RolModuloId = CASE p.Rol
                    WHEN 1 THEN '11111111-1111-1111-1111-111111000001'
                    WHEN 2 THEN '11111111-1111-1111-1111-111111000002'
                    WHEN 3 THEN '11111111-1111-1111-1111-111111000003'
                    WHEN 4 THEN '11111111-1111-1111-1111-111111000004'
                    ELSE '11111111-1111-1111-1111-111111000004'
                END
                FROM bital.PermisosRol p;
                """);

            migrationBuilder.Sql("""
                UPDATE u SET RolModuloId = CASE u.Rol
                    WHEN 1 THEN '11111111-1111-1111-1111-111111000001'
                    WHEN 2 THEN '11111111-1111-1111-1111-111111000002'
                    WHEN 3 THEN '11111111-1111-1111-1111-111111000003'
                    WHEN 4 THEN '11111111-1111-1111-1111-111111000004'
                    ELSE '11111111-1111-1111-1111-111111000004'
                END
                FROM bital.UsuariosModulo u;
                """);

            migrationBuilder.DropColumn(
                name: "Rol",
                schema: "bital",
                table: "PermisosRol");

            migrationBuilder.DropColumn(
                name: "Rol",
                schema: "bital",
                table: "UsuariosModulo");

            migrationBuilder.AlterColumn<Guid>(
                name: "RolModuloId",
                schema: "bital",
                table: "PermisosRol",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "RolModuloId",
                schema: "bital",
                table: "UsuariosModulo",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.Sql("""
                INSERT INTO bital.PermisosRol (Id, RolModuloId, Ruta, Permitido, CreadoEn, CreadoPor)
                SELECT NEWID(), '11111111-1111-1111-1111-111111000005', p.Ruta, p.Permitido, GETUTCDATE(), N'migration'
                FROM bital.PermisosRol p
                WHERE p.RolModuloId = '11111111-1111-1111-1111-111111000002';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_PermisosRol_RolModuloId",
                schema: "bital",
                table: "PermisosRol",
                column: "RolModuloId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosModulo_RolModuloId",
                schema: "bital",
                table: "UsuariosModulo",
                column: "RolModuloId");

            migrationBuilder.AddForeignKey(
                name: "FK_PermisosRol_RolesModulo_RolModuloId",
                schema: "bital",
                table: "PermisosRol",
                column: "RolModuloId",
                principalSchema: "bital",
                principalTable: "RolesModulo",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuariosModulo_RolesModulo_RolModuloId",
                schema: "bital",
                table: "UsuariosModulo",
                column: "RolModuloId",
                principalSchema: "bital",
                principalTable: "RolesModulo",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PermisosRol_RolesModulo_RolModuloId",
                schema: "bital",
                table: "PermisosRol");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuariosModulo_RolesModulo_RolModuloId",
                schema: "bital",
                table: "UsuariosModulo");

            migrationBuilder.DropTable(
                name: "RolesModulo",
                schema: "bital");

            migrationBuilder.DropIndex(
                name: "IX_PermisosRol_RolModuloId",
                schema: "bital",
                table: "PermisosRol");

            migrationBuilder.DropIndex(
                name: "IX_UsuariosModulo_RolModuloId",
                schema: "bital",
                table: "UsuariosModulo");

            migrationBuilder.DropColumn(
                name: "RolModuloId",
                schema: "bital",
                table: "PermisosRol");

            migrationBuilder.DropColumn(
                name: "RolModuloId",
                schema: "bital",
                table: "UsuariosModulo");

            migrationBuilder.AddColumn<int>(
                name: "Rol",
                schema: "bital",
                table: "PermisosRol",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Rol",
                schema: "bital",
                table: "UsuariosModulo",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
