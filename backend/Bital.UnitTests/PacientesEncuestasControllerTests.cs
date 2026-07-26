using Bital.ApiNegocio.Controllers;
using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

namespace Bital.UnitTests;

public class PacientesEncuestasControllerTests
{
    [Fact]
    public async Task ObtenerEncuestasRealizadas_DevuelveEnvelopeConDataYMeta()
    {
        var service = new FakeEncuestasService
        {
            ListaRespuesta = new ListaEncuestasRealizadasDto
            {
                Data = new List<FilaEncuestaRealizadaDto>
                {
                    new() { Id = "1", Consecutivo = "ENC-001", Estado = "Completada", FechaRealizacion = DateTime.UtcNow }
                },
                Meta = new Bital.Application.DTOs.DietasCocina.MetaPaginacionDto { Total = 1, Page = 1, PageSize = 10, TotalPages = 1 }
            }
        };

        var controller = new PacientesEncuestasController(service, NullLogger<PacientesEncuestasController>.Instance);

        var result = await controller.ObtenerEncuestasRealizadas(null, null, null, null, null, null, null, null, 1, 10);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = ok.Value!;
        Assert.NotNull(GetPropertyValue(payload, "data"));
        Assert.NotNull(GetPropertyValue(payload, "meta"));
    }

    [Fact]
    public async Task ObtenerEncuestaRealizada_CuandoNoExisteRetornaNotFound()
    {
        var service = new FakeEncuestasService
        {
            DetalleException = new KeyNotFoundException("No se encontró la encuesta realizada 1")
        };

        var controller = new PacientesEncuestasController(service, NullLogger<PacientesEncuestasController>.Instance);

        var result = await controller.ObtenerEncuestaRealizada("1");

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task ObtenerAnalisisBrechas_DevuelveKpisDataYMeta()
    {
        var service = new FakeEncuestasService
        {
            BrechasRespuesta = new RespuestaAnalisisBrechasDto
            {
                Data = new List<FilaBrechaDto> { new() { Id = "1", Estado = "en_gestion" } },
                Meta = new Bital.Application.DTOs.DietasCocina.MetaPaginacionDto { Total = 1, Page = 1, PageSize = 10, TotalPages = 1 },
                Kpis = new KpisBrechasDto { TotalBrechas = 1, EnGestion = 1, Pendientes = 0, Justificadas = 0, ContactoInvalido = 0 }
            }
        };

        var controller = new PacientesEncuestasController(service, NullLogger<PacientesEncuestasController>.Instance);

        var result = await controller.ObtenerAnalisisBrechas(null, null, null, null, null, 1, 10);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = ok.Value!;
        Assert.NotNull(GetPropertyValue(payload, "data"));
        Assert.NotNull(GetPropertyValue(payload, "meta"));
        Assert.NotNull(GetPropertyValue(payload, "kpis"));
    }

    private sealed class FakeEncuestasService : IEncuestasBffService
    {
        public ListaEncuestasRealizadasDto ListaRespuesta { get; set; } = new();
        public RespuestaAnalisisBrechasDto BrechasRespuesta { get; set; } = new();
        public Exception? DetalleException { get; set; }

        public Task<EnvelopePacientesDto> BuscarPacientesAsync(string termino, int maxResults = 10, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<EnvelopeAtencionesDto> ObtenerAtencionesAsync(string cedula, string tipoDocumento, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PacienteContextoDto> RegistrarIdentificacionAsync(IdentificarPacienteRequestDto request, string usuario, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<RespuestaCapturaPresencialDto> ObtenerCapturaPresencialAsync(FiltrosCapturaPresencialDto filtros, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<RespuestaCapturaTelefonicaDto> ObtenerCapturaTelefonicaAsync(FiltrosCapturaTelefonicaDto filtros, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<InicioCapturaEncuestaResponseDto> IniciarCapturaPresencialAsync(string pacienteId, Guid cuestionarioId, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task GuardarRespuestasAsync(string encuestaId, GuardarRespuestasEncuestaRequestDto request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<FinalizarEncuestaResponseDto> CompletarEncuestaAsync(string encuestaId, FinalizarEncuestaRequestDto request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<FilaCapturaTelefonicaDto?> RegistrarIntentoLlamadaAsync(string id, IntentoLlamadaRequestDto request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<RespuestaCapturaTelefonicaInicioDto> IniciarEncuestaTelefonicaAsync(string id, CancellationToken cancellationToken = default) => throw new NotImplementedException();

        public Task<ListaEncuestasRealizadasDto> ObtenerEncuestasRealizadasAsync(FiltrosEncuestasRealizadasDto filtros, CancellationToken cancellationToken = default) => Task.FromResult(ListaRespuesta);
        public Task<DetalleEncuestaRealizadaDto> ObtenerEncuestaRealizadaAsync(string id, CancellationToken cancellationToken = default) => DetalleException == null ? Task.FromResult(new DetalleEncuestaRealizadaDto { Id = id }) : Task.FromException<DetalleEncuestaRealizadaDto>(DetalleException);
        public Task<DetalleEncuestaRealizadaDto> AnularEncuestaRealizadaAsync(string id, AnularEncuestaRequestDto request, string usuario, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<RespuestaIndicadoresExperienciaDto> ObtenerIndicadoresExperienciaAsync(FiltrosIndicadoresExperienciaDto filtros, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<List<SegmentoBarraDto>> ObtenerNivelSatisfaccionAsync(FiltrosIndicadoresExperienciaDto filtros, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<RespuestaAnalisisBrechasDto> ObtenerAnalisisBrechasAsync(FiltrosAnalisisBrechasDto filtros, CancellationToken cancellationToken = default) => Task.FromResult(BrechasRespuesta);
        public Task<RespuestaParametrosEncuestaDto> ObtenerReglasEncuestasAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<ReglaCondicionalEncuestaDto> CrearReglaEncuestaAsync(NuevaReglaEncuestaDto request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<ReglaCondicionalEncuestaDto> CambiarEstadoReglaEncuestaAsync(string id, CambiarEstadoReglaEncuestaDto request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<EstadoModoPruebaEncuestaDto> ObtenerModoPruebaEncuestaAsync(CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<EstadoModoPruebaEncuestaDto> ActualizarModoPruebaEncuestaAsync(EstadoModoPruebaEncuestaDto request, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }

    private static object? GetPropertyValue(object instance, string propertyName)
    {
        return instance.GetType().GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase)?.GetValue(instance);
    }
}
