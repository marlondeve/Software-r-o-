using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class ReglaCondicionalEncuestaConfiguration : IEntityTypeConfiguration<ReglaCondicionalEncuesta>
{
    public void Configure(EntityTypeBuilder<ReglaCondicionalEncuesta> builder)
    {
        builder.ToTable("ReglasCondicionalesEncuesta", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Descripcion).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Campo).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Operador).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Valor).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Accion).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Estado).IsRequired().HasMaxLength(50);
        builder.Property(x => x.EsPredeterminada).IsRequired();
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasIndex(x => new { x.Estado, x.Campo })
            .HasDatabaseName("IX_ReglaCondicionalEncuesta_EstadoCampo");
    }
}