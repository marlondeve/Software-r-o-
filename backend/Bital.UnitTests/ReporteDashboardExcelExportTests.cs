using Bital.Application.DTOs.DietasCocina;
using Bital.Infrastructure.DietasCocina;

namespace Bital.UnitTests;

public class ReporteDashboardExcelExportTests
{
    [Fact]
    public async Task GenerarAsync_ProduceArchivoExcelConContenido()
    {
        var filtros = new FiltrosReportesDto
        {
            Desde = new DateTime(2026, 8, 24),
            Hasta = new DateTime(2026, 8, 30),
            Servicio = "Cardiología",
            Horario = "almuerzo",
        };

        var kpis = new List<KpiDto>
        {
            new()
            {
                Clave = "bandejas-fcr",
                Etiqueta = "Bandejas FCR",
                Valor = 44,
                Formato = "numero",
                Comparacion = null,
            },
        };

        var graficos = new List<GraficoDto>
        {
            new()
            {
                Tipo = "tabla-contrato",
                Titulo = "Almuerzo",
                Categorias = ["Normal para la edad"],
                Series =
                [
                    new GraficoSerieDto { Etiqueta = "Suministradas", Valores = [44] },
                    new GraficoSerieDto { Etiqueta = "Contrato", Valores = [10_000] },
                    new GraficoSerieDto { Etiqueta = "ValorTotal", Valores = [440_000] },
                ],
            },
        };

        var bytes = await ReporteDashboardExcelExport.GenerarAsync(
            "Reportes clínicos",
            filtros,
            kpis,
            [],
            graficos,
            [],
            CancellationToken.None);

        Assert.NotNull(bytes);
        Assert.True(bytes.Length > 100);
        Assert.Equal(0x50, bytes[0]);
        Assert.Equal(0x4B, bytes[1]);
    }
}
