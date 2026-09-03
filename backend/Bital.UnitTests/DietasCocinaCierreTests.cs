using Bital.Application.DTOs.DietasCocina;
using Bital.Infrastructure.DietasCocina;

namespace Bital.UnitTests;

public class DietasCocinaCierreTests
{
    [Fact]
    public void Checklist_ObligatoriosCompletos_RechazaSiFaltan()
    {
        var checklist = ChecklistOperativoHelper.PlantillaInicial();
        Assert.False(ChecklistOperativoHelper.ObligatoriosCompletos(checklist));

        var actualizado = ChecklistOperativoHelper.AplicarActualizacion(
            checklist,
            [
                new ChecklistItemActualizarDto { Id = "ck-2", Completado = true },
                new ChecklistItemActualizarDto { Id = "ck-3", Completado = true },
            ]);

        Assert.True(ChecklistOperativoHelper.ObligatoriosCompletos(actualizado));
    }

    [Fact]
    public void CsvExportHelper_GeneraEncabezadosYFilas()
    {
        var csv = CsvExportHelper.Generar(
            [["a", "b"], ["c", "d"]],
            ["Col1", "Col2"]);

        var texto = System.Text.Encoding.UTF8.GetString(csv);
        Assert.Contains("Col1,Col2", texto);
        Assert.Contains("a,b", texto);
        Assert.Contains("c,d", texto);
    }

    [Fact]
    public void PdfEtiquetasHelper_CapturaDpi_CoincideConFrontend2400()
    {
        Assert.Equal(2400, PdfEtiquetasHelper.CapturaDpi);
        Assert.Equal(15874, PdfEtiquetasHelper.AnchoCapturaPx);
        Assert.Equal(8315, PdfEtiquetasHelper.AltoCapturaPx);
    }

    [Fact]
    public void PdfEtiquetasHelper_GeneraBytesPdfValidos()
    {
        var pdf = PdfEtiquetasHelper.Generar([PdfEtiquetasHelper.CrearEtiquetaPrueba()]);
        Assert.True(pdf.Length > 500);
        Assert.Equal((byte)'%', pdf[0]);
        Assert.Equal((byte)'P', pdf[1]);
        Assert.Equal((byte)'D', pdf[2]);
        Assert.Equal((byte)'F', pdf[3]);
        Assert.Equal(1, ContarPaginasPdf(pdf));
        Assert.Contains("%%EOF", System.Text.Encoding.ASCII.GetString(pdf));
    }

    [Fact]
    public void PdfEtiquetasHelper_VariasEtiquetas_UnaPaginaCadaUna()
    {
        var etiquetas = Enumerable.Range(0, 3)
            .Select(_ => PdfEtiquetasHelper.CrearEtiquetaPrueba())
            .ToList();
        var pdf = PdfEtiquetasHelper.Generar(etiquetas);
        Assert.Equal(3, ContarPaginasPdf(pdf));
    }

    [Fact]
    public void PdfEtiquetasHelper_DietaMuyLarga_SigueSiendoUnaPagina()
    {
        var baseEtiqueta = PdfEtiquetasHelper.CrearEtiquetaPrueba();
        var etiqueta = new EtiquetaPdfModelo
        {
            Codigo = baseEtiqueta.Codigo,
            QrPayload = baseEtiqueta.QrPayload,
            Comida = baseEtiqueta.Comida,
            FechaHora = baseEtiqueta.FechaHora,
            Paciente = "PACIENTE CON NOMBRE EXTREMADAMENTE LARGO PARA PROBAR TRUNCAMIENTO EN ETIQUETA TERMICA",
            Ingreso = baseEtiqueta.Ingreso,
            Edad = baseEtiqueta.Edad,
            DocumentoTitulo = baseEtiqueta.DocumentoTitulo,
            DocumentoValor = baseEtiqueta.DocumentoValor,
            Ubicacion = "HOSPITALIZACION PISO 3 - HABITACION 3HP19 ALA NORTE TORRE B",
            Aislamiento = baseEtiqueta.Aislamiento,
            TipoDieta = "NIÑOS DE 10 MESES EN ADELANTE CON SUPLEMENTO NUTRICIONAL ESPECIAL Y RESTRICCIONES MULTIPLES",
            Consistencia = "LICUADA ESPESA CON MODIFICACIONES DE TEXTURA SEGUN VALORACION",
            Observaciones =
                "Sin tomate, intolerancia leve a lácteos. Alergias: mariscos, maní, gluten y huevo. " +
                "Preferencias: sin cebolla cruda. Notas de enfermería adicionales para prueba de overflow.",
        };

        var pdf = PdfEtiquetasHelper.Generar([etiqueta]);
        Assert.Equal(1, ContarPaginasPdf(pdf));
    }

    /// <summary>Cuenta páginas usando PDFsharp (fiable en PDF raster y vectorial).</summary>
    private static int ContarPaginasPdf(byte[] pdfBytes)
    {
        using var ms = new System.IO.MemoryStream(pdfBytes);
        var doc = PdfSharp.Pdf.IO.PdfReader.Open(ms, PdfSharp.Pdf.IO.PdfDocumentOpenMode.Import);
        return doc.PageCount;
    }
}
