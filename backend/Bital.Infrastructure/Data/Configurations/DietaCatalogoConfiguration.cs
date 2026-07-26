using Bital.Domain.Entities.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class DietaCatalogoConfiguration : IEntityTypeConfiguration<DietaCatalogo>
{
    public void Configure(EntityTypeBuilder<DietaCatalogo> builder)
    {
        builder.ToTable("DietasCatalogo", "dietas");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id)
            .ValueGeneratedNever();

        builder.Property(d => d.Codigo)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(d => d.Nombre)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.Descripcion)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(d => d.Usuario)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.CreadoPor)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.ModificadoPor)
            .HasMaxLength(100);

        // Relaciones
        builder.HasMany(d => d.HistoricoTarifas)
            .WithOne(t => t.DietaCatalogo)
            .HasForeignKey(t => t.DietaCatalogoId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices
        builder.HasIndex(d => d.Codigo)
            .IsUnique()
            .HasDatabaseName("IX_DietaCatalogo_Codigo");

        builder.HasIndex(d => d.Activa)
            .HasDatabaseName("IX_DietaCatalogo_Activa");

        builder.HasIndex(d => new { d.FechaInicio, d.FechaFin })
            .HasDatabaseName("IX_DietaCatalogo_Vigencia");
    }
}
