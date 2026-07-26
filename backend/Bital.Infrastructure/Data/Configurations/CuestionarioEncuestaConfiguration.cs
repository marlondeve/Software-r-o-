using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class CuestionarioEncuestaConfiguration : IEntityTypeConfiguration<CuestionarioEncuesta>
{
    public void Configure(EntityTypeBuilder<CuestionarioEncuesta> builder)
    {
        builder.ToTable("Cuestionarios", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Descripcion).HasMaxLength(1000);
        builder.Property(x => x.Canal).IsRequired().HasConversion<int>();
        builder.Property(x => x.Estado).IsRequired().HasConversion<int>();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasMany(x => x.Secciones)
            .WithOne(x => x.Cuestionario)
            .HasForeignKey(x => x.CuestionarioEncuestaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.Canal, x.Estado })
            .HasDatabaseName("IX_Cuestionario_CanalEstado");
    }
}
