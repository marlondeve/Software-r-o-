using Bital.Domain.Entities.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Bital.Infrastructure.Data.Configurations;

public class RolModuloConfiguration : IEntityTypeConfiguration<RolModulo>
{
    public void Configure(EntityTypeBuilder<RolModulo> builder)
    {
        builder.ToTable("RolesModulo", "bital");

        builder.Property(r => r.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(r => r.Nombre)
            .IsUnique();

        builder.HasMany(r => r.Usuarios)
            .WithOne(u => u.RolModulo)
            .HasForeignKey(u => u.RolModuloId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Permisos)
            .WithOne(p => p.RolModulo)
            .HasForeignKey(p => p.RolModuloId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
