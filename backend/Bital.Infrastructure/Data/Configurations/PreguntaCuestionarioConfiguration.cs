using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class PreguntaCuestionarioConfiguration : IEntityTypeConfiguration<PreguntaCuestionario>
{
    public void Configure(EntityTypeBuilder<PreguntaCuestionario> builder)
    {
        builder.ToTable("PreguntasCuestionario", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Texto).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Tipo).IsRequired().HasMaxLength(100);
        builder.Property(x => x.EsRequerida).IsRequired();
        builder.Property(x => x.Orden).IsRequired();
        builder.Property(x => x.Activa).IsRequired();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasMany(x => x.Opciones)
            .WithOne(x => x.Pregunta)
            .HasForeignKey(x => x.PreguntaCuestionarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Logica)
            .WithOne(x => x.Pregunta)
            .HasForeignKey<LogicaPreguntaCuestionario>(x => x.PreguntaCuestionarioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.SeccionCuestionarioId, x.Orden })
            .IsUnique()
            .HasDatabaseName("IX_PreguntaCuestionario_SeccionOrden");
    }
}
