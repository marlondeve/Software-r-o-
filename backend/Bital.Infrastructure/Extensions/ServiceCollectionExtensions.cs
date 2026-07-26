using Bital.Infrastructure.Data;
using Bital.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Bital.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddVitalDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("VitalDatabaseReadOnly")
            ?? configuration.GetConnectionString("VitalDatabase")
            ?? throw new InvalidOperationException("Connection string 'VitalDatabase' no encontrado en configuración");

        services.AddDbContext<VitalDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.CommandTimeout(30);
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
            });

            options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
            options.EnableSensitiveDataLogging(false);
            options.EnableDetailedErrors(false);
        });

        return services;
    }

    public static IServiceCollection AddQueryServices(this IServiceCollection services)
    {
        services.AddScoped<Bital.Shared.Contracts.Services.IAtencionesQueryService, AtencionesQueryService>();
        services.AddScoped<Bital.Shared.Contracts.Services.IPacientesQueryService, PacientesQueryService>();
        return services;
    }
}