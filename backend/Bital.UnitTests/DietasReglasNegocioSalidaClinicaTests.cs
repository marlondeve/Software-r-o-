using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;

namespace Bital.UnitTests;

/// <summary>
/// Salida clínica (IngInSlC=S) vs límite de novedades:
/// - Dentro del límite: cancelar incluso dietas solicitadas (evitar preparación/desperdicio).
/// - Fuera del límite: sostener dietas solicitadas para que el proveedor las envíe.
/// </summary>
public class DietasReglasNegocioSalidaClinicaTests
{
    [Theory]
    [InlineData(EstadoDieta.Guardado)]
    [InlineData(EstadoDieta.Solicitada)]
    [InlineData(EstadoDieta.Confirmada)]
    [InlineData(EstadoDieta.EnPreparacion)]
    [InlineData(EstadoDieta.ListaEnvio)]
    public void DentroDelLimite_CancelaDietaSolicitada(EstadoDieta estado)
    {
        Assert.True(DietasReglasNegocio.DebeCancelarPorEgreso(estado, ventanaNovedadesAbierta: true));
        Assert.False(DietasReglasNegocio.DebeSostenerPorEgreso(estado, ventanaNovedadesAbierta: true));
    }

    [Fact]
    public void DentroDelLimite_CancelaPendiente()
    {
        Assert.True(
            DietasReglasNegocio.DebeCancelarPorEgreso(
                EstadoDieta.Pendiente,
                ventanaNovedadesAbierta: true));
    }

    [Theory]
    [InlineData(EstadoDieta.Guardado)]
    [InlineData(EstadoDieta.Solicitada)]
    [InlineData(EstadoDieta.Confirmada)]
    [InlineData(EstadoDieta.EnPreparacion)]
    [InlineData(EstadoDieta.ListaEnvio)]
    public void FueraDelLimite_SostieneDietaSolicitada(EstadoDieta estado)
    {
        Assert.False(DietasReglasNegocio.DebeCancelarPorEgreso(estado, ventanaNovedadesAbierta: false));
        Assert.True(DietasReglasNegocio.DebeSostenerPorEgreso(estado, ventanaNovedadesAbierta: false));
    }

    [Fact]
    public void FueraDelLimite_CancelaSoloPendiente()
    {
        Assert.True(
            DietasReglasNegocio.DebeCancelarPorEgreso(
                EstadoDieta.Pendiente,
                ventanaNovedadesAbierta: false));
        Assert.False(
            DietasReglasNegocio.DebeSostenerPorEgreso(
                EstadoDieta.Pendiente,
                ventanaNovedadesAbierta: false));
    }

    [Fact]
    public void EnRuta_NoCancelaNiSostienePorEgreso()
    {
        Assert.False(
            DietasReglasNegocio.DebeCancelarPorEgreso(
                EstadoDieta.EnRuta,
                ventanaNovedadesAbierta: true));
        Assert.False(
            DietasReglasNegocio.DebeSostenerPorEgreso(
                EstadoDieta.EnRuta,
                ventanaNovedadesAbierta: false));
    }

    [Theory]
    [InlineData(EstadoDieta.Confirmada)]
    [InlineData(EstadoDieta.EnPreparacion)]
    [InlineData(EstadoDieta.ListaEnvio)]
    public void Reingreso_DentroDelLimite_RetomaConfirmada(EstadoDieta estadoAlCancelar)
    {
        Assert.Equal(
            EstadoDieta.Confirmada,
            DietasReglasNegocio.EstadoTrasReingresoTrasSalidaClinica(
                estadoAlCancelar,
                ventanaNovedadesAbierta: true));
    }

    [Theory]
    [InlineData(EstadoDieta.Confirmada)]
    [InlineData(EstadoDieta.EnPreparacion)]
    [InlineData(EstadoDieta.ListaEnvio)]
    [InlineData(EstadoDieta.Solicitada)]
    public void Reingreso_FueraDelLimite_QuedaPendiente(EstadoDieta estadoAlCancelar)
    {
        Assert.Equal(
            EstadoDieta.Pendiente,
            DietasReglasNegocio.EstadoTrasReingresoTrasSalidaClinica(
                estadoAlCancelar,
                ventanaNovedadesAbierta: false));
    }

    [Fact]
    public void Egreso_FueraDelLimite_DebióSostenerse_Confirmada()
    {
        var config = new TiempoComidaConfig
        {
            Comida = TiempoComida.MediaNoche,
            Activo = true,
            HoraPreparacion = new TimeSpan(12, 0, 0),
            HoraCierre = new TimeSpan(15, 0, 0),
            HoraEntrega = new TimeSpan(17, 30, 0),
        };
        var fecha = new DateTime(2026, 8, 26);
        var momentoEgreso = new DateTime(2026, 8, 26, 17, 10, 0);

        Assert.True(
            DietasReglasNegocio.EgresoDebióSostenerse(
                EstadoDieta.Confirmada,
                config,
                fecha,
                momentoEgreso));
    }

    [Fact]
    public void Egreso_DentroDelLimite_NoDebióSostenerse_Confirmada()
    {
        var config = new TiempoComidaConfig
        {
            Comida = TiempoComida.MediaNoche,
            Activo = true,
            HoraPreparacion = new TimeSpan(12, 0, 0),
            HoraCierre = new TimeSpan(15, 0, 0),
            HoraEntrega = new TimeSpan(17, 30, 0),
        };
        var fecha = new DateTime(2026, 8, 26);
        var momentoEgreso = new DateTime(2026, 8, 26, 14, 0, 0);

        Assert.False(
            DietasReglasNegocio.EgresoDebióSostenerse(
                EstadoDieta.Confirmada,
                config,
                fecha,
                momentoEgreso));
    }

    [Fact]
    public void ObservacionSostenida_NoSeClasificaComoCancelacionSalidaClinica()
    {
        var texto =
            "Paciente con salida clínica\nSalida clínica fuera del límite de novedades: la dieta se mantiene y el proveedor la envía";

        Assert.True(DietasReglasNegocio.EsObservacionSalidaClinicaSostenida(texto));
        Assert.False(DietasReglasNegocio.EsObservacionSalidaClinica(texto));
    }

    [Fact]
    public void ReingresoFueraVentana_NoCorrigeDietaSostenida()
    {
        var fila = new FilaDieta
        {
            Estado = EstadoDieta.Confirmada,
            SalidaClinicaSostenida = true,
            Observaciones = DietasReglasNegocio.MotivoSalidaClinicaSostenida,
        };

        Assert.False(
            DietasReglasNegocio.DebeCorregirReingresoFueraVentana(fila, ventanaNovedadesAbierta: false));
    }
}
