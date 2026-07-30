using System.Text.Json;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Infrastructure.DietasCocina;

internal static class ChecklistOperativoHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static List<ChecklistItemDto> PlantillaInicial() =>
    [
        new() { Id = "ck-1", Label = "Receta revisada", Obligatorio = false, Completado = false },
        new() { Id = "ck-2", Label = "Alergias revisadas", Obligatorio = true, Completado = false },
        new() { Id = "ck-3", Label = "Aislamiento identificado", Obligatorio = true, Completado = false },
        new() { Id = "ck-4", Label = "Porción verificada", Obligatorio = false, Completado = false },
    ];

    public static List<ChecklistItemDto> DesdeJson(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return PlantillaInicial();
        }

        try
        {
            var items = JsonSerializer.Deserialize<List<ChecklistItemDto>>(json, JsonOptions);
            if (items == null || items.Count == 0)
            {
                return PlantillaInicial();
            }

            var plantilla = PlantillaInicial();
            foreach (var item in plantilla)
            {
                var guardado = items.FirstOrDefault(i => i.Id == item.Id);
                if (guardado != null)
                {
                    item.Completado = guardado.Completado;
                }
            }

            return plantilla;
        }
        catch (JsonException)
        {
            return PlantillaInicial();
        }
    }

    public static string Serializar(IEnumerable<ChecklistItemDto> items) =>
        JsonSerializer.Serialize(items, JsonOptions);

    public static bool ObligatoriosCompletos(IEnumerable<ChecklistItemDto> items) =>
        items.Where(i => i.Obligatorio).All(i => i.Completado);

    public static List<ChecklistItemDto> AplicarActualizacion(
        IEnumerable<ChecklistItemDto> actual,
        IEnumerable<ChecklistItemActualizarDto> cambios)
    {
        var mapa = cambios.ToDictionary(c => c.Id, c => c.Completado);
        return actual.Select(item =>
            mapa.TryGetValue(item.Id, out var completado)
                ? new ChecklistItemDto
                {
                    Id = item.Id,
                    Label = item.Label,
                    Obligatorio = item.Obligatorio,
                    Completado = completado,
                }
                : item).ToList();
    }
}
