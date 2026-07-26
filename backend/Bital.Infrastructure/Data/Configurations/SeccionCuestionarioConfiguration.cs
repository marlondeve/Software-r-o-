using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class SeccionCuestionarioConfiguration : IEntityTypeConfiguration<SeccionCuestionario>
{
    public void Configure(EntityTypeBuilder<SeccionCuestionario> builder)
    {
        builder.ToTable("SeccionesCuestionario", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Nombre).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Orden).IsRequired();

        builder.HasMany(x => x.Preguntas)
            .WithOne(x => x.Seccion)
            .HasForeignKey(x => x.SeccionCuestionarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.CuestionarioEncuestaId, x.Orden })
            .IsUnique()
            .HasDatabaseName("IX_SeccionCuestionario_CuestionarioOrden");
    }
}
