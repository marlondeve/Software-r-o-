using Bital.Domain.Entities.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class OrdenCocinaConfiguration : IEntityTypeConfiguration<OrdenCocina>
{
    public void Configure(EntityTypeBuilder<OrdenCocina> builder)
    {
        builder.ToTable("OrdenesCocina", "dietas");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
            .ValueGeneratedNever();

        builder.Property(o => o.NumeroOrden)
            .IsRequired();

        builder.Property(o => o.Comida)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(o => o.FechaOperativa)
            .IsRequired();

        builder.Property(o => o.GeneradoPor)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.Estado)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(o => o.Observaciones)
            .HasMaxLength(1000);

        builder.Property(o => o.ChecklistJson)
            .HasColumnType("nvarchar(max)");

        builder.Property(o => o.CreadoPor)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(o => o.ModificadoPor)
            .HasMaxLength(100);

        // Relaciones
        builder.HasMany(o => o.Dietas)
            .WithOne()
            .HasForeignKey(d => d.OrdenCocinaId)
            .OnDelete(DeleteBehavior.SetNull);

        // Índices
        builder.HasIndex(o => new { o.FechaOperativa, o.Comida })
            .HasDatabaseName("IX_OrdenCocina_FechaComida");

        builder.HasIndex(o => o.NumeroOrden)
            .IsUnique()
            .HasDatabaseName("IX_OrdenCocina_Numero");

        builder.HasIndex(o => o.Estado)
            .HasDatabaseName("IX_OrdenCocina_Estado");
    }
}
