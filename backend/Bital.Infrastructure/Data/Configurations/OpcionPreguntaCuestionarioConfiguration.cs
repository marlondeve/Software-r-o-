using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class OpcionPreguntaCuestionarioConfiguration : IEntityTypeConfiguration<OpcionPreguntaCuestionario>
{
    public void Configure(EntityTypeBuilder<OpcionPreguntaCuestionario> builder)
    {
        builder.ToTable("OpcionesPreguntaCuestionario", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Texto).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Valor).HasMaxLength(200);
        builder.Property(x => x.Orden).IsRequired();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasIndex(x => new { x.PreguntaCuestionarioId, x.Orden })
            .IsUnique()
            .HasDatabaseName("IX_OpcionPreguntaCuestionario_PreguntaOrden");
    }
}
