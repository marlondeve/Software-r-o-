using Bital.Application.DTOs.DietasCocina;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Bital.UnitTests;

/// <summary>
/// Verifica KPIs de producción: dietas producidas = etiquetas + sin etiqueta.
/// </summary>
public class DashboardServiceReportesTests
{
    private static readonly DateTime Fecha = new(2026, 8, 25);
    private static readonly Guid TipoDietaId = Guid.NewGuid();
    private static readonly Guid OrdenId = Guid.NewGuid();
    private const decimal TarifaMonto = 10_000m;

    private static BitalNegocioDbContext NuevoContexto() =>
        new(new DbContextOptionsBuilder<BitalNegocioDbContext>()
            .UseInMemoryDatabase($"dashboard-reportes-{Guid.NewGuid()}")
            .Options);

    private static async Task<BitalNegocioDbContext> ContextoConEscenarioAsync()
    {
        var contexto = NuevoContexto();

        var catalogo = new DietaCatalogo
        {
            Id = TipoDietaId,
            Codigo = "NORMAL",
            Nombre = "Normal para la edad",
            Descripcion = "Dieta estándar",
            FechaInicio = Fecha.AddYears(-1),
            Usuario = "test",
            Activa = true,
        };

        var tarifa = new TarifaHistorico
        {
            Id = Guid.NewGuid(),
            DietaCatalogoId = TipoDietaId,
            Anio = Fecha.Year,
            TiempoComida = TiempoComida.Almuerzo,
            Monto = TarifaMonto,
            VigenciaDesde = Fecha.AddYears(-1),
            VigenciaHasta = Fecha.AddYears(1),
            Activa = true,
            CreadoPor = "test",
        };

        var orden = new OrdenCocina
        {
            Id = OrdenId,
            NumeroOrden = 1,
            Estado = "Completada",
            Comida = TiempoComida.Almuerzo,
            FechaOperativa = Fecha,
            GeneradoPor = "test",
            CreadoPor = "test",
        };

        var conEtiqueta = Enumerable.Range(1, 3)
            .Select(i => CrearFila($"PAC-ETQ-{i}", EstadoDieta.ListaEnvio, ordenCocinaId: OrdenId))
            .ToList();

        var sinEtiqueta = Enumerable.Range(1, 2)
            .Select(i => CrearFila($"PAC-SIN-{i}", EstadoDieta.EnPreparacion, ordenCocinaId: OrdenId))
            .ToList();

        var canceladaTardia = CrearFila(
            "PAC-TARDIA",
            EstadoDieta.Cancelada,
            ordenCocinaId: OrdenId,
            cancelacionTardia: true);

        var etiquetas = conEtiqueta.Select((fila, index) => new EtiquetaEnfermera
        {
            Id = Guid.NewGuid(),
            Codigo = $"ETQ-{index + 1}",
            OrdenCocinaId = OrdenId,
            FilaDietaId = fila.Id,
            EstadoLogistica = "impresa",
            Comida = TiempoComida.Almuerzo,
            FechaOperativa = Fecha,
            GeneradaPor = "test",
            GeneradaEn = Fecha,
            ImpresaEn = Fecha,
        }).ToList();

        contexto.DietasCatalogo.Add(catalogo);
        tarifa.DietaCatalogo = catalogo;
        contexto.TarifasHistorico.Add(tarifa);
        contexto.OrdenesCocina.Add(orden);
        contexto.FilasDietas.AddRange(conEtiqueta);
        contexto.FilasDietas.AddRange(sinEtiqueta);
        contexto.FilasDietas.Add(canceladaTardia);
        contexto.EtiquetasEnfermeria.AddRange(etiquetas);
        await contexto.SaveChangesAsync();

        return contexto;
    }

    private static FilaDieta CrearFila(
        string paciente,
        EstadoDieta estado,
        Guid? ordenCocinaId = null,
        bool cancelacionTardia = false,
        bool salidaClinicaSostenida = false)
    {
        var sufijo = paciente.GetHashCode(StringComparison.Ordinal) & 0xFFFF;
        return new FilaDieta
        {
            Id = Guid.NewGuid(),
            PacienteId = paciente,
            Paciente = paciente,
            Cedula = $"10{sufijo:D8}",
            Edad = 45,
            Servicio = "Hospitalización",
            Pabellon = "Piso 2",
            Habitacion = "201",
            Comida = TiempoComida.Almuerzo,
            TipoDietaId = TipoDietaId,
            Aislado = false,
            Aislamiento = string.Empty,
            Alergico = false,
            Alergias = string.Empty,
            Estado = estado,
            FechaOperativa = Fecha,
            OrdenCocinaId = ordenCocinaId,
            CancelacionTardia = cancelacionTardia,
            SalidaClinicaSostenida = salidaClinicaSostenida,
            CreadoPor = "test",
        };
    }

    private static decimal ValorKpi(IReadOnlyList<KpiDto> kpis, string clave) =>
        kpis.First(k => k.Clave == clave).Valor;

    [Fact]
    public async Task ReporteProveedor_DietasProducidas_SumaEtiquetasYSinEtiqueta()
    {
        await using var contexto = await ContextoConEscenarioAsync();
        var servicio = new DashboardService(contexto);

        var reporte = await servicio.ObtenerReporteProveedorAsync(new FiltrosReportesDto
        {
            Desde = Fecha,
            Hasta = Fecha,
            Horario = "todos",
        });

        Assert.Equal(3, ValorKpi(reporte.Kpis, "etiquetas_periodo"));
        Assert.Equal(3, ValorKpi(reporte.Kpis, "dietas_sin_etiqueta"));
        Assert.Equal(6, ValorKpi(reporte.Kpis, "dietas_producidas_periodo"));
        Assert.Equal(50_000m, ValorKpi(reporte.Kpis, "costo_produccion"));
        Assert.Equal(10_000m, ValorKpi(reporte.Kpis, "costo_retrasos"));
        Assert.Equal(60_000m, ValorKpi(reporte.Kpis, "costo_total_facturado"));
        Assert.Equal(60_000m, ValorKpi(reporte.Kpis, "costo_total_facturado"));

        Assert.Contains(
            reporte.Hallazgos,
            h => h.Tipo == "dietas_sin_etiqueta" && h.Cantidad == 3);

        var graficoTipos = reporte.Graficos.First(g =>
            g.Titulo.Contains("Tipos de dieta en cocina", StringComparison.OrdinalIgnoreCase));
        Assert.Contains("total: 6", graficoTipos.Titulo, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(
            reporte.Graficos,
            g => g.Titulo.StartsWith("Contrato:", StringComparison.OrdinalIgnoreCase));

        var planillaAlmuerzo = reporte.Graficos.First(g =>
            g.Tipo == "tabla-contrato"
            && g.Titulo.Contains("Almuerzo", StringComparison.OrdinalIgnoreCase));
        Assert.Equal(6, planillaAlmuerzo.Series[0].Valores.Sum());
        Assert.Equal(60_000m, planillaAlmuerzo.Series[2].Valores.Sum());
    }

    [Fact]
    public async Task ReporteNutricionista_UsaEtiquetaPacientesEnCenso_YMismasProducidas()
    {
        await using var contexto = await ContextoConEscenarioAsync();
        var servicio = new DashboardService(contexto);

        var reporte = await servicio.ObtenerReporteNutricionistaAsync(new FiltrosReportesDto
        {
            Desde = Fecha,
            Hasta = Fecha,
            Horario = "todos",
        });

        var censo = reporte.Kpis.First(k => k.Clave == "total_dietas_periodo");
        Assert.Equal("Pacientes en censo", censo.Etiqueta);
        Assert.Equal(6, censo.Valor);
        Assert.Equal(6, ValorKpi(reporte.Kpis, "dietas_producidas_periodo"));
        Assert.Equal(60_000m, ValorKpi(reporte.Kpis, "costo_total_facturado"));

        Assert.Contains(
            reporte.Hallazgos,
            h => h.Tipo == "dietas_sin_etiqueta" && h.Cantidad == 3);
    }
}
