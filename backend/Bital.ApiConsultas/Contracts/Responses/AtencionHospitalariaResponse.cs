namespace Bital.ApiConsultas.Contracts.Responses;

/// <summary>
/// Respuesta específica para el módulo de Dietas con atenciones hospitalarias activas
/// </summary>
public class AtencionHospitalariaResponse
{
    /// <summary>
    /// ID único del ingreso/atención (consecutivo)
    /// </summary>
    public int IdIngreso { get; set; }

    /// <summary>
    /// Tipo de documento del paciente (CC, TI, etc.)
    /// </summary>
    public string TipoDocumento { get; set; } = string.Empty;

    /// <summary>
    /// Número de cédula del paciente
    /// </summary>
    public string Cedula { get; set; } = string.Empty;

    /// <summary>
    /// Nombre completo del paciente
    /// </summary>
    public string NombreCompleto { get; set; } = string.Empty;

    /// <summary>
    /// Nombre del pabellón
    /// </summary>
    public string Pabellon { get; set; } = string.Empty;

    /// <summary>
    /// Número de cama asignada
    /// </summary>
    public string Cama { get; set; } = string.Empty;
}
