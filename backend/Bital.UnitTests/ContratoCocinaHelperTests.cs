using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;

namespace Bital.UnitTests;

public class ContratoCocinaHelperTests
{
    [Theory]
    [InlineData("Normal para la edad", "Normales y derivadas")]
    [InlineData("Hiposodica", "Normales y derivadas")]
    [InlineData("Hipograsa", "Normales y derivadas")]
    [InlineData("Hiperproteico", "Hiperproteico")]
    [InlineData("Líquido completa", "Líquido completa")]
    [InlineData("Líquidos claros", "Líquidos claros")]
    [InlineData("Hiperproteico licuado", "Hiperproteico licuado completa")]
    public void LineaContrato_AgrupaDerivadasComoPlanillaCocina(string catalogo, string esperado)
    {
        Assert.Equal(esperado, ContratoCocinaHelper.LineaContrato(catalogo));
    }

    [Fact]
    public void EsSuministrada_DesayunoCanceladoSinEtiqueta_NoCuenta()
    {
        var fila = Fila(TiempoComida.Desayuno, EstadoDieta.Cancelada, tardia: true);
        Assert.False(ContratoCocinaHelper.EsSuministrada(fila, "Cancelada", tieneEtiqueta: false));
    }

    [Fact]
    public void EsSuministrada_CenaCanceladaSinEtiqueta_SiCuenta()
    {
        var fila = Fila(TiempoComida.Cena, EstadoDieta.Cancelada, tardia: true);
        Assert.True(ContratoCocinaHelper.EsSuministrada(fila, "Cancelada", tieneEtiqueta: false));
    }

    [Fact]
    public void EsSuministrada_AlmuerzoCompletado_Cuenta()
    {
        var fila = Fila(TiempoComida.Almuerzo, EstadoDieta.ListaEnvio);
        Assert.True(ContratoCocinaHelper.EsSuministrada(fila, "Completada", tieneEtiqueta: true));
    }

    [Fact]
    public void EsSuministrada_MeriendaSinEtiqueta_NoCuenta()
    {
        var fila = Fila(TiempoComida.Onces, EstadoDieta.Confirmada);
        fila.SalidaClinicaSostenida = true;
        Assert.False(ContratoCocinaHelper.EsSuministrada(fila, "Pendiente", tieneEtiqueta: false));
    }

    [Fact]
    public void EsOrdenHuerfanaSuministrada_DesayunoCancelado_NoCuenta()
    {
        var orden = new OrdenCocina
        {
            Comida = TiempoComida.Desayuno,
            Estado = "Cancelada",
            FechaOperativa = new DateTime(2026, 8, 26),
        };
        Assert.False(ContratoCocinaHelper.EsOrdenHuerfanaSuministrada(orden));
    }

    [Fact]
    public void PlantillaFcr_IncluyeLasLineasDelContratoPorComida()
    {
        Assert.Contains(
            ContratoCocinaHelper.PlantillaFcr,
            d => d.Comida == TiempoComida.Desayuno && d.Linea == "Líquido completa");
        Assert.Contains(
            ContratoCocinaHelper.PlantillaFcr,
            d => d.Comida == TiempoComida.Almuerzo && d.Linea == "Renal");
        Assert.Contains(
            ContratoCocinaHelper.PlantillaFcr,
            d => d.Comida == TiempoComida.Cena && d.Etiqueta == "Cenas normales y derivadas");
        Assert.Contains(
            ContratoCocinaHelper.PlantillaFcr,
            d => d.Comida == TiempoComida.Onces && d.Linea == "Merienda tarde");
    }

    [Fact]
    public void EsOrdenHuerfanaSuministrada_CenaCancelada_Cuenta()
    {
        var orden = new OrdenCocina
        {
            Comida = TiempoComida.Cena,
            Estado = "Cancelada",
            FechaOperativa = new DateTime(2026, 8, 26),
        };
        Assert.True(ContratoCocinaHelper.EsOrdenHuerfanaSuministrada(orden));
    }

    private static FilaDieta Fila(TiempoComida comida, EstadoDieta estado, bool tardia = false) =>
        new()
        {
            Comida = comida,
            Estado = estado,
            CancelacionTardia = tardia,
            Paciente = "Test",
            Servicio = "Hospitalización",
            Pabellon = "P1",
            Habitacion = "101",
            FechaOperativa = new DateTime(2026, 8, 25),
        };
}
