using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class RespuestaCapturaEncuestaConfiguration : IEntityTypeConfiguration<RespuestaCapturaEncuesta>
{
    public void Configure(EntityTypeBuilder<RespuestaCapturaEncuesta> builder)
    {
        builder.ToTable("RespuestasCapturaEncuesta", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.ValorTexto).HasMaxLength(1000);
        builder.Property(x => x.ValorMultiple).HasMaxLength(1000);
        builder.Property(x => x.FechaRespuesta).IsRequired();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasOne(x => x.Pregunta)
            .WithMany()
            .HasForeignKey(x => x.PreguntaCuestionarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Opcion)
            .WithMany()
            .HasForeignKey(x => x.OpcionPreguntaCuestionarioId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.CapturaEncuestaId, x.PreguntaCuestionarioId })
            .IsUnique()
            .HasDatabaseName("IX_RespuestaCapturaEncuesta_CapturaPregunta");
    }
}