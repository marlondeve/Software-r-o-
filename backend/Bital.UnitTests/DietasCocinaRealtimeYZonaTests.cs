using Bital.Application.DTOs.DietasCocina;
using Bital.Infrastructure.DietasCocina;

namespace Bital.UnitTests;

public class DietasCocinaRealtimeYZonaTests
{
    [Fact]
    public async Task NullDietasCocinaRealtime_NoLanza()
    {
        var realtime = NullDietasCocinaRealtime.Instance;
        var fila = new FilaDietaDto { Id = Guid.NewGuid() };

        await realtime.NotificarFilaAsync(fila);
        await realtime.NotificarCensoAsync(new CensoActualizadoDto());
        await realtime.NotificarOrdenAsync(new OrdenCocinaDto());
        await realtime.NotificarEtiquetasAsync([]);
        await realtime.NotificarParametrosAsync();
        await realtime.NotificarCatalogoAsync();
        await realtime.NotificarConciliacionAsync();
        await realtime.NotificarPermisosAsync();
    }

    [Fact]
    public void AHoraColombia_MedianocheUtc_EsTardeDelDiaAnterior()
    {
        var utc = new DateTime(2026, 8, 28, 0, 30, 0, DateTimeKind.Utc);
        var colombia = HorarioOperativoHelper.AHoraColombia(utc);

        Assert.Equal(new DateTime(2026, 8, 27), colombia.Date);
        Assert.Equal(19, colombia.Hour);
        Assert.Equal(30, colombia.Minute);
    }

    [Fact]
    public void HoyColombia_CoincideConAhoraColombiaDate()
    {
        Assert.Equal(HorarioOperativoHelper.AhoraColombia().Date, HorarioOperativoHelper.HoyColombia());
    }

    [Fact]
    public void EtiquetasCodigo_PrefijoUsaDiaColombiaNoUtc()
    {
        var utc = new DateTime(2026, 8, 28, 0, 30, 0, DateTimeKind.Utc);
        var codigo = EtiquetasCodigoHelper.Generar(utc);

        Assert.StartsWith("E260827-", codigo, StringComparison.Ordinal);
    }
}
