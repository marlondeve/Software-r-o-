using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.Services;
using Bital.Domain.Entities.Encuestas;
using Bital.Domain.Enums;
using Bital.Shared.Contracts.Responses;
using Bital.Shared.Contracts.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace Bital.UnitTests;

public class EncuestasProxyServiceTests
{
    [Fact]
    public async Task ObtenerEncuestasRealizadasAsync_FiltraYDevuelveResultadosPersistidos()
    {
        using var context = CreateContext();
        SeedEncuestas(context);
        var service = CreateService(context);

        var resultado = await service.ObtenerEncuestasRealizadasAsync(new FiltrosEncuestasRealizadasDto
        {
            Servicio = "Hospitalización",
            Canal = CanalEncuesta.Presencial.ToString(),
            Estado = EstadoEncuesta.Completada.ToString(),
            Page = 1,
            PageSize = 10
        });

        Assert.Single(resultado.Data);
        Assert.Equal("ENC-001", resultado.Data[0].Consecutivo);
        Assert.Equal(1, resultado.Meta.Total);
        Assert.Equal(1, resultado.Meta.TotalPages);
    }

    [Fact]
    public async Task ObtenerEncuestaRealizadaAsync_DevuelveDetallePersistido()
    {
        using var context = CreateContext();
        var capturaId = SeedEncuestas(context).First().Id;
        var service = CreateService(context);

        var resultado = await service.ObtenerEncuestaRealizadaAsync(capturaId.ToString());

        Assert.Equal(capturaId.ToString(), resultado.Id);
        Assert.Equal(5, resultado.Sat);
        Assert.True(resultado.RequiereSeguimiento);
        Assert.Single(resultado.Respuestas);
    }

    [Fact]
    public async Task AnularEncuestaRealizadaAsync_ActualizaEstadoYMotivo()
    {
        using var context = CreateContext();
        var capturaId = SeedEncuestas(context).First().Id;
        var service = CreateService(context);

        var resultado = await service.AnularEncuestaRealizadaAsync(capturaId.ToString(), new AnularEncuestaRequestDto
        {
            Confirmada = true,
            Motivo = "Error de captura"
        }, "tester");

        Assert.Equal(EstadoEncuesta.Rechazada.ToString(), resultado.Estado);
        Assert.Equal("Error de captura", resultado.MotivoAnulacion);
    }

    [Fact]
    public async Task ObtenerIndicadoresExperienciaAsync_ConstruyeKpisDesdeCapturas()
    {
        using var context = CreateContext();
        SeedEncuestas(context);
        var service = CreateService(context);

        var resultado = await service.ObtenerIndicadoresExperienciaAsync(new FiltrosIndicadoresExperienciaDto
        {
            Servicio = "Hospitalización",
            Canal = CanalEncuesta.Presencial.ToString()
        });

        Assert.NotEmpty(resultado.Kpis);
        Assert.NotEmpty(resultado.Segmentos);
        Assert.Equal("Satisfacción Global", resultado.Kpis[0].Label);
    }

    [Fact]
    public async Task ObtenerAnalisisBrechasAsync_DevuelveBrechasDesdeSeguimiento()
    {
        using var context = CreateContext();
        SeedEncuestas(context);
        var service = CreateService(context);

        var resultado = await service.ObtenerAnalisisBrechasAsync(new FiltrosAnalisisBrechasDto
        {
            Servicio = "Hospitalización",
            Page = 1,
            PageSize = 10
        });

        Assert.Equal(2, resultado.Data.Count);
        Assert.Equal(2, resultado.Kpis.TotalBrechas);
        Assert.Equal("en_gestion", resultado.Data[0].Estado);
    }

    private static EncuestasProxyService CreateService(BitalNegocioDbContext context)
    {
        return new EncuestasProxyService(
            new FakePacientesQueryService(),
            new FakeAtencionesQueryService(),
            new FakeCuestionariosService(),
            context,
            NullLogger<EncuestasProxyService>.Instance);
    }

    private static BitalNegocioDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BitalNegocioDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new BitalNegocioDbContext(options);
    }

    private static List<CapturaEncuesta> SeedEncuestas(BitalNegocioDbContext context)
    {
        var encuestaCompletada = new CapturaEncuesta
        {
            Id = Guid.NewGuid(),
            Consecutivo = "ENC-001",
            CuestionarioEncuestaId = Guid.NewGuid(),
            NumeroDocumento = "1003195163",
            TipoDocumento = "CC",
            NombreCompleto = "Juan Dev",
            Servicio = "Hospitalización",
            Canal = CanalEncuesta.Presencial,
            Estado = EstadoEncuesta.Completada,
            FechaInicio = new DateTime(2026, 7, 26, 8, 0, 0, DateTimeKind.Utc),
            FechaFinalizacion = new DateTime(2026, 7, 26, 8, 15, 0, DateTimeKind.Utc),
            Sat = 5,
            Nps = 10,
            RequiereSeguimiento = true,
            Respuestas = new List<RespuestaCapturaEncuesta>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    CapturaEncuestaId = Guid.Empty,
                    PreguntaCuestionarioId = Guid.NewGuid(),
                    ValorTexto = "Muy buena"
                }
            }
        };

        encuestaCompletada.Respuestas.First().CapturaEncuestaId = encuestaCompletada.Id;

        var encuestaNormal = new CapturaEncuesta
        {
            Id = Guid.NewGuid(),
            Consecutivo = "ENC-002",
            CuestionarioEncuestaId = Guid.NewGuid(),
            NumeroDocumento = "2000000000",
            TipoDocumento = "CC",
            NombreCompleto = "Maria Perez",
            Servicio = "Urgencias",
            Canal = CanalEncuesta.Telefonico,
            Estado = EstadoEncuesta.Completada,
            FechaInicio = new DateTime(2026, 7, 25, 9, 0, 0, DateTimeKind.Utc),
            FechaFinalizacion = new DateTime(2026, 7, 25, 9, 10, 0, DateTimeKind.Utc),
            Sat = 3,
            Nps = 7,
            RequiereSeguimiento = false
        };

        context.CapturasEncuesta.AddRange(encuestaCompletada, encuestaNormal);
        context.SaveChanges();
        return new List<CapturaEncuesta> { encuestaCompletada, encuestaNormal };
    }

    private sealed class FakePacientesQueryService : IPacientesQueryService
    {
        public Task<PacienteResponse?> GetPacientePorDocumentoAsync(string numeroDocumento, string tipoDocumento, CancellationToken cancellationToken = default) => Task.FromResult<PacienteResponse?>(null);
        public Task<PacienteResponse?> GetPacientePorIdAsync(string pacienteId, CancellationToken cancellationToken = default) => Task.FromResult<PacienteResponse?>(null);
        public Task<IEnumerable<PacienteResponse>> BuscarPacientesPorNombreAsync(string searchTerm, int maxResults = 20, CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<PacienteResponse>>(Array.Empty<PacienteResponse>());
        public Task<IEnumerable<PacienteHospitalizadoResponse>> ObtenerPacientesHospitalizadosAsync(DateTime fecha, CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<PacienteHospitalizadoResponse>>(Array.Empty<PacienteHospitalizadoResponse>());
    }

    private sealed class FakeAtencionesQueryService : IAtencionesQueryService
    {
        public Task<IEnumerable<AtencionResponse>> GetAtencionesActivasAsync(CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<AtencionResponse>>(Array.Empty<AtencionResponse>());
        public Task<IEnumerable<AtencionResponse>> GetAtencionesPorServicioAsync(string servicioId, CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<AtencionResponse>>(Array.Empty<AtencionResponse>());
        public Task<AtencionResponse?> GetAtencionPorIdAsync(int consecutivo, CancellationToken cancellationToken = default) => Task.FromResult<AtencionResponse?>(null);
        public Task<IEnumerable<AtencionResponse>> GetAtencionesPorPacienteAsync(string numeroDocumento, string tipoDocumento, CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<AtencionResponse>>(Array.Empty<AtencionResponse>());
        public Task<IEnumerable<AtencionHospitalariaResponse>> GetAtencionesHospitalariasAsync(CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<AtencionHospitalariaResponse>>(Array.Empty<AtencionHospitalariaResponse>());
        public Task<SalidaClinicaHisLookup> ObtenerPacientesConSalidaClinicaAsync(IEnumerable<IdentidadIngresoHis> pacientes, CancellationToken cancellationToken = default) => Task.FromResult(new SalidaClinicaHisLookup());
        public Task<IEnumerable<EncuestaCapturaPresencialResponse>> GetCapturaPresencialAsync(string? servicio = null, string? pabellon = null, string? estado = null, string? busqueda = null, CancellationToken cancellationToken = default) => Task.FromResult<IEnumerable<EncuestaCapturaPresencialResponse>>(Array.Empty<EncuestaCapturaPresencialResponse>());
    }

    private sealed class FakeCuestionariosService : ICuestionariosService
    {
        public Task<ListaCuestionariosDto> ObtenerCuestionariosAsync(FiltrosCuestionariosDto filtros, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<CuestionarioDetalleDto> ObtenerCuestionarioAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<CuestionarioDetalleDto> CrearCuestionarioAsync(CuestionarioCreacionDto dto, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<CuestionarioDetalleDto> ActualizarCuestionarioAsync(Guid id, CuestionarioActualizacionDto dto, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<CuestionarioDetalleDto> CambiarEstadoAsync(Guid id, CuestionarioEstadoDto dto, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<CuestionarioDetalleDto> DuplicarCuestionarioAsync(Guid id, CuestionarioDuplicadoDto? dto = null, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task EliminarCuestionarioAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<EstructuraCuestionarioDto> ObtenerEstructuraAsync(Guid id, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<EstructuraCuestionarioDto> GuardarEstructuraAsync(Guid id, EstructuraCuestionarioDto dto, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PreguntaCuestionarioDto> AgregarPreguntaAsync(Guid id, PreguntaCuestionarioCreacionDto dto, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PreguntaCuestionarioDto> EditarPreguntaAsync(Guid id, Guid preguntaId, PreguntaCuestionarioActualizacionDto dto, CancellationToken cancellationToken = default) => throw new NotImplementedException();
        public Task<PreguntaCuestionarioDto> ActualizarLogicaAsync(Guid id, Guid preguntaId, LogicaPreguntaCuestionarioDto dto, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    }
}
