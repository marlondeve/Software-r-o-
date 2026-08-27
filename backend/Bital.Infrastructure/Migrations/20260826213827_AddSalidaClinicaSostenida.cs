using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bital.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSalidaClinicaSostenida : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "SalidaClinicaSostenida",
                schema: "dietas",
                table: "FilasDietas",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SalidaClinicaSostenida",
                schema: "dietas",
                table: "FilasDietas");
        }
    }
}
