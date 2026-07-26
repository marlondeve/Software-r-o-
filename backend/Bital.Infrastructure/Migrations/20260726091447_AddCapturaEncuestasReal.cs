using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCapturaEncuestasReal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CapturasEncuesta",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Consecutivo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CuestionarioEncuestaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NumeroDocumento = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TipoDocumento = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NombreCompleto = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Servicio = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Pabellon = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    NumeroAtencion = table.Column<int>(type: "int", nullable: true),
                    Canal = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaUltimaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFinalizacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioFinaliza = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MotivoAnulacion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaAnulacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UsuarioAnulacion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Sat = table.Column<int>(type: "int", nullable: true),
                    Nps = table.Column<int>(type: "int", nullable: true),
                    RequiereSeguimiento = table.Column<bool>(type: "bit", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CapturasEncuesta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CapturasEncuesta_Cuestionarios_CuestionarioEncuestaId",
                        column: x => x.CuestionarioEncuestaId,
                        principalSchema: "bital",
                        principalTable: "Cuestionarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "IntentosLlamadaEncuesta",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CapturaEncuestaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Resultado = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Observaciones = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FechaIntento = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsuarioRegistro = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_IntentosLlamadaEncuesta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_IntentosLlamadaEncuesta_CapturasEncuesta_CapturaEncuestaId",
                        column: x => x.CapturaEncuestaId,
                        principalSchema: "bital",
                        principalTable: "CapturasEncuesta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RespuestasCapturaEncuesta",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CapturaEncuestaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreguntaCuestionarioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OpcionPreguntaCuestionarioId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ValorTexto = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ValorMultiple = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FechaRespuesta = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RespuestasCapturaEncuesta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RespuestasCapturaEncuesta_CapturasEncuesta_CapturaEncuestaId",
                        column: x => x.CapturaEncuestaId,
                        principalSchema: "bital",
                        principalTable: "CapturasEncuesta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RespuestasCapturaEncuesta_OpcionesPreguntaCuestionario_OpcionPreguntaCuestionarioId",
                        column: x => x.OpcionPreguntaCuestionarioId,
                        principalSchema: "bital",
                        principalTable: "OpcionesPreguntaCuestionario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RespuestasCapturaEncuesta_PreguntasCuestionario_PreguntaCuestionarioId",
                        column: x => x.PreguntaCuestionarioId,
                        principalSchema: "bital",
                        principalTable: "PreguntasCuestionario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CapturaEncuesta_Consecutivo",
                schema: "bital",
                table: "CapturasEncuesta",
                column: "Consecutivo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CapturaEncuesta_DocumentoEstado",
                schema: "bital",
                table: "CapturasEncuesta",
                columns: new[] { "NumeroDocumento", "Estado" });

            migrationBuilder.CreateIndex(
                name: "IX_CapturasEncuesta_CuestionarioEncuestaId",
                schema: "bital",
                table: "CapturasEncuesta",
                column: "CuestionarioEncuestaId");

            migrationBuilder.CreateIndex(
                name: "IX_IntentoLlamadaEncuesta_CapturaFecha",
                schema: "bital",
                table: "IntentosLlamadaEncuesta",
                columns: new[] { "CapturaEncuestaId", "FechaIntento" });

            migrationBuilder.CreateIndex(
                name: "IX_RespuestaCapturaEncuesta_CapturaPregunta",
                schema: "bital",
                table: "RespuestasCapturaEncuesta",
                columns: new[] { "CapturaEncuestaId", "PreguntaCuestionarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RespuestasCapturaEncuesta_OpcionPreguntaCuestionarioId",
                schema: "bital",
                table: "RespuestasCapturaEncuesta",
                column: "OpcionPreguntaCuestionarioId");

            migrationBuilder.CreateIndex(
                name: "IX_RespuestasCapturaEncuesta_PreguntaCuestionarioId",
                schema: "bital",
                table: "RespuestasCapturaEncuesta",
                column: "PreguntaCuestionarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "IntentosLlamadaEncuesta",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "RespuestasCapturaEncuesta",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "CapturasEncuesta",
                schema: "bital");
        }
    }
}
