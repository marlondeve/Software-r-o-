namespace Bital.Application;

/// <summary>
/// Otro usuario ya cambió el estado. HTTP 409: no crear duplicados.
/// </summary>
public class ConflictoEstadoOperativoException : InvalidOperationException
{
    public ConflictoEstadoOperativoException(string message, object? estadoActual = null)
        : base(message)
    {
        EstadoActual = estadoActual;
    }

    public object? EstadoActual { get; }
}
