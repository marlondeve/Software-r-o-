using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    [DbContext(typeof(Bital.Infrastructure.Data.BitalNegocioDbContext))]
    [Migration("20260831120000_AddConciliacionFcr")]
    public partial class AddConciliacionFcr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CantidadCocina",
                schema: "bital",
                table: "FilasConciliacion",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CantidadSistema",
                schema: "bital",
                table: "FilasConciliacion",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "EtiquetaPlanilla",
                schema: "bital",
                table: "FilasConciliacion",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Huerfanas",
                schema: "bital",
                table: "FilasConciliacion",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "LineaFcr",
                schema: "bital",
                table: "FilasConciliacion",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "PeriodoDesde",
                schema: "bital",
                table: "FilasConciliacion",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "PeriodoHasta",
                schema: "bital",
                table: "FilasConciliacion",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SinEtiqueta",
                schema: "bital",
                table: "FilasConciliacion",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorCocina",
                schema: "bital",
                table: "FilasConciliacion",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorSistema",
                schema: "bital",
                table: "FilasConciliacion",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CantidadCocina", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "CantidadSistema", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "EtiquetaPlanilla", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "Huerfanas", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "LineaFcr", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "PeriodoDesde", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "PeriodoHasta", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "SinEtiqueta", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "ValorCocina", schema: "bital", table: "FilasConciliacion");
            migrationBuilder.DropColumn(name: "ValorSistema", schema: "bital", table: "FilasConciliacion");
        }
    }
}
