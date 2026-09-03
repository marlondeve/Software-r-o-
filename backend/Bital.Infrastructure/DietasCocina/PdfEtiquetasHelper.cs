using System.Globalization;
using System.Reflection;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// PDF térmico 168 × 88 mm (una etiqueta = una página).
/// Tamaños alineados con la calibración frontend de etiqueta de prueba
/// (<c>PDF_CAPTURA_DPI = 2400</c> ≈ 15 870 × 8 315 px sobre 168 × 88 mm).
/// </summary>
internal static class PdfEtiquetasHelper
{
    public const string CodigoEtiquetaPrueba = "LBL-PRUEBA-IMP-2026";

    /// <summary>Misma constante que <c>etiquetaLayout.ts</c> → <c>PDF_CAPTURA_DPI</c>.</summary>
    public const int CapturaDpi = 2400;

    private const float AnchoMm = 168f;
    private const float AltoMm = 88f;

    /// <summary>168 mm × 2400 dpi ≈ píxeles del raster embebido (paridad con captura frontend).</summary>
    public static int AnchoCapturaPx => (int)Math.Round(AnchoMm / 25.4f * CapturaDpi);

    /// <summary>88 mm × 2400 dpi ≈ píxeles del raster embebido.</summary>
    public static int AltoCapturaPx => (int)Math.Round(AltoMm / 25.4f * CapturaDpi);
    private const float QrColRatio = 0.3f;
    private const float AnchoContenidoMm = AnchoMm * (1f - QrColRatio); // 117.6
    private const float AnchoQrMm = AnchoMm * QrColRatio; // 50.4

    /// <summary>px de diseño (96 dpi sobre 168 mm) → mm. Igual que frontend <c>PX_POR_MM</c> inverso.</summary>
    private const float DisenoPxAMm = 25.4f / 96f;

    /// <summary>px de diseño → puntos QuestPDF (72/96).</summary>
    private const float DisenoPxAPt = 72f / 96f;

    // Tipografía = TIPOGRAFIA_IMPRESION (valores de diseño antes del scale de captura).
    private static readonly float PtComida = Pt(22);
    private static readonly float PtFecha = Pt(16);
    private static readonly float PtPaciente = Pt(22);
    private static readonly float PtMeta = Pt(16);
    private static readonly float PtUbicacion = Pt(18);
    private static readonly float PtDietaLabel = Pt(13.5f);
    private static readonly float PtDietaValor = Pt(17);
    private static readonly float PtObsLabel = Pt(13.5f);
    private static readonly float PtObsTexto = Pt(15.5f);
    private static readonly float PtCodigoCorto = Pt(14);
    private static readonly float PtCodigoMedio = Pt(13);
    private static readonly float PtCodigoLargo = Pt(12);
    private static readonly float PtBadge = Pt(13);

    // ELEMENTOS_IMPRESION / paddings de EtiquetaLabelFace modo impresión.
    private static readonly float PadContenidoVMm = Mm(10);
    private static readonly float PadContenidoHMm = Mm(12);
    private static readonly float PadDietaVMm = Mm(6);
    private static readonly float PadDietaHMm = Mm(9);
    private static readonly float PadObsVMm = Mm(6);
    private static readonly float PadObsHMm = Mm(9);
    private static readonly float MtObsMm = Mm(6);
    private static readonly float MtNombreMm = Mm(4);
    private static readonly float MbNombreMm = Mm(3);
    private static readonly float PbHeaderMm = Mm(5);
    private static readonly float LogoAltoMm = Mm(36);
    private static readonly float LogoAnchoMaxMm = Mm(120);
    private static readonly float QrMm = AnchoQrMm * 0.84f; // ~42.3 mm
    private static readonly float BordeMm = Mm(1);
    private static readonly float PadQrHMm = Mm(6);
    private static readonly float PadBadgeTopMm = Mm(8);
    private static readonly float BadgePadVMm = Mm(4);
    private static readonly float BadgePadHMm = Mm(10);

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

    static PdfEtiquetasHelper()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private static float Mm(float disenoPx) => disenoPx * DisenoPxAMm;

    private static float Pt(float disenoPx) => disenoPx * DisenoPxAPt;

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

        // Igual que html2canvas + jsPDF: raster a 2400 dpi (~15 874 × 8 315 px)
        // embebido como imagen a página física 168 × 88 mm.
        var paginasRaster = Document.Create(container =>
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
            })
            .WithSettings(AjustesDocumento)
            .GenerateImages(new ImageGenerationSettings
            {
                RasterDpi = CapturaDpi,
                ImageFormat = ImageFormat.Jpeg,
                ImageCompressionQuality = ImageCompressionQuality.Best,
            })
            .ToList();

        return Document.Create(container =>
            {
                foreach (var raster in paginasRaster)
                {
                    container.Page(page =>
                    {
                        page.Size(AnchoMm, AltoMm, Unit.Millimetre);
                        page.Margin(0);
                        page.Content()
                            .Width(AnchoMm, Unit.Millimetre)
                            .Height(AltoMm, Unit.Millimetre)
                            .Image(raster)
                            .FitArea()
                            .WithRasterDpi(CapturaDpi)
                            .UseOriginalImage();
                    });
                }
            })
            .WithSettings(AjustesDocumento)
            .GeneratePdf();
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

    /// <summary>Formato de ubicación igual al de la etiqueta de prueba (<c>HAB</c>).</summary>
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
                    .BorderLeft(BordeMm, Unit.Millimetre)
                    .BorderColor("#000000")
                    .Element(c => ComponerColumnaQr(c, etiqueta));
            });
    }

    private static void ComponerContenido(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        // Alturas fijas alineadas al layout de captura (logo 36px + tipografías tipadas).
        var headerH = LogoAltoMm + PbHeaderMm + Mm(2);
        var pacienteH = MtNombreMm + Mm(7.5f) + MbNombreMm;
        var metaH = Mm(14);
        var dietaH = Mm(18);
        var obsH = AltoMm
            - PadContenidoVMm * 2
            - headerH
            - pacienteH
            - metaH
            - dietaH
            - MtObsMm;

        container
            .PaddingVertical(PadContenidoVMm, Unit.Millimetre)
            .PaddingHorizontal(PadContenidoHMm, Unit.Millimetre)
            .Column(col =>
            {
                col.Item().Height(headerH, Unit.Millimetre).StopPaging()
                    .Element(c => ComponerEncabezado(c, etiqueta));

                col.Item().Height(pacienteH, Unit.Millimetre).StopPaging()
                    .PaddingTop(MtNombreMm, Unit.Millimetre)
                    .PaddingBottom(MbNombreMm, Unit.Millimetre)
                    .AlignMiddle()
                    .Text(Mayusculas(etiqueta.Paciente))
                    .FontSize(PtPaciente)
                    .Bold()
                    .LineHeight(1.15f)
                    .ClampLines(1);

                col.Item().Height(metaH, Unit.Millimetre).StopPaging().AlignMiddle()
                    .Element(c => ComponerMeta(c, etiqueta));

                col.Item().Height(dietaH, Unit.Millimetre).StopPaging()
                    .Element(c => ComponerDietaConsistencia(c, etiqueta));

                col.Item().PaddingTop(MtObsMm, Unit.Millimetre)
                    .Height(Math.Max(obsH, 1f), Unit.Millimetre).StopPaging()
                    .Element(c => ComponerObservaciones(c, etiqueta));
            });
    }

    private static void ComponerEncabezado(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        container
            .BorderBottom(BordeMm * 0.4f, Unit.Millimetre)
            .BorderColor("#d9d9d9")
            .PaddingBottom(PbHeaderMm, Unit.Millimetre)
            .Row(row =>
            {
                row.ConstantItem(LogoAnchoMaxMm, Unit.Millimetre)
                    .Height(LogoAltoMm, Unit.Millimetre)
                    .AlignMiddle()
                    .Image(LogoBytes)
                    .FitArea()
                    .WithRasterDpi(CapturaDpi)
                    .UseOriginalImage();

                row.RelativeItem().AlignRight().AlignMiddle().Column(col =>
                {
                    col.Item().AlignRight().Text(Mayusculas(etiqueta.Comida))
                        .FontSize(PtComida)
                        .Bold();
                    col.Item().AlignRight().PaddingTop(Mm(2), Unit.Millimetre)
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

            col.Item().PaddingTop(Mm(1.5f), Unit.Millimetre).Text(t =>
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
        container.Border(BordeMm, Unit.Millimetre).BorderColor("#000000").Row(row =>
        {
            row.RelativeItem().BorderRight(BordeMm, Unit.Millimetre).BorderColor("#000000")
                .PaddingVertical(PadDietaVMm, Unit.Millimetre)
                .PaddingHorizontal(PadDietaHMm, Unit.Millimetre)
                .Column(col =>
                {
                    col.Item().Text("DIETA:").FontSize(PtDietaLabel).Bold().FontColor("#1a1a1a");
                    col.Item().PaddingTop(Mm(1), Unit.Millimetre)
                        .Text(Mayusculas(Vacio(etiqueta.TipoDieta)))
                        .FontSize(PtDietaValor)
                        .Bold()
                        .LineHeight(1.2f)
                        .ClampLines(2);
                });

            row.RelativeItem()
                .PaddingVertical(PadDietaVMm, Unit.Millimetre)
                .PaddingHorizontal(PadDietaHMm, Unit.Millimetre)
                .Column(col =>
                {
                    col.Item().Text("CONSISTENCIA:").FontSize(PtDietaLabel).Bold().FontColor("#1a1a1a");
                    col.Item().PaddingTop(Mm(1), Unit.Millimetre)
                        .Text(Mayusculas(Vacio(etiqueta.Consistencia)))
                        .FontSize(PtDietaValor)
                        .Bold()
                        .LineHeight(1.2f)
                        .ClampLines(2);
                });
        });
    }

    private static void ComponerObservaciones(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        container
            .Border(BordeMm, Unit.Millimetre)
            .BorderColor("#000000")
            .PaddingVertical(PadObsVMm, Unit.Millimetre)
            .PaddingHorizontal(PadObsHMm, Unit.Millimetre)
            .Column(col =>
            {
                col.Item().Text("OBSERVACIONES")
                    .FontSize(PtObsLabel)
                    .Bold();
                col.Item().PaddingTop(Mm(3), Unit.Millimetre)
                    .Text(Mayusculas(Vacio(etiqueta.Observaciones)))
                    .FontSize(PtObsTexto)
                    .Bold()
                    .FontColor("#1a1a1a")
                    .LineHeight(1.3f)
                    .ClampLines(5);
            });
    }

    private static void ComponerColumnaQr(IContainer container, EtiquetaPdfModelo etiqueta)
    {
        var qrPng = GenerarQrPng(etiqueta.QrPayload);
        var fontCodigo = etiqueta.Codigo.Trim().Length > 28
            ? PtCodigoLargo
            : etiqueta.Codigo.Trim().Length > 22 ? PtCodigoMedio : PtCodigoCorto;

        var badgeH = BadgePadVMm * 2 + Mm(6);
        var codigoH = Mm(12);
        var padTop = PadBadgeTopMm;
        var padBottom = Mm(4);
        var qrAreaH = AltoMm - padTop - padBottom - badgeH - codigoH;

        container
            .PaddingTop(padTop, Unit.Millimetre)
            .PaddingBottom(padBottom, Unit.Millimetre)
            .PaddingHorizontal(PadQrHMm, Unit.Millimetre)
            .Column(col =>
            {
                col.Item().Height(badgeH, Unit.Millimetre).AlignCenter().AlignMiddle()
                    .Element(ComponerBadgeEscanear);

                col.Item().Height(Math.Max(qrAreaH, QrMm), Unit.Millimetre).AlignCenter().AlignMiddle()
                    .Element(e => e
                        .Width(QrMm, Unit.Millimetre)
                        .Height(QrMm, Unit.Millimetre)
                        .Image(qrPng)
                        .FitArea()
                        .WithRasterDpi(CapturaDpi)
                        .UseOriginalImage());

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
            .PaddingVertical(BadgePadVMm, Unit.Millimetre)
            .PaddingHorizontal(BadgePadHMm, Unit.Millimetre)
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
        // ~8192 px de lado como ETIQUETA_QR_RESolucion del frontend (cubrir 2400 dpi).
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
