using Bital.Application.Interfaces;
using Bital.Application.Options;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.DietasCocina;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Bital.ApiNegocio.Hosted;

/// <summary>
/// Sincroniza el censo HIS en el servidor (un writer) y avisa por SignalR si hubo cambios.
/// </summary>
public sealed class CensoHisSyncHostedService : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly IOptions<DietasCocinaOptions> _opciones;
    private readonly ILogger<CensoHisSyncHostedService> _logger;

    public CensoHisSyncHostedService(
        IServiceScopeFactory scopes,
        IOptions<DietasCocinaOptions> opciones,
        ILogger<CensoHisSyncHostedService> logger)
    {
        _scopes = scopes;
        _opciones = opciones;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var segundos = Math.Max(5, _opciones.Value.CensoHisSyncIntervalSeconds);
        var intervalo = TimeSpan.FromSeconds(segundos);

        await Task.Delay(TimeSpan.FromSeconds(8), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SincronizarComidasActivas(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Fallo el sync periódico del censo HIS");
            }

            try
            {
                await Task.Delay(intervalo, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task SincronizarComidasActivas(CancellationToken stoppingToken)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BitalNegocioDbContext>();
        var dietas = scope.ServiceProvider.GetRequiredService<IDietasService>();

        var activas = await db.TiemposComida
            .AsNoTracking()
            .Where(t => t.Activo)
            .Select(t => t.Comida)
            .ToListAsync(stoppingToken);

        if (activas.Count == 0)
            activas = Enum.GetValues<TiempoComida>().ToList();

        var hoy = HorarioOperativoHelper.HoyColombia();

        foreach (var comida in activas)
        {
            stoppingToken.ThrowIfCancellationRequested();
            try
            {
                await dietas.ObtenerCensoAsync(hoy, comida.ToString(), stoppingToken);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("sincronizando", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogDebug("Censo {Comida} ocupado por otro writer", comida);
            }
        }
    }
}
