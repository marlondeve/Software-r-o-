using System.Text.Json;
using System.Text.Json.Serialization;

namespace Bital.Infrastructure.DietasCocina;

internal static class AuditoriaSnapshot
{
    private static readonly JsonSerializerOptions Options = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public static string? Json(object? value)
    {
        if (value == null) return null;
        return JsonSerializer.Serialize(value, Options);
    }
}
