using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarEtiquetasEnfermeria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "bital");

            migrationBuilder.CreateTable(
                name: "EtiquetasEnfermeria",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrdenCocinaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FilaDietaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EstadoLogistica = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Comida = table.Column<int>(type: "int", nullable: false),
                    FechaOperativa = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GeneradaPor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneradaEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ImpresaEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RecibidoPor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PreEntregadaEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EntregadoPor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EntregadaEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MotivoDevolucion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstadoDietaDevolucion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ObservacionesDevolucion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FotoDevolucionUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DevueltaEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Observaciones = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EtiquetasEnfermeria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EtiquetasEnfermeria_FilasDietas_FilaDietaId",
                        column: x => x.FilaDietaId,
                        principalSchema: "dietas",
                        principalTable: "FilasDietas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EtiquetasEnfermeria_OrdenesCocina_OrdenCocinaId",
                        column: x => x.OrdenCocinaId,
                        principalSchema: "dietas",
                        principalTable: "OrdenesCocina",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EtiquetasEnfermeria_FilaDietaId",
                schema: "bital",
                table: "EtiquetasEnfermeria",
                column: "FilaDietaId");

            migrationBuilder.CreateIndex(
                name: "IX_EtiquetasEnfermeria_OrdenCocinaId",
                schema: "bital",
                table: "EtiquetasEnfermeria",
                column: "OrdenCocinaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EtiquetasEnfermeria",
                schema: "bital");
        }
    }
}
