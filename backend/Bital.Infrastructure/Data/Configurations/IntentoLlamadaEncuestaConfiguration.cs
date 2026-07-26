using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class IntentoLlamadaEncuestaConfiguration : IEntityTypeConfiguration<IntentoLlamadaEncuesta>
{
    public void Configure(EntityTypeBuilder<IntentoLlamadaEncuesta> builder)
    {
        builder.ToTable("IntentosLlamadaEncuesta", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Resultado).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Observaciones).HasMaxLength(1000);
        builder.Property(x => x.UsuarioRegistro).HasMaxLength(100);
        builder.Property(x => x.FechaIntento).IsRequired();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasOne(x => x.CapturaEncuesta)
            .WithMany(x => x.IntentosLlamada)
            .HasForeignKey(x => x.CapturaEncuestaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.CapturaEncuestaId, x.FechaIntento })
            .HasDatabaseName("IX_IntentoLlamadaEncuesta_CapturaFecha");
    }
}