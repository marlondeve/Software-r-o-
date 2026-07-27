using System.Globalization;
using System.Text;

namespace Bital.Infrastructure.DietasCocina;

public static class CsvExportHelper
{
    public static byte[] Generar(IEnumerable<IReadOnlyList<string?>> filas, IEnumerable<string> encabezados)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", encabezados.Select(Escapar)));
        foreach (var fila in filas)
        {
            sb.AppendLine(string.Join(",", fila.Select(v => Escapar(v ?? ""))));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string Escapar(string valor)
    {
        if (valor.Contains('"') || valor.Contains(',') || valor.Contains('\n') || valor.Contains('\r'))
        {
            return $"\"{valor.Replace("\"", "\"\"")}\"";
        }

        return valor;
    }

    public static string FormatearFecha(DateTime? fecha) =>
        fecha?.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture) ?? "";
}
