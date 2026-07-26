using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    public partial class AddCuestionarios : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Cuestionarios",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Canal = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cuestionarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SeccionesCuestionario",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CuestionarioEncuestaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeccionesCuestionario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeccionesCuestionario_Cuestionarios_CuestionarioEncuestaId",
                        column: x => x.CuestionarioEncuestaId,
                        principalSchema: "bital",
                        principalTable: "Cuestionarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PreguntasCuestionario",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SeccionCuestionarioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EsRequerida = table.Column<bool>(type: "bit", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreguntasCuestionario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreguntasCuestionario_SeccionesCuestionario_SeccionCuestionarioId",
                        column: x => x.SeccionCuestionarioId,
                        principalSchema: "bital",
                        principalTable: "SeccionesCuestionario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LogicasPreguntaCuestionario",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreguntaCuestionarioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreguntaOrigenId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Operador = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Valor = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Accion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogicasPreguntaCuestionario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LogicasPreguntaCuestionario_PreguntasCuestionario_PreguntaCuestionarioId",
                        column: x => x.PreguntaCuestionarioId,
                        principalSchema: "bital",
                        principalTable: "PreguntasCuestionario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpcionesPreguntaCuestionario",
                schema: "bital",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PreguntaCuestionarioId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Texto = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    CreadoEn = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ModificadoEn = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModificadoPor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpcionesPreguntaCuestionario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OpcionesPreguntaCuestionario_PreguntasCuestionario_PreguntaCuestionarioId",
                        column: x => x.PreguntaCuestionarioId,
                        principalSchema: "bital",
                        principalTable: "PreguntasCuestionario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Cuestionario_CanalEstado",
                schema: "bital",
                table: "Cuestionarios",
                columns: new[] { "Canal", "Estado" });

            migrationBuilder.CreateIndex(
                name: "IX_SeccionCuestionario_CuestionarioOrden",
                schema: "bital",
                table: "SeccionesCuestionario",
                columns: new[] { "CuestionarioEncuestaId", "Orden" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PreguntaCuestionario_SeccionOrden",
                schema: "bital",
                table: "PreguntasCuestionario",
                columns: new[] { "SeccionCuestionarioId", "Orden" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LogicaPreguntaCuestionario_Pregunta",
                schema: "bital",
                table: "LogicasPreguntaCuestionario",
                column: "PreguntaCuestionarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OpcionPreguntaCuestionario_PreguntaOrden",
                schema: "bital",
                table: "OpcionesPreguntaCuestionario",
                columns: new[] { "PreguntaCuestionarioId", "Orden" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogicasPreguntaCuestionario",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "OpcionesPreguntaCuestionario",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "PreguntasCuestionario",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "SeccionesCuestionario",
                schema: "bital");

            migrationBuilder.DropTable(
                name: "Cuestionarios",
                schema: "bital");
        }
    }
}
