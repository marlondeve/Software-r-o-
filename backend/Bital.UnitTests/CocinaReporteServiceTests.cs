using Bital.Application.DTOs.DietasCocina;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Bital.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using MiniExcelLibs;

namespace Bital.UnitTests;

/// <summary>
/// Verifica que el reporte del proveedor se genere como .xlsx válido y que las
/// bajas por salida clínica no se cuenten como cancelaciones manuales.
/// </summary>
public class CocinaReporteServiceTests
{
    private static readonly DateTime Fecha = new(2026, 3, 10);

    private static BitalNegocioDbContext NuevoContexto() =>
        new(new DbContextOptionsBuilder<BitalNegocioDbContext>()
            .UseInMemoryDatabase($"reporte-cocina-{Guid.NewGuid()}")
            .Options);

    private static FilaDieta Fila(
        string paciente,
        EstadoDieta estado,
        string? observaciones = null,
        string consistencia = "Normal",
        bool aislado = false,
        bool alergico = false,
        Guid? ordenCocinaId = null,
        bool cancelacionTardia = false)
        => new()
        {
            Id = Guid.NewGuid(),
            PacienteId = paciente,
            Paciente = paciente,
            Cedula = "100" + paciente.Length,
            Edad = 40,
            Servicio = "Hospitalización",
            Pabellon = "Piso 3",
            Habitacion = "301",
            Comida = TiempoComida.Almuerzo,
            Consistencia = consistencia,
            DescripcionDieta = "Dieta corriente",
            Aislado = aislado,
            ObservacionAislamiento = aislado ? "Contacto" : null,
            Alergico = alergico,
            Alergias = alergico ? "Lactosa" : string.Empty,
            Observaciones = observaciones,
            Estado = estado,
            FechaOperativa = Fecha,
            OrdenCocinaId = ordenCocinaId,
            CancelacionTardia = cancelacionTardia,
        };

    private static FiltrosReporteCocinaDto Filtros() => new()
    {
        Fecha = Fecha,
        Comida = nameof(TiempoComida.Almuerzo),
    };

    private static async Task<byte[]> GenerarAsync(
        IEnumerable<FilaDieta> filas,
        FiltrosReporteCocinaDto? filtros = null)
    {
        await using var contexto = NuevoContexto();
        contexto.FilasDietas.AddRange(filas);
        await contexto.SaveChangesAsync();

        var servicio = new CocinaReporteService(contexto);
        return await servicio.GenerarReporteExcelAsync(filtros ?? Filtros());
    }

    private static List<Dictionary<string, object?>> LeerHoja(byte[] bytes, string hoja)
    {
        using var stream = new MemoryStream(bytes);
        return stream.Query(useHeaderRow: true, sheetName: hoja)
            .Cast<IDictionary<string, object?>>()
            .Select(fila => new Dictionary<string, object?>(fila))
            .ToList();
    }

    private static string ValorResumen(byte[] bytes, string indicador)
    {
        var resumen = LeerHoja(bytes, "Resumen");
        var fila = resumen.Single(f => (f["Indicador"]?.ToString() ?? "") == indicador);
        return fila["Valor"]?.ToString() ?? string.Empty;
    }

    [Fact]
    public async Task GenerarReporteExcel_ProduceLasTresHojas()
    {
        var bytes = await GenerarAsync([Fila("Ana", EstadoDieta.Confirmada)]);

        using var stream = new MemoryStream(bytes);
        var hojas = stream.GetSheetNames();

        Assert.Equal(["Resumen", "Producción", "Bandejas"], hojas);
    }

    [Fact]
    public async Task GenerarReporteExcel_ExcluyeCanceladaSinConfirmar()
    {
        var bytes = await GenerarAsync(
        [
            Fila("Ana", EstadoDieta.Confirmada),
            Fila("Beto", EstadoDieta.Cancelada, "Cancelada en borrador"),
        ]);

        var pacientes = LeerHoja(bytes, "Bandejas")
            .Select(f => f["Paciente"]?.ToString())
            .ToList();

        Assert.Equal(["Ana"], pacientes);
        Assert.Equal("1", ValorResumen(bytes, "Total bandejas activas"));
    }

    [Fact]
    public async Task GenerarReporteExcel_SeparaSalidaClinicaDeCancelacionManual()
    {
        var bytes = await GenerarAsync(
        [
            Fila("Ana", EstadoDieta.Confirmada),
            Fila("Beto", EstadoDieta.Cancelada, "Paciente con salida clínica",
                ordenCocinaId: Guid.NewGuid(), cancelacionTardia: true),
            Fila("Carla", EstadoDieta.Cancelada, "Cancelada por indicación médica",
                ordenCocinaId: Guid.NewGuid(), cancelacionTardia: true),
        ]);

        Assert.Equal("1", ValorResumen(bytes, "Salidas clínicas"));
        Assert.Equal("1", ValorResumen(bytes, "Canceladas"));
        Assert.Equal("1", ValorResumen(bytes, "Total bandejas activas"));

        var estados = LeerHoja(bytes, "Bandejas")
            .Select(f => f["Estado"]?.ToString())
            .ToList();

        Assert.Contains("Salida clínica", estados);
        Assert.Contains("Cancelada", estados);
        // Las bajas se listan al final para no confundir la producción del turno.
        Assert.Equal("En gestión", estados[0]);
    }

    [Fact]
    public async Task GenerarReporteExcel_SinResultados_ConservaEncabezados()
    {
        var filtros = Filtros();
        filtros.Busqueda = "paciente-que-no-existe";

        var bytes = await GenerarAsync([Fila("Ana", EstadoDieta.Confirmada)], filtros);

        var bandejas = LeerHoja(bytes, "Bandejas");
        Assert.Single(bandejas);
        Assert.Contains("Estado", bandejas[0].Keys);
        Assert.Contains("Consistencia", bandejas[0].Keys);
        Assert.Equal("0", ValorResumen(bytes, "Total bandejas activas"));
    }

    [Fact]
    public async Task GenerarReporteExcel_ProduccionAgrupaPorTipoYConsistencia()
    {
        var bytes = await GenerarAsync(
        [
            Fila("Ana", EstadoDieta.Confirmada, aislado: true),
            Fila("Beto", EstadoDieta.Confirmada),
            Fila("Carla", EstadoDieta.Confirmada, consistencia: "Líquido", alergico: true),
            Fila("Dora", EstadoDieta.Cancelada, "Paciente con salida clínica",
                ordenCocinaId: Guid.NewGuid(), cancelacionTardia: true),
        ]);

        var produccion = LeerHoja(bytes, "Producción");
        var total = produccion.Single(f => f["Tipo dieta"]?.ToString() == "TOTAL");

        // La cancelada por salida clínica no entra en producción.
        Assert.Equal(3, Convert.ToInt32(total["Bandejas"]));
        Assert.Equal(1, Convert.ToInt32(total["Con aislamiento"]));
        Assert.Equal(1, Convert.ToInt32(total["Con alergias"]));

        var liquido = produccion.Single(f => f["Consistencia"]?.ToString() == "Líquido");
        Assert.Equal(1, Convert.ToInt32(liquido["Bandejas"]));
    }

    [Fact]
    public async Task GenerarReporteExcel_FiltroConsistencia_UsaElValorGuardado()
    {
        var filtros = Filtros();
        filtros.Consistencia = "Líquido";

        var bytes = await GenerarAsync(
        [
            Fila("Ana", EstadoDieta.Confirmada),
            Fila("Beto", EstadoDieta.Confirmada, consistencia: "Líquido"),
        ], filtros);

        var pacientes = LeerHoja(bytes, "Bandejas")
            .Select(f => f["Paciente"]?.ToString())
            .ToList();

        Assert.Equal(["Beto"], pacientes);
    }

    [Fact]
    public async Task GenerarReporteExcel_FiltroEstadoSalidaClinica_ExcluyeCancelacionManual()
    {
        var filtros = Filtros();
        filtros.EstadoCocina = "salida_clinica";

        var bytes = await GenerarAsync(
        [
            Fila("Ana", EstadoDieta.Cancelada, "Paciente con salida clínica",
                ordenCocinaId: Guid.NewGuid(), cancelacionTardia: true),
            Fila("Beto", EstadoDieta.Cancelada, "Cancelada por indicación médica",
                ordenCocinaId: Guid.NewGuid(), cancelacionTardia: true),
        ], filtros);

        var pacientes = LeerHoja(bytes, "Bandejas")
            .Select(f => f["Paciente"]?.ToString())
            .ToList();

        Assert.Equal(["Ana"], pacientes);
    }

    [Fact]
    public async Task GenerarReporteExcel_ComidaInvalida_Falla()
    {
        var filtros = Filtros();
        filtros.Comida = "brunch";

        await Assert.ThrowsAsync<ArgumentException>(() => GenerarAsync([], filtros));
    }
}
