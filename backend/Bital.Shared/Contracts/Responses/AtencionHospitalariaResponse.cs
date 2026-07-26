namespace Bital.Shared.Contracts.Responses;

public class AtencionHospitalariaResponse
{
    public int IdIngreso { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string Cedula { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string Pabellon { get; set; } = string.Empty;
    public string Cama { get; set; } = string.Empty;
}
