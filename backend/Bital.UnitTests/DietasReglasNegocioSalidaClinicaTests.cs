using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.DietasCocina;

namespace Bital.UnitTests;

/// <summary>
/// Salida clínica (IngInSlC=S) vs límite de novedades:
/// - Lista para despacho: siempre sostener (ya preparada).
/// - Dentro del límite: cancelar Pendiente…EnPreparacion.
/// - Fuera del límite: cancelar Pendiente/Guardado/Solicitada; sostener Confirmada+.
/// </summary>
public class DietasReglasNegocioSalidaClinicaTests
{
    [Theory]
    [InlineData(EstadoDieta.Guardado)]
    [InlineData(EstadoDieta.Solicitada)]
    [InlineData(EstadoDieta.Confirmada)]
    [InlineData(EstadoDieta.EnPreparacion)]
    public void DentroDelLimite_CancelaHastaEnPreparacion(EstadoDieta estado)
    {
        Assert.True(DietasReglasNegocio.DebeCancelarPorEgreso(estado, ventanaNovedadesAbierta: true));
        Assert.False(DietasReglasNegocio.DebeSostenerPorEgreso(estado, ventanaNovedadesAbierta: true));
    }

    [Fact]
    public void DentroDelLimite_ListaParaDespacho_Sostiene()
    {
        Assert.False(
            DietasReglasNegocio.DebeCancelarPorEgreso(
                EstadoDieta.ListaEnvio,
                ventanaNovedadesAbierta: true));
        Assert.True(
            DietasReglasNegocio.DebeSostenerPorEgreso(
                EstadoDieta.ListaEnvio,
                ventanaNovedadesAbierta: true));
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
    [InlineData(EstadoDieta.Confirmada)]
    [InlineData(EstadoDieta.EnPreparacion)]
    [InlineData(EstadoDieta.ListaEnvio)]
    public void FueraDelLimite_SostieneSoloComprometidaConCocina(EstadoDieta estado)
    {
        Assert.False(DietasReglasNegocio.DebeCancelarPorEgreso(estado, ventanaNovedadesAbierta: false));
        Assert.True(DietasReglasNegocio.DebeSostenerPorEgreso(estado, ventanaNovedadesAbierta: false));
    }

    [Theory]
    [InlineData(EstadoDieta.Pendiente)]
    [InlineData(EstadoDieta.Guardado)]
    [InlineData(EstadoDieta.Solicitada)]
    public void FueraDelLimite_CancelaSinCocina(EstadoDieta estado)
    {
        Assert.True(
            DietasReglasNegocio.DebeCancelarPorEgreso(estado, ventanaNovedadesAbierta: false));
        Assert.False(
            DietasReglasNegocio.DebeSostenerPorEgreso(estado, ventanaNovedadesAbierta: false));
    }

    [Theory]
    [InlineData(EstadoDieta.Guardado)]
    [InlineData(EstadoDieta.Solicitada)]
    public void SostenidaSobreGuardadoOSolicitada_EsIndevida(EstadoDieta estado)
    {
        Assert.True(DietasReglasNegocio.SostenidaSinCocinaEsIndevida(estado));
        Assert.False(DietasReglasNegocio.SostenidaSinCocinaEsIndevida(EstadoDieta.Confirmada));
        Assert.False(DietasReglasNegocio.SostenidaSinCocinaEsIndevida(EstadoDieta.ListaEnvio));
    }

    [Fact]
    public void Egreso_FueraDelLimite_Guardado_NoDebióSostenerse()
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

        Assert.False(
            DietasReglasNegocio.EgresoDebióSostenerse(
                EstadoDieta.Guardado,
                config,
                fecha,
                momentoEgreso));
    }

    [Fact]
    public void Egreso_DentroDelLimite_ListaEnvio_DebióSostenerse()
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

        Assert.True(
            DietasReglasNegocio.EgresoDebióSostenerse(
                EstadoDieta.ListaEnvio,
                config,
                fecha,
                momentoEgreso));
    }

    [Fact]
    public void FueraDelLimite_NoPuedeConfirmarEnvioACocina()
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
        var ahora = new DateTime(2026, 8, 26, 16, 0, 0);

        Assert.False(
            DietasReglasNegocio.PuedeConfirmarEnvioACocina(config, fecha, ahora));
        Assert.True(
            DietasReglasNegocio.PuedeConfirmarEnvioACocina(
                config,
                fecha,
                new DateTime(2026, 8, 26, 14, 0, 0)));
    }

    [Theory]
    [InlineData(EstadoDieta.Guardado)]
    [InlineData(EstadoDieta.Solicitada)]
    public void EsSalidaClinicaSostenida_IgnoraGuardadoAunqueTengaFlag(EstadoDieta estado)
    {
        var fila = new FilaDieta
        {
            Estado = estado,
            SalidaClinicaSostenida = true,
            Observaciones = DietasReglasNegocio.MotivoSalidaClinicaSostenida,
        };
        Assert.False(DietasReglasNegocio.EsSalidaClinicaSostenida(fila));
    }

    [Fact]
    public void EsSalidaClinicaSostenida_SoloSiComprometidaConCocina()
    {
        var fila = new FilaDieta
        {
            Estado = EstadoDieta.ListaEnvio,
            SalidaClinicaSostenida = true,
        };
        Assert.True(DietasReglasNegocio.EsSalidaClinicaSostenida(fila));
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
    public void EsSalidaClinicaSostenida_PersisteEnRutaYPosteriores()
    {
        var fila = new FilaDieta
        {
            Estado = EstadoDieta.EnRuta,
            SalidaClinicaSostenida = true,
        };
        Assert.True(DietasReglasNegocio.EsSalidaClinicaSostenida(fila));
    }

    [Fact]
    public void EgresoAutomatico_NuncaMarcaCancelacionTardia()
    {
        Assert.False(DietasReglasNegocio.EsCancelacionTardiaPorEgreso(EstadoDieta.Confirmada));
        Assert.False(DietasReglasNegocio.EsCancelacionTardiaPorEgreso(EstadoDieta.EnPreparacion));
        Assert.False(DietasReglasNegocio.EsCancelacionTardiaPorEgreso(EstadoDieta.ListaEnvio));
        Assert.False(DietasReglasNegocio.EsCancelacionTardiaPorEgreso(EstadoDieta.Guardado));
    }

    [Fact]
    public void ObservacionMixta_EnCancelada_EsSalidaClinica()
    {
        var texto =
            "Paciente con salida clínica\nSalida clínica fuera del límite de novedades: la dieta se mantiene y el proveedor la envía";

        Assert.True(DietasReglasNegocio.EsObservacionSalidaClinicaSostenida(texto));
        Assert.False(DietasReglasNegocio.EsObservacionSalidaClinica(texto));
        Assert.True(
            DietasReglasNegocio.EsObservacionSalidaClinica(texto, EstadoDieta.Cancelada));
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
