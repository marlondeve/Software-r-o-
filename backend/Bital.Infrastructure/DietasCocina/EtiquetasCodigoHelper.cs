using System.Security.Cryptography;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Códigos cortos para etiquetas de bandeja (QR / ingreso manual).
/// Formato: E{yyMMdd}-{4} → ejemplo E260731-K7M3
/// </summary>
public static class EtiquetasCodigoHelper
{
    // Sin 0/O ni 1/I para lectura manual y escaneo.
    private const string Alfabeto = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    public static string Generar(DateTime? utc = null)
    {
        var fecha = (utc ?? DateTime.UtcNow).ToString("yyMMdd");
        Span<char> sufijo = stackalloc char[4];
        Span<byte> random = stackalloc byte[4];
        RandomNumberGenerator.Fill(random);
        for (var i = 0; i < sufijo.Length; i++)
        {
            sufijo[i] = Alfabeto[random[i] % Alfabeto.Length];
        }

        return $"E{fecha}-{new string(sufijo)}";
    }

    public static string Normalizar(string? codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            return string.Empty;

        var limpio = codigo.Replace(" ", "", StringComparison.Ordinal).Trim().ToUpperInvariant();

        if (limpio.StartsWith("LBL:", StringComparison.Ordinal))
            limpio = limpio[4..];

        return limpio;
    }
}
