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
    public DbSet<Atencion> Atenciones => Set<Atencion>();
    public DbSet<Paciente> Pacientes => Set<Paciente>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuración de entidades
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(VitalDbContext).Assembly);

        // Schema de Vital (ajustar según la estructura real)
        modelBuilder.HasDefaultSchema("dbo");
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
