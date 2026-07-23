using Bital.ApiConsultas.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace Bital.ApiConsultas.Data;

/// <summary>
/// DbContext read-only para acceso a la base de datos de Vital (HIS)
/// </summary>
public class VitalDbContext : DbContext
{
    public VitalDbContext(DbContextOptions<VitalDbContext> options) : base(options)
    {
        // Configurar modo read-only a nivel de contexto
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
        ChangeTracker.AutoDetectChangesEnabled = false;
        ChangeTracker.LazyLoadingEnabled = false;
    }

    // DbSets - mapean a las tablas de Vital
    public DbSet<CapBasica> CapBasica => Set<CapBasica>();
    public DbSet<MaestroPaciente> MaestroPacientes => Set<MaestroPaciente>();
    public DbSet<Ingreso> Ingresos => Set<Ingreso>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Schema de Vital
        modelBuilder.HasDefaultSchema("dbo");

        // CAPBAS - Llave compuesta
        modelBuilder.Entity<CapBasica>()
            .HasKey(c => new { c.Cedula, c.TipoDocumento });

        // MAEPAC - Llave compuesta
        modelBuilder.Entity<MaestroPaciente>()
            .HasKey(m => new { m.Cedula, m.TipoDocumento });

        // INGRESOS - Llave compuesta
        modelBuilder.Entity<Ingreso>()
            .HasKey(i => new { i.Cedula, i.TipoDocumento, i.Consecutivo });

        // Relaciones
        modelBuilder.Entity<MaestroPaciente>()
            .HasOne(m => m.CapBasica)
            .WithOne(c => c.MaestroPaciente)
            .HasForeignKey<MaestroPaciente>(m => new { m.Cedula, m.TipoDocumento });

        modelBuilder.Entity<Ingreso>()
            .HasOne(i => i.MaestroPaciente)
            .WithMany(m => m.Ingresos)
            .HasForeignKey(i => new { i.Cedula, i.TipoDocumento });
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);

        // Configuraciones adicionales de rendimiento para lectura
        optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);

        // Timeouts
        if (optionsBuilder.IsConfigured)
        {
            optionsBuilder.EnableSensitiveDataLogging(false);
            optionsBuilder.EnableDetailedErrors(false);
        }
    }

    // Override para prevenir operaciones de escritura
    public override int SaveChanges()
    {
        throw new InvalidOperationException("Este contexto es read-only. No se permiten operaciones de escritura.");
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("Este contexto es read-only. No se permiten operaciones de escritura.");
    }
}

