using Bital.Domain.Entities.DietasCocina;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Catálogo tarifario FCR (propuesta 2025 / vigencia 2026).
/// </summary>
public static class CatalogoDietasFcrSeed
{
    private const string UsuarioSeed = "seed-fcr";
    private static readonly DateTime Inicio2025 = new(2025, 1, 1);
    private static readonly DateTime Fin2025 = new(2025, 12, 31);
    private static readonly DateTime Inicio2026 = new(2026, 1, 1);
    private static readonly DateTime Fin2026 = new(2026, 12, 31);

    private sealed record TarifaComidaDef(TiempoComida Comida, decimal Monto2025, decimal Monto2026);

    private sealed record DietaFcrDef(
        Guid Id,
        string Codigo,
        string Nombre,
        IReadOnlyList<TarifaComidaDef> Tarifas);

    private static readonly decimal Merienda2025 = 6080m;
    private static readonly decimal Merienda2026 = 6688m;

    private static readonly DietaFcrDef[] Catalogo =
    [
        new(
            Guid.Parse("aaaaaaaa-0001-4000-8000-000000000001"),
            "D-001",
            "Normales y derivadas",
            [
                new(TiempoComida.Desayuno, 9766m, 10743m),
                new(TiempoComida.Almuerzo, 12479m, 13727m),
                new(TiempoComida.Cena, 12479m, 13727m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0002-4000-8000-000000000002"),
            "D-002",
            "Hiperproteico",
            [
                new(TiempoComida.Desayuno, 11108m, 12219m),
                new(TiempoComida.Almuerzo, 13213m, 14534m),
                new(TiempoComida.Cena, 12862m, 14148m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0003-4000-8000-000000000003"),
            "D-003",
            "Hipoproteico",
            [
                new(TiempoComida.Desayuno, 8770m, 9647m),
                new(TiempoComida.Almuerzo, 9354m, 10289m),
                new(TiempoComida.Cena, 10407m, 11448m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0004-4000-8000-000000000004"),
            "D-004",
            "Renal",
            [
                new(TiempoComida.Almuerzo, 12021m, 13223m),
                new(TiempoComida.Cena, 12646m, 13911m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0005-4000-8000-000000000005"),
            "D-005",
            "Líquidos claros",
            [
                new(TiempoComida.Desayuno, 5518m, 6070m),
                new(TiempoComida.Almuerzo, 6300m, 6930m),
                new(TiempoComida.Cena, 5518m, 6070m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0006-4000-8000-000000000006"),
            "D-006",
            "Niños de 6 a 10 meses",
            [
                new(TiempoComida.Almuerzo, 8185m, 9004m),
                new(TiempoComida.Cena, 8185m, 9004m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0007-4000-8000-000000000007"),
            "D-007",
            "Niños de 10 m en adelante",
            [
                new(TiempoComida.Desayuno, 7016m, 7718m),
                new(TiempoComida.Almuerzo, 12269m, 13496m),
                new(TiempoComida.Cena, 12269m, 13496m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0008-4000-8000-000000000008"),
            "D-008",
            "Líquido completa",
            [
                new(TiempoComida.Desayuno, 8419m, 9261m),
                new(TiempoComida.Almuerzo, 9289m, 10218m),
                new(TiempoComida.Cena, 9939m, 10933m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0009-4000-8000-000000000009"),
            "D-009",
            "Hiperproteico licuado completa",
            [
                new(TiempoComida.Desayuno, 11108m, 12219m),
                new(TiempoComida.Almuerzo, 13213m, 14534m),
                new(TiempoComida.Cena, 12862m, 14148m),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0010-4000-8000-000000000010"),
            "D-010",
            "Merienda mañana",
            [
                new(TiempoComida.MediaNueve, Merienda2025, Merienda2026),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0011-4000-8000-000000000011"),
            "D-011",
            "Merienda tarde",
            [
                new(TiempoComida.Onces, Merienda2025, Merienda2026),
            ]),
        new(
            Guid.Parse("aaaaaaaa-0012-4000-8000-000000000012"),
            "D-012",
            "Merienda noche",
            [
                new(TiempoComida.MediaNoche, Merienda2025, Merienda2026),
            ]),
    ];

    /// <summary>
    /// Carga el catálogo FCR solo si no hay dietas en BD (primer despliegue).
    /// </summary>
    public static async Task<bool> EnsureFcrSeededAsync(
        BitalNegocioDbContext context,
        CancellationToken cancellationToken = default)
    {
        if (await context.DietasCatalogo.AnyAsync(cancellationToken))
        {
            return false;
        }

        await InsertCatalogoAsync(context, cancellationToken);
        return true;
    }

    /// <summary>
    /// Reemplaza todo el catálogo FCR. Solo para desarrollo o migración manual explícita.
    /// </summary>
    public static async Task ReseedAsync(
        BitalNegocioDbContext context,
        CancellationToken cancellationToken = default)
    {
        await context.TarifasHistorico.ExecuteDeleteAsync(cancellationToken);
        await context.DietasCatalogo.ExecuteDeleteAsync(cancellationToken);
        await InsertCatalogoAsync(context, cancellationToken);
    }

    private static async Task InsertCatalogoAsync(
        BitalNegocioDbContext context,
        CancellationToken cancellationToken)
    {
        var ahora = DateTime.UtcNow;
        var fechaInicioCatalogo = Inicio2026;

        foreach (var def in Catalogo)
        {
            var dieta = new DietaCatalogo
            {
                Id = def.Id,
                Codigo = def.Codigo,
                Nombre = def.Nombre,
                Descripcion = $"Tarifa FCR — {def.Nombre}",
                FechaInicio = fechaInicioCatalogo,
                FechaFin = null,
                Usuario = UsuarioSeed,
                Activa = true,
                CreadoPor = UsuarioSeed,
                CreadoEn = ahora,
            };

            foreach (var tarifa in def.Tarifas)
            {
                dieta.HistoricoTarifas.Add(CrearTarifa(
                    def.Id,
                    tarifa.Comida,
                    2025,
                    tarifa.Monto2025,
                    Inicio2025,
                    Fin2025,
                    ahora,
                    vigente: false));

                dieta.HistoricoTarifas.Add(CrearTarifa(
                    def.Id,
                    tarifa.Comida,
                    2026,
                    tarifa.Monto2026,
                    Inicio2026,
                    Fin2026,
                    ahora,
                    vigente: true));
            }

            context.DietasCatalogo.Add(dieta);
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private static TarifaHistorico CrearTarifa(
        Guid dietaId,
        TiempoComida comida,
        int anio,
        decimal monto,
        DateTime vigenciaDesde,
        DateTime vigenciaHasta,
        DateTime creadoEn,
        bool vigente)
    {
        return new TarifaHistorico
        {
            Id = Guid.NewGuid(),
            DietaCatalogoId = dietaId,
            TiempoComida = comida,
            Anio = anio,
            Monto = monto,
            VigenciaDesde = vigenciaDesde,
            VigenciaHasta = vigenciaHasta,
            Activa = vigente,
            Observaciones = anio == 2025
                ? "Tarifa FCR 2025 (histórico)"
                : "Propuesta tarifa FCR 2026 (+10%)",
            CreadoPor = UsuarioSeed,
            CreadoEn = creadoEn,
        };
    }
}
