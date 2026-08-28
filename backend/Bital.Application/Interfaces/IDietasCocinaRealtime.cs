using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

/// <summary>
/// Avisa a las sesiones abiertas. No persiste ni audita: solo notifica después de SaveChanges.
/// </summary>
public interface IDietasCocinaRealtime
{
    Task NotificarFilaAsync(FilaDietaDto fila, CancellationToken cancellationToken = default);

    Task NotificarCensoAsync(CensoActualizadoDto cambio, CancellationToken cancellationToken = default);

    Task NotificarOrdenAsync(OrdenCocinaDto orden, CancellationToken cancellationToken = default);

    Task NotificarEtiquetasAsync(IReadOnlyList<EtiquetaEnfermeraDto> etiquetas, CancellationToken cancellationToken = default);

    Task NotificarParametrosAsync(CancellationToken cancellationToken = default);

    Task NotificarCatalogoAsync(CancellationToken cancellationToken = default);

    Task NotificarConciliacionAsync(CancellationToken cancellationToken = default);

    Task NotificarPermisosAsync(CancellationToken cancellationToken = default);
}
