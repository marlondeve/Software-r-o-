using Bital.Application;
using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Bital.ApiNegocio.Hubs;

public sealed class DietasCocinaRealtimePublisher : IDietasCocinaRealtime
{
    private readonly IHubContext<DietasCocinaHub> _hub;
    private readonly ILogger<DietasCocinaRealtimePublisher> _logger;

    public DietasCocinaRealtimePublisher(
        IHubContext<DietasCocinaHub> hub,
        ILogger<DietasCocinaRealtimePublisher> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public Task NotificarFilaAsync(FilaDietaDto fila, CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.FilaActualizada, fila, cancellationToken);

    public Task NotificarCensoAsync(CensoActualizadoDto cambio, CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.CensoActualizado, cambio, cancellationToken);

    public Task NotificarOrdenAsync(OrdenCocinaDto orden, CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.OrdenActualizada, orden, cancellationToken);

    public Task NotificarEtiquetasAsync(
        IReadOnlyList<EtiquetaEnfermeraDto> etiquetas,
        CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.EtiquetasActualizadas, etiquetas, cancellationToken);

    public Task NotificarParametrosAsync(CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.ParametrosActualizados, new { }, cancellationToken);

    public Task NotificarCatalogoAsync(CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.CatalogoActualizado, new { }, cancellationToken);

    public Task NotificarConciliacionAsync(CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.ConciliacionActualizada, new { }, cancellationToken);

    public Task NotificarPermisosAsync(CancellationToken cancellationToken = default) =>
        Enviar(DietasCocinaRealtimeEventos.PermisosActualizados, new { }, cancellationToken);

    private async Task Enviar(string evento, object payload, CancellationToken cancellationToken)
    {
        try
        {
            await _hub.Clients.Group(DietasCocinaHub.GrupoOperativo)
                .SendAsync(evento, payload, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo emitir {Evento} por SignalR", evento);
        }
    }
}
