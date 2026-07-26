using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParametrosEncuestas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ModificadoPor",
                schema: "bital",
                table: "SeccionesCuestionario",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreadoPor",
                schema: "bital",
                table: "SeccionesCuestionario",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<int>(
                name: "Estado",
                schema: "bital",
                table: "IdentificacionesPacientes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Pabellon",
                schema: "bital",
                table: "IdentificacionesPacientes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                schema: "bital",
                table: "IdentificacionesPacientes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConfiguracionesEncuesta",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Clave = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesEncuesta", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReglasCondicionalesEncuesta",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Campo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Operador = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EsPredeterminada = table.Column<bool>(type: "bit", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReglasCondicionalesEncuesta", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracionEncuesta_Clave",
                schema: "bital",
                table: "ConfiguracionesEncuesta",
                column: "Clave",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReglaCondicionalEncuesta_EstadoCampo",
                schema: "bital",
                table: "ReglasCondicionalesEncuesta",
                columns: new[] { "Estado", "Campo" });

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfiguracionesEncuesta",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "ReglasCondicionalesEncuesta",
                schema: "bital");

            migrationBuilder.DropColumn(
                name: "Estado",
                schema: "bital",
                table: "IdentificacionesPacientes");

            migrationBuilder.DropColumn(
                name: "Pabellon",
                schema: "bital",
                table: "IdentificacionesPacientes");

            migrationBuilder.DropColumn(
                name: "Telefono",
                schema: "bital",
                table: "IdentificacionesPacientes");

            migrationBuilder.AlterColumn<string>(
                name: "ModificadoPor",
                schema: "bital",
                table: "SeccionesCuestionario",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CreadoPor",
                schema: "bital",
                table: "SeccionesCuestionario",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
