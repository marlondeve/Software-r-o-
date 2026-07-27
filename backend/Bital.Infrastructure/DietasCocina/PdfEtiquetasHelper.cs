using System.Globalization;
using System.Text;

namespace Bital.Infrastructure.DietasCocina;

internal static class PdfEtiquetasHelper
{
    /// <summary>
    /// Genera un PDF mínimo válido con texto plano por etiqueta (sin dependencias externas).
    /// </summary>
    public static byte[] Generar(IEnumerable<string> lineasEtiqueta)
    {
        var contenido = new StringBuilder();
        var y = 750;
        contenido.AppendLine("BT");
        contenido.AppendLine("/F1 12 Tf");
        foreach (var linea in lineasEtiqueta)
        {
            var texto = EscaparPdf(linea);
            contenido.AppendLine(CultureInvariant($"72 {y} Td"));
            contenido.AppendLine($"({texto}) Tj");
            contenido.AppendLine("0 -16 Td");
            y -= 16;
            if (y < 72)
            {
                break;
            }
        }

        contenido.AppendLine("ET");

        var streamBytes = Encoding.ASCII.GetBytes(contenido.ToString());
        var streamLength = streamBytes.Length;

        var pdf = new StringBuilder();
        pdf.AppendLine("%PDF-1.4");
        var offsets = new List<int>();

        void AddObject(int number, string body)
        {
            offsets.Add(pdf.Length);
            pdf.AppendLine($"{number} 0 obj");
            pdf.AppendLine(body);
            pdf.AppendLine("endobj");
        }

        AddObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
        AddObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
        AddObject(
            3,
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>");
        AddObject(4, $"<< /Length {streamLength} >>\nstream\n{contenido}endstream");
        AddObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        var xrefOffset = pdf.Length;
        pdf.AppendLine("xref");
        pdf.AppendLine("0 6");
        pdf.AppendLine("0000000000 65535 f ");
        foreach (var offset in offsets)
        {
            pdf.AppendLine($"{offset:D10} 00000 n ");
        }

        pdf.AppendLine("trailer");
        pdf.AppendLine("<< /Size 6 /Root 1 0 R >>");
        pdf.AppendLine("startxref");
        pdf.AppendLine(xrefOffset.ToString(CultureInfo.InvariantCulture));
        pdf.AppendLine("%%EOF");

        return Encoding.ASCII.GetBytes(pdf.ToString());
    }

    private static string EscaparPdf(string texto) =>
        texto.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");

    private static string CultureInvariant(FormattableString value) =>
        value.ToString(CultureInfo.InvariantCulture);
}
