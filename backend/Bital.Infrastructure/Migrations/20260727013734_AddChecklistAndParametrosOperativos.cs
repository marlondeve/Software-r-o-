using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChecklistAndParametrosOperativos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ChecklistJson",
                schema: "dietas",
                table: "OrdenesCocina",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Nps",
                schema: "bital",
                table: "CapturasEncuesta",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequiereSeguimiento",
                schema: "bital",
                table: "CapturasEncuesta",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Sat",
                schema: "bital",
                table: "CapturasEncuesta",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ParametrosOperativos",
                schema: "dietas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModoCarga = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParametrosOperativos", x => x.Id);
                });

            migrationBuilder.AddColumn<string>(
                name: "FacturaDocumentoUrl",
                schema: "bital",
                table: "FilasConciliacion",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                schema: "bital",
                table: "UsuariosModulo",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ParametrosOperativos",
                schema: "dietas");

            migrationBuilder.DropColumn(
                name: "FacturaDocumentoUrl",
                schema: "bital",
                table: "FilasConciliacion");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                schema: "bital",
                table: "UsuariosModulo");

            migrationBuilder.DropColumn(
                name: "ChecklistJson",
                schema: "dietas",
                table: "OrdenesCocina");

            migrationBuilder.DropColumn(
                name: "Nps",
                schema: "bital",
                table: "CapturasEncuesta");

            migrationBuilder.DropColumn(
                name: "RequiereSeguimiento",
                schema: "bital",
                table: "CapturasEncuesta");

            migrationBuilder.DropColumn(
                name: "Sat",
                schema: "bital",
                table: "CapturasEncuesta");
        }
    }
}
