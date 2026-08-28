using Bital.Application.DTOs.DietasCocina;
using Bital.Application.Interfaces;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Sin hub (tests o arranque sin SignalR). Las mutaciones siguen guardando.
/// </summary>
public sealed class NullDietasCocinaRealtime : IDietasCocinaRealtime
{
    public static NullDietasCocinaRealtime Instance { get; } = new();

    public Task NotificarFilaAsync(FilaDietaDto fila, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotificarCensoAsync(CensoActualizadoDto cambio, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotificarOrdenAsync(OrdenCocinaDto orden, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotificarEtiquetasAsync(
        IReadOnlyList<EtiquetaEnfermeraDto> etiquetas,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotificarParametrosAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotificarCatalogoAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotificarConciliacionAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task NotificarPermisosAsync(CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
