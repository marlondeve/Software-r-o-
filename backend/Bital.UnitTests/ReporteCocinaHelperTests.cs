using Bital.Application.DTOs.DietasCocina;
using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;

namespace Bital.UnitTests;

public class ReporteCocinaHelperTests
{
    [Fact]
    public void EsFilaReporteCocina_ExcluyePendienteSinTipo()
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Almuerzo,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.Pendiente,
        };

        Assert.False(ReporteCocinaHelper.EsFilaReporteCocina(fila));
    }

    [Fact]
    public void EsFilaReporteCocina_ExcluyeCanceladaSinConfirmar()
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Almuerzo,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.Cancelada,
            DescripcionDieta = "Corriente",
            Consistencia = "Normal",
            Observaciones = "Cancelada: [error-solicitud] Paciente no requiere dieta",
        };

        Assert.False(ReporteCocinaHelper.EsFilaReporteCocina(fila));
    }

    [Fact]
    public void EsFilaReporteCocina_IncluyeCanceladaTrasConfirmar()
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Almuerzo,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.Cancelada,
            DescripcionDieta = "Corriente",
            Consistencia = "Normal",
            OrdenCocinaId = Guid.NewGuid(),
            CancelacionTardia = true,
            Observaciones = "Paciente con salida clínica",
        };

        Assert.True(ReporteCocinaHelper.EsFilaReporteCocina(fila));
    }

    [Fact]
    public void EsFilaReporteCocina_IncluyeConfirmada()
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Almuerzo,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.Confirmada,
            DescripcionDieta = "Corriente",
            Consistencia = "Normal",
        };

        Assert.True(ReporteCocinaHelper.EsFilaReporteCocina(fila));
    }

    [Fact]
    public void EtiquetaEstadoVisible_SalidaSostenida_MuestraDespachadaYAlerta()
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Cena,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.EnRuta,
            DescripcionDieta = "Hiposódica",
            Consistencia = "Normal",
            SalidaClinicaSostenida = true,
        };

        Assert.Equal("Despachada", ReporteCocinaHelper.EtiquetaEstadoVisible(fila, null));
        Assert.Contains("Salida clínica: enviar (asume la clínica)", ReporteCocinaHelper.ConstruirAlertas(fila));
    }

    [Fact]
    public void EtiquetaEstadoVisible_CanceladaPorSalida_MuestraSalidaClinica()
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Cena,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.Cancelada,
            DescripcionDieta = "Hiposódica",
            Consistencia = "Normal",
            Observaciones = "Cancelación por salida clínica (IngInSlC='S').",
        };

        Assert.Equal("Salida clínica", ReporteCocinaHelper.EtiquetaEstadoVisible(fila, null));
    }

    [Fact]
    public void CoincideFiltros_RespetaPabellonYBusqueda()
    {
        var fila = new FilaDieta
        {
            Id = Guid.NewGuid(),
            PacienteId = "CC-123",
            Paciente = "MARIA DURANGO",
            Pabellon = "HOSPITALIZACION PISO 1",
            Habitacion = "102-1",
            Comida = TiempoComida.Cena,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.EnRuta,
            DescripcionDieta = "Hiposódica",
            Consistencia = "Normal",
        };

        var filtros = new FiltrosReporteCocinaDto
        {
            Fecha = DateTime.Today,
            Comida = "Cena",
            Pabellon = "HOSPITALIZACION PISO 1",
            Busqueda = "durango",
        };

        Assert.True(ReporteCocinaHelper.CoincideFiltros(fila, null, filtros));

        filtros.Pabellon = "OTRO";
        Assert.False(ReporteCocinaHelper.CoincideFiltros(fila, null, filtros));
    }

    [Fact]
    public void CoincideFiltros_BuscaPorCedulaYNumeroDeOrden()
    {
        var fila = new FilaDieta
        {
            Id = Guid.NewGuid(),
            PacienteId = "P-9",
            Cedula = "1098765432",
            Paciente = "MARIA DURANGO",
            Pabellon = "PISO 1",
            Habitacion = "102-1",
            Comida = TiempoComida.Cena,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.EnRuta,
            DescripcionDieta = "Hiposódica",
            Consistencia = "Normal",
        };

        var filtros = new FiltrosReporteCocinaDto { Fecha = DateTime.Today, Comida = "Cena" };

        filtros.Busqueda = "1098765";
        Assert.True(ReporteCocinaHelper.CoincideFiltros(fila, null, filtros));

        filtros.Busqueda = "4521";
        Assert.False(ReporteCocinaHelper.CoincideFiltros(fila, null, filtros));
        Assert.True(ReporteCocinaHelper.CoincideFiltros(fila, null, filtros, 4521));
    }

    [Theory]
    // Motivo catalogado: manda el motivo, sin importar si hubo entrega.
    [InlineData("Paciente no estaba en habitación", true, "Rechazada")]
    [InlineData("Se consumió", false, "Recogida")]
    // Motivo ausente o desconocido: decide si la bandeja llegó al paciente.
    [InlineData(null, false, "Rechazada")]
    [InlineData("", true, "Recogida")]
    [InlineData("Motivo no catalogado", false, "Rechazada")]
    public void EtiquetaEstadoVisible_ClasificaDevolucionComoLaVistaDelProveedor(
        string? motivo,
        bool huboEntrega,
        string esperado)
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Cena,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.Devuelta,
            DescripcionDieta = "Hiposódica",
            Consistencia = "Normal",
        };

        var etiqueta = new EtiquetaEnfermera
        {
            Codigo = "ET-1",
            EstadoLogistica = "devuelta",
            GeneradaPor = "test",
            MotivoDevolucion = motivo,
            EntregadaEn = huboEntrega ? DateTime.Today.AddHours(12) : null,
        };

        Assert.Equal(esperado, ReporteCocinaHelper.EtiquetaEstadoVisible(fila, etiqueta));
        Assert.Equal(esperado, ReporteCocinaHelper.EtiquetaSeguimiento(fila, etiqueta));
    }

    [Fact]
    public void CoincideFiltros_TodaDevolucionEntraEnRechazadaOEnRecogida()
    {
        var fila = new FilaDieta
        {
            PacienteId = "P1",
            Paciente = "Paciente",
            Pabellon = "P1",
            Habitacion = "101",
            Comida = TiempoComida.Cena,
            FechaOperativa = DateTime.Today,
            Estado = EstadoDieta.Devuelta,
            DescripcionDieta = "Hiposódica",
            Consistencia = "Normal",
        };

        var etiqueta = new EtiquetaEnfermera
        {
            Codigo = "ET-1",
            EstadoLogistica = "devuelta",
            GeneradaPor = "test",
            MotivoDevolucion = null,
            EntregadaEn = null,
        };

        var rechazadas = new FiltrosReporteCocinaDto
        {
            Fecha = DateTime.Today,
            Comida = "Cena",
            Seguimiento = "devuelta",
        };
        var recogidas = new FiltrosReporteCocinaDto
        {
            Fecha = DateTime.Today,
            Comida = "Cena",
            Seguimiento = "recogida",
        };

        Assert.True(ReporteCocinaHelper.CoincideFiltros(fila, etiqueta, rechazadas));
        Assert.False(ReporteCocinaHelper.CoincideFiltros(fila, etiqueta, recogidas));

        etiqueta.EntregadaEn = DateTime.Today.AddHours(12);
        Assert.False(ReporteCocinaHelper.CoincideFiltros(fila, etiqueta, rechazadas));
        Assert.True(ReporteCocinaHelper.CoincideFiltros(fila, etiqueta, recogidas));
    }
}
