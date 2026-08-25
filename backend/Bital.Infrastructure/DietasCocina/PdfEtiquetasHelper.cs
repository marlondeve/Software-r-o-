using System.Globalization;
using System.Reflection;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// PDF térmico 168 × 88 mm (una etiqueta = una página). Layout compacto para no desbordar.
/// </summary>
internal static class PdfEtiquetasHelper
{
    public const string CodigoEtiquetaPrueba = "LBL-PRUEBA-IMP-2026";

    private const float AnchoMm = 168f;
    private const float AltoMm = 88f;
    private const float AnchoContenidoMm = 117.6f; // 70%
    private const float AnchoQrMm = 50.4f; // 30%
    private const float QrMm = 38f;

    private static readonly CultureInfo CulturaEs = CultureInfo.GetCultureInfo("es-CO");
    private static readonly byte[] LogoBytes = CargarRecurso("Logo-Clinica-del-Rio.png");
    private static readonly string RutaConsulta = "/dietas-cocina/bandejas-piso/consulta/";

    static PdfEtiquetasHelper()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public static byte[] Generar(IReadOnlyList<EtiquetaPdfModelo> etiquetas)
    {
        if (etiquetas.Count == 0)
            throw new ArgumentException("Se requiere al menos una etiqueta.", nameof(etiquetas));

        return Document.Create(container =>
        {
            foreach (var etiqueta in etiquetas)
            {
                container.Page(page =>
                {
                    page.Size(AnchoMm, AltoMm, Unit.Millimetre);
                    page.Margin(0);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x
                        .FontFamily(FontFamily())
                        .FontColor("#000000")
                        .FontSize(9));

                    // StopPaging: si el texto no cabe, se recorta; nunca genera 2.ª página.
                    page.Content().StopPaging().Element(c => ComponerEtiqueta(c, etiqueta));
                });
            }
        }).GeneratePdf();
    }

    public static EtiquetaPdfModelo CrearEtiquetaPrueba(string frontendPublicUrl = "")
    {
        return new EtiquetaPdfModelo
        {
            Codigo = CodigoEtiquetaPrueba,
            QrPayload = ConstruirQrPayload(CodigoEtiquetaPrueba, frontendPublicUrl),
            Comida = "ALMUERZO",
            FechaHora = "24/08/2026 12:30 p. m.",
            Paciente = "MACIAS FERNANDEZ, LISSETH",
            Ingreso = "12345",
            Edad = 46,
            DocumentoTitulo = "CC",
            DocumentoValor = "22519010",
            Ubicacion = "HOSPITALIZACION PISO 3 - HAB 3HP09",
            Aislamiento = false,
            TipoDieta = "HIPOSÓDICA",
            Consistencia = "Blanda",
            Observaciones = "Sin tomate, intolerancia leve a lácteos. Alergias: mariscos y maní.",
        };
    }

    public static string ConstruirQrPayload(string codigo, string frontendPublicUrl)
    {
        var path = $"{RutaConsulta}{Uri.EscapeDataString(codigo.Trim())}";
        var origen = frontendPublicUrl.Trim().TrimEnd('/');
        return string.IsNullOrWhiteSpace(origen) ? path : $"{origen}{path}";
    }

    public static string EtiquetaComida(Domain.Enums.TiempoComida comida) => comida switch
    {
        Domain.Enums.TiempoComida.Desayuno => "DESAYUNO",
        Domain.Enums.TiempoComida.MediaNueve => "MERIENDA DE MEDIA MAÑANA",
        Domain.Enums.TiempoComida.Almuerzo => "ALMUERZO",
        Domain.Enums.TiempoComida.Onces => "MERIENDA DE MEDIA TARDE",
        Domain.Enums.TiempoComida.Cena => "CENA",
        Domain.Enums.TiempoComida.MediaNoche => "MERIENDA DE MEDIA NOCHE",
        _ => comida.ToString().ToUpper(CulturaEs),
    };

    public static string FormatearFechaHora(DateTime fecha)
    {
        var hora12 = fecha.Hour % 12;
        if (hora12 == 0) hora12 = 12;
        var periodo = fecha.Hour >= 12 ? "p. m." : "a. m.";
        return $"{fecha:dd/MM/yyyy} {hora12:00}:{fecha:mm} {periodo}";
    }

    private static void ComponerEtiqueta(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        container
            .Width(AnchoMm, Unit.Millimetre)
            .Height(AltoMm, Unit.Millimetre)
            .StopPaging()
            .Row(row =>
            {
                row.ConstantItem(AnchoContenidoMm, Unit.Millimetre)
                    .Height(AltoMm, Unit.Millimetre)
                    .StopPaging()
                    .Element(c => ComponerContenido(c, etiqueta));
                row.ConstantItem(AnchoQrMm, Unit.Millimetre)
                    .Height(AltoMm, Unit.Millimetre)
                    .StopPaging()
                    .BorderLeft(0.5f)
                    .BorderColor("#000000")
                    .Element(c => ComponerColumnaQr(c, etiqueta));
            });
    }

    private static void ComponerContenido(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        // Alturas fijas que suman exactamente el alto útil (sin Extend / sin forzar obsH mínimo).
        const float padV = 2.4f;
        const float headerH = 12f;
        const float pacienteH = 7f;
        const float metaH = 12f;
        const float dietaH = 16f;
        const float gaps = 2.4f;
        var obsH = AltoMm - padV * 2 - headerH - pacienteH - metaH - dietaH - gaps;

        container
            .PaddingVertical(padV, Unit.Millimetre)
            .PaddingHorizontal(3f, Unit.Millimetre)
            .Column(col =>
            {
                col.Item().Height(headerH, Unit.Millimetre).StopPaging()
                    .Element(c => ComponerEncabezado(c, etiqueta));

                col.Item().Height(pacienteH, Unit.Millimetre).StopPaging().AlignMiddle()
                    .Text(Mayusculas(etiqueta.Paciente))
                    .FontSize(13f)
                    .Bold()
                    .LineHeight(1.05f)
                    .ClampLines(1);

                col.Item().Height(metaH, Unit.Millimetre).StopPaging().AlignMiddle()
                    .Element(c => ComponerMeta(c, etiqueta));

                col.Item().Height(dietaH, Unit.Millimetre).StopPaging()
                    .Element(c => ComponerDietaConsistencia(c, etiqueta));

                col.Item().Height(Math.Max(obsH, 1f), Unit.Millimetre).StopPaging()
                    .Element(c => ComponerObservaciones(c, etiqueta));
            });
    }

    private static void ComponerEncabezado(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        container
            .BorderBottom(0.4f)
            .BorderColor("#d9d9d9")
            .PaddingBottom(1f, Unit.Millimetre)
            .Row(row =>
            {
                row.ConstantItem(42f, Unit.Millimetre)
                    .Height(9f, Unit.Millimetre)
                    .AlignMiddle()
                    .Image(LogoBytes)
                    .FitArea();

                row.RelativeItem().AlignRight().AlignMiddle().Column(col =>
                {
                    col.Item().AlignRight().Text(Mayusculas(etiqueta.Comida))
                        .FontSize(14f)
                        .Bold();
                    col.Item().AlignRight().PaddingTop(0.3f, Unit.Millimetre)
                        .Text(Mayusculas(etiqueta.FechaHora))
                        .FontSize(10f)
                        .Bold()
                        .FontColor("#1a1a1a");
                });
            });
    }

    private static void ComponerMeta(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        var aislamiento = etiqueta.Aislamiento ? "SÍ" : "NO";
        container.Column(col =>
        {
            col.Item().Text(t =>
            {
                t.DefaultTextStyle(x => x.FontSize(10f).Bold().FontColor("#1a1a1a").LineHeight(1.2f));
                if (!string.IsNullOrWhiteSpace(etiqueta.Ingreso))
                {
                    TituloValor(t, "Ingreso", etiqueta.Ingreso);
                    t.Span("  |  ").FontColor("#bfbfbf").NormalWeight();
                }

                TituloValor(t, "Edad", etiqueta.Edad.ToString(CulturaEs));
                t.Span("  |  ").FontColor("#bfbfbf").NormalWeight();
                TituloValor(t, etiqueta.DocumentoTitulo, etiqueta.DocumentoValor);
            });

            col.Item().PaddingTop(0.3f, Unit.Millimetre).Text(t =>
            {
                t.DefaultTextStyle(x => x.FontSize(10f).Bold().FontColor("#1a1a1a").LineHeight(1.15f));
                t.ClampLines(2);
                t.Span(Mayusculas(etiqueta.Ubicacion));
                t.Span("  |  ").FontColor("#bfbfbf").NormalWeight();
                TituloValor(t, "Aislamiento", aislamiento);
            });
        });
    }

    private static void ComponerDietaConsistencia(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        container.Border(0.5f).BorderColor("#000000").Row(row =>
        {
            row.RelativeItem().BorderRight(0.5f).BorderColor("#000000")
                .PaddingVertical(1.4f, Unit.Millimetre)
                .PaddingHorizontal(2.2f, Unit.Millimetre)
                .Column(col =>
                {
                    col.Item().Text("DIETA:").FontSize(8f).Bold().FontColor("#1a1a1a");
                    col.Item().PaddingTop(0.2f, Unit.Millimetre)
                        .Text(Mayusculas(Vacio(etiqueta.TipoDieta)))
                        .FontSize(10.5f)
                        .Bold()
                        .LineHeight(1.1f)
                        .ClampLines(2);
                });

            row.RelativeItem()
                .PaddingVertical(1.4f, Unit.Millimetre)
                .PaddingHorizontal(2.2f, Unit.Millimetre)
                .Column(col =>
                {
                    col.Item().Text("CONSISTENCIA:").FontSize(8f).Bold().FontColor("#1a1a1a");
                    col.Item().PaddingTop(0.2f, Unit.Millimetre)
                        .Text(Mayusculas(Vacio(etiqueta.Consistencia)))
                        .FontSize(10.5f)
                        .Bold()
                        .LineHeight(1.1f)
                        .ClampLines(2);
                });
        });
    }

    private static void ComponerObservaciones(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        container
            .Border(0.5f)
            .BorderColor("#000000")
            .Padding(2f, Unit.Millimetre)
            .Column(col =>
            {
                col.Item().Text("OBSERVACIONES")
                    .FontSize(8.5f)
                    .Bold();
                col.Item().PaddingTop(0.6f, Unit.Millimetre)
                    .Text(Mayusculas(Vacio(etiqueta.Observaciones)))
                    .FontSize(10f)
                    .Bold()
                    .FontColor("#1a1a1a")
                    .LineHeight(1.2f)
                    .ClampLines(4);
            });
    }

    private static void ComponerColumnaQr(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        var qrPng = GenerarQrPng(etiqueta.QrPayload);
        var fontCodigo = etiqueta.Codigo.Trim().Length > 28
            ? 7.5f
            : etiqueta.Codigo.Trim().Length > 22 ? 8.5f : 9.5f;

        const float padV = 2f;
        const float badgeH = 7f;
        const float codigoH = 9f;
        var qrAreaH = AltoMm - padV * 2 - badgeH - codigoH;

        container
            .PaddingVertical(padV, Unit.Millimetre)
            .PaddingHorizontal(1.6f, Unit.Millimetre)
            .Column(col =>
            {
                col.Item().Height(badgeH, Unit.Millimetre).AlignCenter().AlignMiddle()
                    .Element(ComponerBadgeEscanear);

                col.Item().Height(qrAreaH, Unit.Millimetre).AlignCenter().AlignMiddle()
                    .Element(e => e
                        .Width(QrMm, Unit.Millimetre)
                        .Height(QrMm, Unit.Millimetre)
                        .Image(qrPng)
                        .FitArea());

                col.Item().Height(codigoH, Unit.Millimetre).AlignCenter().AlignMiddle()
                    .Text(etiqueta.Codigo)
                    .FontSize(fontCodigo)
                    .Bold()
                    .FontColor("#1a1a1a")
                    .LineHeight(1.1f);
            });
    }

    private static void ComponerBadgeEscanear(IContainer container)
    {
        container
            .Background("#000000")
            .PaddingVertical(0.8f, Unit.Millimetre)
            .PaddingHorizontal(2f, Unit.Millimetre)
            .Text("ESCANEAR")
            .FontSize(8f)
            .Bold()
            .FontColor("#ffffff")
            .LetterSpacing(0.04f);
    }

    private static void TituloValor(TextDescriptor t, string titulo, string valor)
    {
        t.Span($"{titulo}: ").Bold();
        t.Span(Mayusculas(valor)).Bold();
    }

    private static string Mayusculas(string? texto) =>
        string.IsNullOrWhiteSpace(texto) ? "" : texto.ToUpper(CulturaEs);

    private static string Vacio(string? texto) =>
        string.IsNullOrWhiteSpace(texto) ? "—" : texto.Trim();

    private static string FontFamily() =>
        OperatingSystem.IsWindows() ? "Arial" : "Helvetica";

    private static byte[] GenerarQrPng(string payload)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(
            string.IsNullOrWhiteSpace(payload) ? " " : payload,
            QRCodeGenerator.ECCLevel.M);
        var png = new PngByteQRCode(data);
        return png.GetGraphic(8);
    }

    private static byte[] CargarRecurso(string nombreArchivo)
    {
        var ensamblado = Assembly.GetExecutingAssembly();
        var recurso = ensamblado.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith(nombreArchivo, StringComparison.OrdinalIgnoreCase))
            ?? throw new InvalidOperationException($"No se encontró el recurso embebido {nombreArchivo}.");

        using var stream = ensamblado.GetManifestResourceStream(recurso)
            ?? throw new InvalidOperationException($"No se pudo leer el recurso {recurso}.");
        using var memory = new MemoryStream();
        stream.CopyTo(memory);
        return memory.ToArray();
    }
}
