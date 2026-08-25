namespace Bital.Infrastructure.DietasCocina;

internal sealed class EtiquetaPdfModelo
{
    public required string Codigo { get; init; }
    public required string QrPayload { get; init; }
    public required string Comida { get; init; }
    public required string FechaHora { get; init; }
    public required string Paciente { get; init; }
    public string? Ingreso { get; init; }
    public int Edad { get; init; }
    public required string DocumentoTitulo { get; init; }
    public required string DocumentoValor { get; init; }
    public required string Ubicacion { get; init; }
    public bool Aislamiento { get; init; }
    public required string TipoDieta { get; init; }
    public required string Consistencia { get; init; }
    public string? Observaciones { get; init; }
}
