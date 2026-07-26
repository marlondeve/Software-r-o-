using Bital.Application.DTOs.Encuestas;

namespace Bital.Application.Interfaces;

public interface IEncuestasBffService
{
    Task<EnvelopePacientesDto> BuscarPacientesAsync(string termino, int maxResults = 10, CancellationToken cancellationToken = default);
    Task<EnvelopeAtencionesDto> ObtenerAtencionesAsync(string cedula, string tipoDocumento, CancellationToken cancellationToken = default);
    Task<PacienteContextoDto> RegistrarIdentificacionAsync(IdentificarPacienteRequestDto request, string usuario, CancellationToken cancellationToken = default);

    Task<RespuestaCapturaPresencialDto> ObtenerCapturaPresencialAsync(FiltrosCapturaPresencialDto filtros, CancellationToken cancellationToken = default);
    Task<RespuestaCapturaTelefonicaDto> ObtenerCapturaTelefonicaAsync(FiltrosCapturaTelefonicaDto filtros, CancellationToken cancellationToken = default);

    Task<InicioCapturaEncuestaResponseDto> IniciarCapturaPresencialAsync(string pacienteId, Guid cuestionarioId, CancellationToken cancellationToken = default);
    Task GuardarRespuestasAsync(string encuestaId, GuardarRespuestasEncuestaRequestDto request, CancellationToken cancellationToken = default);
    Task<FinalizarEncuestaResponseDto> CompletarEncuestaAsync(string encuestaId, FinalizarEncuestaRequestDto request, CancellationToken cancellationToken = default);

    Task<FilaCapturaTelefonicaDto?> RegistrarIntentoLlamadaAsync(string id, IntentoLlamadaRequestDto request, CancellationToken cancellationToken = default);
    Task<RespuestaCapturaTelefonicaInicioDto> IniciarEncuestaTelefonicaAsync(string id, CancellationToken cancellationToken = default);

    Task<ListaEncuestasRealizadasDto> ObtenerEncuestasRealizadasAsync(FiltrosEncuestasRealizadasDto filtros, CancellationToken cancellationToken = default);
    Task<DetalleEncuestaRealizadaDto> ObtenerEncuestaRealizadaAsync(string id, CancellationToken cancellationToken = default);
    Task<DetalleEncuestaRealizadaDto> AnularEncuestaRealizadaAsync(string id, AnularEncuestaRequestDto request, string usuario, CancellationToken cancellationToken = default);

    Task<RespuestaIndicadoresExperienciaDto> ObtenerIndicadoresExperienciaAsync(FiltrosIndicadoresExperienciaDto filtros, CancellationToken cancellationToken = default);
    Task<List<SegmentoBarraDto>> ObtenerNivelSatisfaccionAsync(FiltrosIndicadoresExperienciaDto filtros, CancellationToken cancellationToken = default);
    Task<RespuestaAnalisisBrechasDto> ObtenerAnalisisBrechasAsync(FiltrosAnalisisBrechasDto filtros, CancellationToken cancellationToken = default);

    Task<RespuestaParametrosEncuestaDto> ObtenerReglasEncuestasAsync(CancellationToken cancellationToken = default);
    Task<ReglaCondicionalEncuestaDto> CrearReglaEncuestaAsync(NuevaReglaEncuestaDto request, CancellationToken cancellationToken = default);
    Task<ReglaCondicionalEncuestaDto> CambiarEstadoReglaEncuestaAsync(string id, CambiarEstadoReglaEncuestaDto request, CancellationToken cancellationToken = default);
    Task<EstadoModoPruebaEncuestaDto> ObtenerModoPruebaEncuestaAsync(CancellationToken cancellationToken = default);
    Task<EstadoModoPruebaEncuestaDto> ActualizarModoPruebaEncuestaAsync(EstadoModoPruebaEncuestaDto request, CancellationToken cancellationToken = default);
}
