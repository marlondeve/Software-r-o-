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
    public void PdfEtiquetasHelper_GeneraBytesPdfValidos()
    {
        var pdf = PdfEtiquetasHelper.Generar(["Etiqueta prueba", "Paciente: Test"]);
        var texto = System.Text.Encoding.ASCII.GetString(pdf);
        Assert.StartsWith("%PDF-1.4", texto);
        Assert.Contains("%%EOF", texto);
    }
}
