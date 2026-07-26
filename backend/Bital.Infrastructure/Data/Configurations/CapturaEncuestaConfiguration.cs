using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class CapturaEncuestaConfiguration : IEntityTypeConfiguration<CapturaEncuesta>
{
    public void Configure(EntityTypeBuilder<CapturaEncuesta> builder)
    {
        builder.ToTable("CapturasEncuesta", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Consecutivo).IsRequired().HasMaxLength(50);
        builder.Property(x => x.NumeroDocumento).IsRequired().HasMaxLength(50);
        builder.Property(x => x.TipoDocumento).IsRequired().HasMaxLength(20);
        builder.Property(x => x.NombreCompleto).IsRequired().HasMaxLength(250);
        builder.Property(x => x.Servicio).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Pabellon).HasMaxLength(100);
        builder.Property(x => x.Telefono).HasMaxLength(50);
        builder.Property(x => x.UsuarioFinaliza).HasMaxLength(100);
        builder.Property(x => x.MotivoAnulacion).HasMaxLength(500);
        builder.Property(x => x.UsuarioAnulacion).HasMaxLength(100);
        builder.Property(x => x.Sat);
        builder.Property(x => x.Nps);
        builder.Property(x => x.RequiereSeguimiento).IsRequired();
        builder.Property(x => x.Canal).IsRequired().HasConversion<int>();
        builder.Property(x => x.Estado).IsRequired().HasConversion<int>();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasOne(x => x.Cuestionario)
            .WithMany()
            .HasForeignKey(x => x.CuestionarioEncuestaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Respuestas)
            .WithOne(x => x.CapturaEncuesta)
            .HasForeignKey(x => x.CapturaEncuestaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.IntentosLlamada)
            .WithOne(x => x.CapturaEncuesta)
            .HasForeignKey(x => x.CapturaEncuestaId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.Consecutivo)
            .IsUnique()
            .HasDatabaseName("IX_CapturaEncuesta_Consecutivo");

        builder.HasIndex(x => new { x.NumeroDocumento, x.Estado })
            .HasDatabaseName("IX_CapturaEncuesta_DocumentoEstado");
    }
}