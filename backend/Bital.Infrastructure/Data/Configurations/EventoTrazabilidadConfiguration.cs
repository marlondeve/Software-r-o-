using Bital.Domain.Entities.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class EventoTrazabilidadConfiguration : IEntityTypeConfiguration<EventoTrazabilidad>
{
    public void Configure(EntityTypeBuilder<EventoTrazabilidad> builder)
    {
        builder.ToTable("EventosTrazabilidad", "dietas");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedNever();

        builder.Property(e => e.EstadoNuevo)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(e => e.EstadoAnterior)
            .HasConversion<int>();

        builder.Property(e => e.TipoEvento)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Descripcion)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(e => e.Usuario)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.DatosAdicionales)
            .HasColumnType("nvarchar(max)");

        builder.Property(e => e.CreadoPor)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.ModificadoPor)
            .HasMaxLength(100);

        // Relaciones
        builder.HasOne(e => e.FilaDieta)
            .WithMany()
            .HasForeignKey(e => e.FilaDietaId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices
        builder.HasIndex(e => e.FilaDietaId)
            .HasDatabaseName("IX_EventoTrazabilidad_FilaDietaId");

        builder.HasIndex(e => new { e.FechaEvento, e.TipoEvento })
            .HasDatabaseName("IX_EventoTrazabilidad_FechaTipo");
    }
}
