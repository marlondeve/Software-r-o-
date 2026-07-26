using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParametrosOperativos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CategoriasEdad",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EdadMinima = table.Column<int>(type: "int", nullable: false),
                    EdadMaxima = table.Column<int>(type: "int", nullable: false),
                    FactorPorcion = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Activa = table.Column<bool>(type: "bit", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    ModificadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriasEdad", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TiemposComida",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Comida = table.Column<int>(type: "int", nullable: false),
                    HoraPreparacion = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraCierre = table.Column<TimeSpan>(type: "time", nullable: false),
                    HoraEntrega = table.Column<TimeSpan>(type: "time", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    MinutosAlertaCierre = table.Column<int>(type: "int", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TiemposComida", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoriasEdad",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "TiemposComida",
                schema: "bital");
        }
    }
}
