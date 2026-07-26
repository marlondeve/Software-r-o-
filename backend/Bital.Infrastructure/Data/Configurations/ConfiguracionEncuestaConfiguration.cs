using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class ConfiguracionEncuestaConfiguration : IEntityTypeConfiguration<ConfiguracionEncuesta>
{
    public void Configure(EntityTypeBuilder<ConfiguracionEncuesta> builder)
    {
        builder.ToTable("ConfiguracionesEncuesta", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Clave).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Valor).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Descripcion).HasMaxLength(1000);
        builder.Property(x => x.Activo).IsRequired();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasIndex(x => x.Clave)
            .IsUnique()
            .HasDatabaseName("IX_ConfiguracionEncuesta_Clave");
    }
}