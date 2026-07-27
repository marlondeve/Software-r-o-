using Bital.Domain.Entities.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class ParametrosOperativosConfiguration : IEntityTypeConfiguration<ParametrosOperativos>
{
    public void Configure(EntityTypeBuilder<ParametrosOperativos> builder)
    {
        builder.ToTable("ParametrosOperativos", "dietas");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.ModoCarga)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.CreadoPor)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.ModificadoPor)
            .HasMaxLength(100);
    }
}
