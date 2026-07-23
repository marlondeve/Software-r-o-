using Bital.ApiConsultas.Data;
using Bital.ApiConsultas.Services;
using Microsoft.EntityFrameworkCore;

namespace Bital.ApiConsultas.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registra el DbContext de Vital con configuración read-only
    /// </summary>
    public static IServiceCollection AddVitalDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("VitalDatabaseReadOnly")
            ?? configuration.GetConnectionString("VitalDatabase")
            ?? throw new InvalidOperationException("Connection string 'VitalDatabase' no encontrado en configuración");

        services.AddDbContext<VitalDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.CommandTimeout(30);
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(5),
                    errorNumbersToAdd: null);
            });

            // Configuración de rendimiento para lectura
            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            options.EnableSensitiveDataLogging(false);
            options.EnableDetailedErrors(false);
        });

        return services;
    }

    /// <summary>
    /// Registra todos los servicios de consulta
    /// </summary>
    public static IServiceCollection AddQueryServices(this IServiceCollection services)
    {
        services.AddScoped<IAtencionesQueryService, AtencionesQueryService>();
        services.AddScoped<IPacientesQueryService, PacientesQueryService>();

        return services;
    }

    /// <summary>
    /// Agrega health checks para monitoreo
    /// </summary>
    public static IServiceCollection AddBitalHealthChecks(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var healthChecksBuilder = services.AddHealthChecks();

        // Health check de base de datos Vital
        var connectionString = configuration.GetConnectionString("VitalDatabaseReadOnly")
            ?? configuration.GetConnectionString("VitalDatabase");

        if (!string.IsNullOrEmpty(connectionString))
        {
            healthChecksBuilder.AddSqlServer(
                connectionString: connectionString,
                name: "vital-database",
                failureStatus: Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus.Unhealthy,
                tags: new[] { "database", "vital" },
                timeout: TimeSpan.FromSeconds(5));
        }

        return services;
    }
}
