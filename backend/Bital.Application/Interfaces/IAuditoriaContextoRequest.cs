namespace Bital.Application.Interfaces;

public interface IAuditoriaContextoRequest
{
    string? ObtenerDireccionIp();
    string? ObtenerUserAgent();
    string? ConstruirMetadataCliente();
}
