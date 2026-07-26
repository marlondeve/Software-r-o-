using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class FilaDietaConfiguration : IEntityTypeConfiguration<FilaDieta>
{
    public void Configure(EntityTypeBuilder<FilaDieta> builder)
    {
        builder.ToTable("FilasDietas", "dietas");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Id)
            .ValueGeneratedNever();

        builder.Property(f => f.PacienteId)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(f => f.Cedula)
            .HasMaxLength(20);

        builder.Property(f => f.TipoDocumento)
            .HasMaxLength(10);

        builder.Property(f => f.Paciente)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(f => f.Servicio)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.Pabellon)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(f => f.Habitacion)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(f => f.Comida)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(f => f.Consistencia)
            .HasMaxLength(50);

        builder.Property(f => f.DescripcionDieta)
            .HasMaxLength(500);

        builder.Property(f => f.Aislamiento)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.Alergias)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(f => f.ObservacionAislamiento)
            .HasMaxLength(500);

        builder.Property(f => f.Observaciones)
            .HasMaxLength(1000);

        builder.Property(f => f.SolicitadoPor)
            .HasMaxLength(100);

        builder.Property(f => f.Estado)
            .IsRequired()
            .HasConversion<int>();

        builder.Property(f => f.FechaOperativa)
            .IsRequired();

        builder.Property(f => f.CreadoPor)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(f => f.ModificadoPor)
            .HasMaxLength(100);

        // Relaciones
        builder.HasOne(f => f.TipoDieta)
            .WithMany(d => d.Dietas)
            .HasForeignKey(f => f.TipoDietaId)
            .OnDelete(DeleteBehavior.SetNull);

        // Índices
        builder.HasIndex(f => new { f.FechaOperativa, f.Comida, f.Estado })
            .HasDatabaseName("IX_FilaDieta_FechaComidaEstado");

        builder.HasIndex(f => f.PacienteId)
            .HasDatabaseName("IX_FilaDieta_PacienteId");

        builder.HasIndex(f => f.IdIngreso)
            .HasDatabaseName("IX_FilaDieta_IdIngreso");

        builder.HasIndex(f => f.OrdenCocinaId)
            .HasDatabaseName("IX_FilaDieta_OrdenCocinaId");
    }
}
