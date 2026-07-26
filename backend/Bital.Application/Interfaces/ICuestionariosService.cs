using Bital.Application.DTOs.Encuestas;

namespace Bital.Application.Interfaces;

public interface ICuestionariosService
{
    Task<ListaCuestionariosDto> ObtenerCuestionariosAsync(FiltrosCuestionariosDto filtros, CancellationToken cancellationToken = default);
    Task<CuestionarioDetalleDto> ObtenerCuestionarioAsync(Guid id, CancellationToken cancellationToken = default);
    Task<CuestionarioDetalleDto> CrearCuestionarioAsync(CuestionarioCreacionDto dto, CancellationToken cancellationToken = default);
    Task<CuestionarioDetalleDto> ActualizarCuestionarioAsync(Guid id, CuestionarioActualizacionDto dto, CancellationToken cancellationToken = default);
    Task<CuestionarioDetalleDto> CambiarEstadoAsync(Guid id, CuestionarioEstadoDto dto, CancellationToken cancellationToken = default);
    Task<CuestionarioDetalleDto> DuplicarCuestionarioAsync(Guid id, CuestionarioDuplicadoDto? dto = null, CancellationToken cancellationToken = default);
    Task EliminarCuestionarioAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EstructuraCuestionarioDto> ObtenerEstructuraAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EstructuraCuestionarioDto> GuardarEstructuraAsync(Guid id, EstructuraCuestionarioDto dto, CancellationToken cancellationToken = default);
    Task<PreguntaCuestionarioDto> AgregarPreguntaAsync(Guid id, PreguntaCuestionarioCreacionDto dto, CancellationToken cancellationToken = default);
    Task<PreguntaCuestionarioDto> EditarPreguntaAsync(Guid id, Guid preguntaId, PreguntaCuestionarioActualizacionDto dto, CancellationToken cancellationToken = default);
    Task<PreguntaCuestionarioDto> ActualizarLogicaAsync(Guid id, Guid preguntaId, LogicaPreguntaCuestionarioDto dto, CancellationToken cancellationToken = default);
}
