using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTiempoComidaTarifaHistorico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_TarifaHistorico_DietaAnioActiva'
                      AND object_id = OBJECT_ID(N'dietas.TarifasHistorico')
                )
                BEGIN
                    DROP INDEX [IX_TarifaHistorico_DietaAnioActiva] ON [dietas].[TarifasHistorico];
                END
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dietas.TarifasHistorico', 'TiempoComida') IS NULL
                BEGIN
                    ALTER TABLE [dietas].[TarifasHistorico]
                    ADD [TiempoComida] int NOT NULL CONSTRAINT [DF_TarifasHistorico_TiempoComida] DEFAULT 3;
                END
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_TarifaHistorico_DietaComidaAnioActiva'
                      AND object_id = OBJECT_ID(N'dietas.TarifasHistorico')
                )
                BEGIN
                    CREATE INDEX [IX_TarifaHistorico_DietaComidaAnioActiva]
                    ON [dietas].[TarifasHistorico] ([DietaCatalogoId], [TiempoComida], [Anio], [Activa]);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_TarifaHistorico_DietaComidaAnioActiva'
                      AND object_id = OBJECT_ID(N'dietas.TarifasHistorico')
                )
                BEGIN
                    DROP INDEX [IX_TarifaHistorico_DietaComidaAnioActiva] ON [dietas].[TarifasHistorico];
                END
                """);

            migrationBuilder.Sql("""
                IF COL_LENGTH('dietas.TarifasHistorico', 'TiempoComida') IS NOT NULL
                BEGIN
                    ALTER TABLE [dietas].[TarifasHistorico] DROP CONSTRAINT [DF_TarifasHistorico_TiempoComida];
                    ALTER TABLE [dietas].[TarifasHistorico] DROP COLUMN [TiempoComida];
                END
                """);

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_TarifaHistorico_DietaAnioActiva'
                      AND object_id = OBJECT_ID(N'dietas.TarifasHistorico')
                )
                BEGIN
                    CREATE INDEX [IX_TarifaHistorico_DietaAnioActiva]
                    ON [dietas].[TarifasHistorico] ([DietaCatalogoId], [Anio], [Activa]);
                END
                """);
        }
    }
}
