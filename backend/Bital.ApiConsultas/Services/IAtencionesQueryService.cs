using Bital.ApiConsultas.Contracts.Responses;

namespace Bital.ApiConsultas.Services;

/// <summary>
/// Servicio de consultas para atenciones hospitalarias
/// </summary>
public interface IAtencionesQueryService
{
    /// <summary>
    /// Obtiene todas las atenciones activas
    /// </summary>
    Task<IEnumerable<AtencionResponse>> GetAtencionesActivasAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene atenciones activas filtradas por servicio
    /// </summary>
    Task<IEnumerable<AtencionResponse>> GetAtencionesPorServicioAsync(
        string servicioId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene una atención por su ID
    /// </summary>
    Task<AtencionResponse?> GetAtencionPorIdAsync(
        int consecutivo,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene atenciones por número de documento del paciente
    /// </summary>
    Task<IEnumerable<AtencionResponse>> GetAtencionesPorPacienteAsync(
        string numeroDocumento,
        string tipoDocumento,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene atenciones hospitalarias activas para el módulo de Dietas
    /// Filtra por pabellones 3-7, sin fecha egreso, estado salida activo
    /// </summary>
    Task<IEnumerable<AtencionHospitalariaResponse>> GetAtencionesHospitalariasAsync(
        CancellationToken cancellationToken = default);
}
