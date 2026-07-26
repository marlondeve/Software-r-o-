using Bital.Domain.Entities.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class TarifaHistoricoConfiguration : IEntityTypeConfiguration<TarifaHistorico>
{
    public void Configure(EntityTypeBuilder<TarifaHistorico> builder)
    {
        builder.ToTable("TarifasHistorico", "dietas");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .ValueGeneratedNever();

        builder.Property(t => t.Monto)
            .IsRequired()
            .HasColumnType("decimal(18,2)");

        builder.Property(t => t.Anio)
            .IsRequired();

        builder.Property(t => t.Observaciones)
            .HasMaxLength(500);

        builder.Property(t => t.CreadoPor)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(t => t.ModificadoPor)
            .HasMaxLength(100);

        // Índices
        builder.HasIndex(t => new { t.DietaCatalogoId, t.Anio, t.Activa })
            .HasDatabaseName("IX_TarifaHistorico_DietaAnioActiva");

        builder.HasIndex(t => new { t.VigenciaDesde, t.VigenciaHasta })
            .HasDatabaseName("IX_TarifaHistorico_Vigencia");
    }
}
