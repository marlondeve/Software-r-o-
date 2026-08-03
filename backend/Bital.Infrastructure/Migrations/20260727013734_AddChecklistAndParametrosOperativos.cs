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

            migrationBuilder.Sql("""
                IF COL_LENGTH('bital.CapturasEncuesta', 'Nps') IS NULL
                    ALTER TABLE [bital].[CapturasEncuesta] ADD [Nps] int NULL;
                IF COL_LENGTH('bital.CapturasEncuesta', 'RequiereSeguimiento') IS NULL
                    ALTER TABLE [bital].[CapturasEncuesta] ADD [RequiereSeguimiento] bit NOT NULL CONSTRAINT [DF_CapturasEncuesta_RequiereSeguimiento] DEFAULT 0;
                IF COL_LENGTH('bital.CapturasEncuesta', 'Sat') IS NULL
                    ALTER TABLE [bital].[CapturasEncuesta] ADD [Sat] int NULL;
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'[dietas].[ParametrosOperativos]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [dietas].[ParametrosOperativos](
                        [Id] uniqueidentifier NOT NULL,
                        [ModoCarga] nvarchar(50) NOT NULL,
                        [CreadoEn] datetime2 NOT NULL,
                        [CreadoPor] nvarchar(100) NOT NULL,
                        [ModificadoEn] datetime2 NULL,
                        [ModificadoPor] nvarchar(100) NULL,
                        CONSTRAINT [PK_ParametrosOperativos] PRIMARY KEY ([Id])
                    );
                END
                """);

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
