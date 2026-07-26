using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPacientesEncuestas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "IdentificacionesPacientes",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NumeroDocumento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoDocumento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Canal = table.Column<int>(type: "int", nullable: false),
                    NombresPaciente = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApellidosPaciente = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ServicioAtencion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NumeroAtencion = table.Column<int>(type: "int", nullable: true),
                    FechaIdentificacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioIdentificador = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IdentificacionesPacientes", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IdentificacionesPacientes",
                schema: "bital");
        }
    }
}
