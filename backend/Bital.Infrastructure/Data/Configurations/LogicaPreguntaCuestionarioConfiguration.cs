using Bital.Domain.Entities.Encuestas;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class LogicaPreguntaCuestionarioConfiguration : IEntityTypeConfiguration<LogicaPreguntaCuestionario>
{
    public void Configure(EntityTypeBuilder<LogicaPreguntaCuestionario> builder)
    {
        builder.ToTable("LogicasPreguntaCuestionario", "bital");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();
        builder.Property(x => x.Operador).HasMaxLength(100);
        builder.Property(x => x.Valor).HasMaxLength(500);
        builder.Property(x => x.Accion).HasMaxLength(200);
        builder.Property(x => x.CreadoPor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.ModificadoPor).HasMaxLength(100);

        builder.HasIndex(x => x.PreguntaCuestionarioId)
            .IsUnique()
            .HasDatabaseName("IX_LogicaPreguntaCuestionario_Pregunta");
    }
}
