using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "dietas");

            migrationBuilder.CreateTable(
                name: "DietasCatalogo",
                schema: "dietas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Usuario = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DietasCatalogo", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrdenesCocina",
                schema: "dietas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NumeroOrden = table.Column<int>(type: "int", nullable: false),
                    Comida = table.Column<int>(type: "int", nullable: false),
                    FechaOperativa = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalDietas = table.Column<int>(type: "int", nullable: false),
                    GeneradoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    GeneradoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenesCocina", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TarifasHistorico",
                schema: "dietas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DietaCatalogoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Anio = table.Column<int>(type: "int", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    VigenciaDesde = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VigenciaHasta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TarifasHistorico", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TarifasHistorico_DietasCatalogo_DietaCatalogoId",
                        column: x => x.DietaCatalogoId,
                        principalSchema: "dietas",
                        principalTable: "DietasCatalogo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FilasDietas",
                schema: "dietas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PacienteId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IdIngreso = table.Column<int>(type: "int", nullable: true),
                    Cedula = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    TipoDocumento = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: true),
                    Paciente = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Edad = table.Column<int>(type: "int", nullable: false),
                    Servicio = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Pabellon = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Habitacion = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Comida = table.Column<int>(type: "int", nullable: false),
                    Consistencia = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    TipoDietaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DescripcionDieta = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Aislado = table.Column<bool>(type: "bit", nullable: false),
                    Aislamiento = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ObservacionAislamiento = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Alergico = table.Column<bool>(type: "bit", nullable: false),
                    Alergias = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SolicitadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SolicitadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    CancelacionTardia = table.Column<bool>(type: "bit", nullable: false),
                    OrdenCocinaId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FechaOperativa = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FilasDietas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FilasDietas_DietasCatalogo_TipoDietaId",
                        column: x => x.TipoDietaId,
                        principalSchema: "dietas",
                        principalTable: "DietasCatalogo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FilasDietas_OrdenesCocina_OrdenCocinaId",
                        column: x => x.OrdenCocinaId,
                        principalSchema: "dietas",
                        principalTable: "OrdenesCocina",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EventosTrazabilidad",
                schema: "dietas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FilaDietaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EstadoNuevo = table.Column<int>(type: "int", nullable: false),
                    EstadoAnterior = table.Column<int>(type: "int", nullable: true),
                    TipoEvento = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Usuario = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FechaEvento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DatosAdicionales = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosTrazabilidad", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventosTrazabilidad_FilasDietas_FilaDietaId",
                        column: x => x.FilaDietaId,
                        principalSchema: "dietas",
                        principalTable: "FilasDietas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DietaCatalogo_Activa",
                schema: "dietas",
                table: "DietasCatalogo",
                column: "Activa");

            migrationBuilder.CreateIndex(
                name: "IX_DietaCatalogo_Codigo",
                schema: "dietas",
                table: "DietasCatalogo",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DietaCatalogo_Vigencia",
                schema: "dietas",
                table: "DietasCatalogo",
                columns: new[] { "FechaInicio", "FechaFin" });

            migrationBuilder.CreateIndex(
                name: "IX_EventoTrazabilidad_FechaTipo",
                schema: "dietas",
                table: "EventosTrazabilidad",
                columns: new[] { "FechaEvento", "TipoEvento" });

            migrationBuilder.CreateIndex(
                name: "IX_EventoTrazabilidad_FilaDietaId",
                schema: "dietas",
                table: "EventosTrazabilidad",
                column: "FilaDietaId");

            migrationBuilder.CreateIndex(
                name: "IX_FilaDieta_FechaComidaEstado",
                schema: "dietas",
                table: "FilasDietas",
                columns: new[] { "FechaOperativa", "Comida", "Estado" });

            migrationBuilder.CreateIndex(
                name: "IX_FilaDieta_IdIngreso",
                schema: "dietas",
                table: "FilasDietas",
                column: "IdIngreso");

            migrationBuilder.CreateIndex(
                name: "IX_FilaDieta_OrdenCocinaId",
                schema: "dietas",
                table: "FilasDietas",
                column: "OrdenCocinaId");

            migrationBuilder.CreateIndex(
                name: "IX_FilaDieta_PacienteId",
                schema: "dietas",
                table: "FilasDietas",
                column: "PacienteId");

            migrationBuilder.CreateIndex(
                name: "IX_FilasDietas_TipoDietaId",
                schema: "dietas",
                table: "FilasDietas",
                column: "TipoDietaId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCocina_Estado",
                schema: "dietas",
                table: "OrdenesCocina",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCocina_FechaComida",
                schema: "dietas",
                table: "OrdenesCocina",
                columns: new[] { "FechaOperativa", "Comida" });

            migrationBuilder.CreateIndex(
                name: "IX_OrdenCocina_Numero",
                schema: "dietas",
                table: "OrdenesCocina",
                column: "NumeroOrden",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TarifaHistorico_DietaAnioActiva",
                schema: "dietas",
                table: "TarifasHistorico",
                columns: new[] { "DietaCatalogoId", "Anio", "Activa" });

            migrationBuilder.CreateIndex(
                name: "IX_TarifaHistorico_Vigencia",
                schema: "dietas",
                table: "TarifasHistorico",
                columns: new[] { "VigenciaDesde", "VigenciaHasta" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventosTrazabilidad",
                schema: "dietas");

            migrationBuilder.DropTable(
                name: "TarifasHistorico",
                schema: "dietas");

            migrationBuilder.DropTable(
                name: "FilasDietas",
                schema: "dietas");

            migrationBuilder.DropTable(
                name: "DietasCatalogo",
                schema: "dietas");

            migrationBuilder.DropTable(
                name: "OrdenesCocina",
                schema: "dietas");
        }
    }
}
