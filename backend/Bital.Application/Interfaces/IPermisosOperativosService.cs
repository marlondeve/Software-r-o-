using Bital.Domain.Enums;

namespace Bital.Application.Interfaces;

public interface IPermisosOperativosService
{
    Task<bool> UsuarioTieneRutaAsync(
        Guid rolModuloId,
        RutaDietas ruta,
        CancellationToken cancellationToken = default);

    Task VerificarRutaAsync(
        Guid rolModuloId,
        RutaDietas ruta,
        CancellationToken cancellationToken = default);

    Task VerificarConsultaEtiquetasAsync(
        Guid rolModuloId,
        CancellationToken cancellationToken = default);
}
