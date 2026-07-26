using Bital.ApiNegocio.Controllers;
using Bital.Application.DTOs.Encuestas;
using Bital.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

namespace Bital.UnitTests;

public class EncuestasAdministracionControllerTests
{
    [Fact]
    public async Task ObtenerAuditoria_DevuelveDataYMeta()
    {
        var service = new FakeService
        {
            Auditoria = new ListaAuditoriaEncuestasDto
            {
                Data = new List<FilaAuditoriaEncuestaDto> { new() { Id = "1", IdEvento = "AUD-1", Fecha = "hoy", Relativo = "hace poco", UsuarioNombre = "usr", UsuarioRol = "rol", Modulo = "Encuestas", Accion = "Creación", Resultado = "exito", OrigenIp = "127.0.0.1", OrigenDispositivo = "web", IdRegistro = "1", IdSecundario = "", DetalleTipo = "texto" } },
                Meta = new Bital.Application.DTOs.DietasCocina.MetaPaginacionDto { Total = 1, Page = 1, PageSize = 20, TotalPages = 1 }
            }
        };

        var controller = new EncuestasAdministracionController(service, NullLogger<EncuestasAdministracionController>.Instance);
        var result = await controller.ObtenerAuditoria(null, null, null, null, null, 1, 20);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task ObtenerDashboardInicio_DevuelveData()
    {
        var service = new FakeService
        {
            Dashboard = new DashboardInicioEncuestasDto { Fecha = "hoy", Periodo = "mes", SincronizadoHaceMin = 5 }
        };

        var controller = new EncuestasAdministracionController(service, NullLogger<EncuestasAdministracionController>.Instance);
        var result = await controller.ObtenerDashboardInicio();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    private sealed class FakeService : IAdministracionEncuestasService
    {
        public ListaAuditoriaEncuestasDto Auditoria { get; set; } = new();
        public DashboardInicioEncuestasDto Dashboard { get; set; } = new();

        public Task<ListaAuditoriaEncuestasDto> ObtenerAuditoriaAsync(FiltrosAuditoriaEncuestasDto filtros) => Task.FromResult(Auditoria);
        public Task<DetalleAuditoriaEncuestaDto?> ObtenerDetalleAuditoriaAsync(Guid id) => Task.FromResult<DetalleAuditoriaEncuestaDto?>(null);
        public Task<ListaUsuariosEncuestasDto> ObtenerUsuariosAsync(FiltrosUsuariosEncuestasDto filtros) => Task.FromResult(new ListaUsuariosEncuestasDto());
        public Task<UsuarioEncuestasModuloDto> CrearUsuarioAsync(CrearUsuarioEncuestasDto dto) => Task.FromResult(new UsuarioEncuestasModuloDto());
        public Task<UsuarioEncuestasModuloDto> CambiarRolAsync(Guid id, CambiarRolEncuestasDto dto) => Task.FromResult(new UsuarioEncuestasModuloDto());
        public Task<DashboardInicioEncuestasDto> ObtenerDashboardInicioAsync() => Task.FromResult(Dashboard);
    }
}
