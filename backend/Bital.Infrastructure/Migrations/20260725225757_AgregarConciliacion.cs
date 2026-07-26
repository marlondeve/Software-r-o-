using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarConciliacion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FilasConciliacion",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NumeroFactura = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Proveedor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Periodo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaOperativa = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Comida = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PacienteId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Paciente = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cedula = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Pabellon = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Habitacion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoDieta = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Consistencia = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CantidadSolicitada = table.Column<int>(type: "int", nullable: false),
                    CantidadEntregada = table.Column<int>(type: "int", nullable: false),
                    CantidadFacturada = table.Column<int>(type: "int", nullable: false),
                    Diferencia = table.Column<int>(type: "int", nullable: false),
                    ValorUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ValorTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResueltoPor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResueltaEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FilaDietaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EtiquetaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FilasConciliacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FilasConciliacion_EtiquetasEnfermeria_EtiquetaId",
                        column: x => x.EtiquetaId,
                        principalSchema: "bital",
                        principalTable: "EtiquetasEnfermeria",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_FilasConciliacion_FilasDietas_FilaDietaId",
                        column: x => x.FilaDietaId,
                        principalSchema: "dietas",
                        principalTable: "FilasDietas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_FilasConciliacion_EtiquetaId",
                schema: "bital",
                table: "FilasConciliacion",
                column: "EtiquetaId");

            migrationBuilder.CreateIndex(
                name: "IX_FilasConciliacion_FilaDietaId",
                schema: "bital",
                table: "FilasConciliacion",
                column: "FilaDietaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FilasConciliacion",
                schema: "bital");
        }
    }
}
