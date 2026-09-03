using System.Globalization;
using System.Reflection;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// PDF térmico 168 × 88 mm (una etiqueta = una página).
/// Layout y tipografía alineados al mock del frontend; imágenes a 2400 dpi.
/// </summary>
internal static class PdfEtiquetasHelper
{
    public const string CodigoEtiquetaPrueba = "LBL-PRUEBA-IMP-2026";

    /// <summary>Misma constante que <c>etiquetaLayout.ts</c> → <c>PDF_CAPTURA_DPI</c>.</summary>
    public const int CapturaDpi = 2400;

    private const float AnchoMm = 168f;
    private const float AltoMm = 88f;
    private const float QrColRatio = 0.3f;
    private const float AnchoContenidoMm = AnchoMm * (1f - QrColRatio);
    private const float AnchoQrMm = AnchoMm * QrColRatio;
    private const float QrMm = AnchoQrMm * 0.84f;

    /// <summary>px de diseño (96 dpi) → pt QuestPDF.</summary>
    private const float DisenoPxAPt = 72f / 96f;

    /// <summary>168 mm × 2400 dpi ≈ píxeles del raster embebido.</summary>
    public static int AnchoCapturaPx => (int)Math.Round(AnchoMm / 25.4f * CapturaDpi);

    /// <summary>88 mm × 2400 dpi ≈ píxeles del raster embebido.</summary>
    public static int AltoCapturaPx => (int)Math.Round(AltoMm / 25.4f * CapturaDpi);

    private static readonly CultureInfo CulturaEs = CultureInfo.GetCultureInfo("es-CO");
    private static readonly TimeZoneInfo ZonaColombia = ResolverZonaColombia();
    private static readonly byte[] LogoBytes = CargarRecurso("Logo-Clinica-del-Rio.png");
    private static readonly string RutaConsulta = "/dietas-cocina/bandejas-piso/consulta/";

    private static readonly DocumentSettings AjustesDocumento = new()
    {
        ImageRasterDpi = CapturaDpi,
        ImageCompressionQuality = ImageCompressionQuality.Best,
        CompressDocument = true,
    };

    // Tipografía alineada a TIPOGRAFIA_IMPRESION (valores de diseño en px @ 96 dpi).
    private static readonly float PtComida = PtD(22);
    private static readonly float PtFecha = PtD(16);
    private static readonly float PtPaciente = PtD(22);
    private static readonly float PtMeta = PtD(16);
    private static readonly float PtUbicacion = PtD(18);
    private static readonly float PtDietaLabel = PtD(13.5f);
    private static readonly float PtDietaValor = PtD(17);
    private static readonly float PtObsLabel = PtD(13.5f);
    private static readonly float PtObsTexto = PtD(15.5f);
    private static readonly float PtBadge = PtD(13);

    static PdfEtiquetasHelper()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private static float PtD(float designPx) => designPx * DisenoPxAPt;

    private static TimeZoneInfo ResolverZonaColombia()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(
                OperatingSystem.IsWindows() ? "SA Pacific Standard Time" : "America/Bogota");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.CreateCustomTimeZone(
                "America/Bogota",
                TimeSpan.FromHours(-5),
                "Colombia",
                "COT");
        }
    }

    /// <summary>
    /// GeneradaEn se persiste en UTC (a menudo Kind=Unspecified al leer de SQL).
    /// </summary>
    public static DateTime AHoraColombia(DateTime utc)
    {
        var comoUtc = utc.Kind switch
        {
            DateTimeKind.Utc => utc,
            DateTimeKind.Local => utc.ToUniversalTime(),
            _ => DateTime.SpecifyKind(utc, DateTimeKind.Utc),
        };
        return TimeZoneInfo.ConvertTimeFromUtc(comoUtc, ZonaColombia);
    }

    public static byte[] Generar(IReadOnlyList<EtiquetaPdfModelo> etiquetas)
    {
        if (etiquetas.Count == 0)
            throw new ArgumentException("Se requiere al menos una etiqueta.", nameof(etiquetas));

        // QuestPDF genera el PDF vectorial y rasteriza las imágenes embebidas
        // (logo/QR) a CapturaDpi=2400 internamente vía DocumentSettings.ImageRasterDpi.
        // El texto queda como vector escalable, con la misma tipografía que el mock.
        return CrearDocumento(etiquetas)
            .WithSettings(AjustesDocumento)
            .GeneratePdf();
    }

    private static Document CrearDocumento(IReadOnlyList<EtiquetaPdfModelo> etiquetas) =>
        Document.Create(container =>
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
                        .FontSize(PtMeta));

                    page.Content().StopPaging().Element(c => ComponerEtiqueta(c, etiqueta));
                });
            }
        });

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

    public static string FormatearUbicacion(string? pabellon, string? habitacion)
    {
        var p = (pabellon ?? "").Trim();
        var h = (habitacion ?? "").Trim();
        if (string.IsNullOrEmpty(p) && string.IsNullOrEmpty(h)) return "—";
        if (string.IsNullOrEmpty(h)) return p;
        if (string.IsNullOrEmpty(p)) return $"HAB {h}";
        return $"{p} - HAB {h}";
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
            .Row(row =>
            {
                row.ConstantItem(AnchoContenidoMm, Unit.Millimetre)
                    .Height(AltoMm, Unit.Millimetre)
                    .Element(c => ComponerContenido(c, etiqueta));
                row.ConstantItem(AnchoQrMm, Unit.Millimetre)
                    .Height(AltoMm, Unit.Millimetre)
                    .BorderLeft(0.5f)
                    .BorderColor("#000000")
                    .Element(c => ComponerColumnaQr(c, etiqueta));
            });
    }

    private static void ComponerContenido(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        const float padV = 2.4f;
        const float headerH = 12f;
        const float pacienteH = 7.5f;
        const float metaH = 13f;
        const float dietaH = 16f;
        const float gapObs = 2f;
        var obsH = AltoMm - padV * 2 - headerH - pacienteH - metaH - dietaH - gapObs;

        container
            .PaddingVertical(padV, Unit.Millimetre)
            .PaddingHorizontal(3f, Unit.Millimetre)
            .Column(col =>
            {
                col.Item().Height(headerH, Unit.Millimetre)
                    .Element(c => ComponerEncabezado(c, etiqueta));

                col.Item().Height(pacienteH, Unit.Millimetre).AlignMiddle()
                    .Text(Mayusculas(etiqueta.Paciente))
                    .FontSize(PtPaciente)
                    .Bold()
                    .LineHeight(1.15f)
                    .ClampLines(1);

                col.Item().Height(metaH, Unit.Millimetre).AlignMiddle()
                    .Element(c => ComponerMeta(c, etiqueta));

                col.Item().Height(dietaH, Unit.Millimetre)
                    .Element(c => ComponerDietaConsistencia(c, etiqueta));

                col.Item().PaddingTop(gapObs, Unit.Millimetre)
                    .Height(Math.Max(obsH, 8f), Unit.Millimetre)
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
                        .FontSize(PtComida)
                        .Bold();
                    col.Item().AlignRight().PaddingTop(0.3f, Unit.Millimetre)
                        .Text(Mayusculas(etiqueta.FechaHora))
                        .FontSize(PtFecha)
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
                t.DefaultTextStyle(x => x.FontSize(PtMeta).Bold().FontColor("#1a1a1a").LineHeight(1.2f));
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
                t.DefaultTextStyle(x => x.FontSize(PtUbicacion).Bold().FontColor("#1a1a1a").LineHeight(1.15f));
                t.ClampLines(2);
                t.Span(Mayusculas(etiqueta.Ubicacion));
                t.Span("  |  ").FontColor("#bfbfbf").NormalWeight().FontSize(PtMeta);
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
                    col.Item().Text("DIETA:").FontSize(PtDietaLabel).Bold().FontColor("#1a1a1a");
                    col.Item().PaddingTop(0.2f, Unit.Millimetre)
                        .Text(Mayusculas(Vacio(etiqueta.TipoDieta)))
                        .FontSize(PtDietaValor)
                        .Bold()
                        .LineHeight(1.1f)
                        .ClampLines(2);
                });

            row.RelativeItem()
                .PaddingVertical(1.4f, Unit.Millimetre)
                .PaddingHorizontal(2.2f, Unit.Millimetre)
                .Column(col =>
                {
                    col.Item().Text("CONSISTENCIA:").FontSize(PtDietaLabel).Bold().FontColor("#1a1a1a");
                    col.Item().PaddingTop(0.2f, Unit.Millimetre)
                        .Text(Mayusculas(Vacio(etiqueta.Consistencia)))
                        .FontSize(PtDietaValor)
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
                    .FontSize(PtObsLabel)
                    .Bold();
                col.Item().PaddingTop(0.6f, Unit.Millimetre)
                    .Text(Mayusculas(Vacio(etiqueta.Observaciones)))
                    .FontSize(PtObsTexto)
                    .Bold()
                    .FontColor("#1a1a1a")
                    .LineHeight(1.2f)
                    .ClampLines(5);
            });
    }

    private static void ComponerColumnaQr(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        var qrPng = GenerarQrPng(etiqueta.QrPayload);
        var fontCodigo = etiqueta.Codigo.Trim().Length > 28
            ? PtD(12)
            : etiqueta.Codigo.Trim().Length > 22 ? PtD(13) : PtD(14);

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
                    .LineHeight(1.15f);
            });
    }

    private static void ComponerBadgeEscanear(IContainer container)
    {
        container
            .Background("#000000")
            .PaddingVertical(0.8f, Unit.Millimetre)
            .PaddingHorizontal(2f, Unit.Millimetre)
            .Text("ESCANEAR")
            .FontSize(PtBadge)
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
        var modulos = data.ModuleMatrix.Count;
        var pixelsPorModulo = Math.Max(8, (int)Math.Ceiling(8192.0 / Math.Max(modulos, 1)));
        return png.GetGraphic(pixelsPorModulo);
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
