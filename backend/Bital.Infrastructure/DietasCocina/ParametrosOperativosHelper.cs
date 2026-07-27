using Bital.Domain.Entities.DietasCocina;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.DietasCocina;

internal static class ParametrosOperativosHelper
{
    public const string ModoCargaPorComida = "por-comida";
    public const string ModoCargaTodasDesdeManana = "todas-desde-manana";

    public static async Task<ParametrosOperativos> ObtenerOSemillarAsync(
        BitalNegocioDbContext context,
        CancellationToken cancellationToken = default)
    {
        var config = await context.ParametrosOperativos.FirstOrDefaultAsync(cancellationToken);
        if (config != null)
        {
            return config;
        }

        config = new ParametrosOperativos
        {
            Id = Guid.NewGuid(),
            ModoCarga = ModoCargaPorComida,
            CreadoPor = "Sistema",
        };
        context.ParametrosOperativos.Add(config);
        await context.SaveChangesAsync(cancellationToken);
        return config;
    }

    public static string NormalizarModoCarga(string? modoCarga) =>
        modoCarga == ModoCargaTodasDesdeManana ? ModoCargaTodasDesdeManana : ModoCargaPorComida;
}
