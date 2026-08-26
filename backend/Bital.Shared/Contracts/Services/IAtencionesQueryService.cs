using Bital.Shared.Contracts.Responses;

namespace Bital.Shared.Contracts.Services;

public interface IAtencionesQueryService
{
    Task<IEnumerable<AtencionResponse>> GetAtencionesActivasAsync(CancellationToken cancellationToken = default);

    Task<IEnumerable<AtencionResponse>> GetAtencionesPorServicioAsync(
        string servicioId,
        CancellationToken cancellationToken = default);

    Task<AtencionResponse?> GetAtencionPorIdAsync(
        int consecutivo,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<AtencionResponse>> GetAtencionesPorPacienteAsync(
        string numeroDocumento,
        string tipoDocumento,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<AtencionHospitalariaResponse>> GetAtencionesHospitalariasAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Pacientes cuyo ingreso HIS tiene IngInSlC = 'S' (salida clínica).
    /// Única señal válida para cancelar dietas por egreso.
    /// </summary>
    Task<SalidaClinicaHisLookup> ObtenerPacientesConSalidaClinicaAsync(
        IEnumerable<IdentidadIngresoHis> pacientes,
        CancellationToken cancellationToken = default);

    Task<IEnumerable<EncuestaCapturaPresencialResponse>> GetCapturaPresencialAsync(
        string? servicio = null,
        string? pabellon = null,
        string? estado = null,
        string? busqueda = null,
        CancellationToken cancellationToken = default);
}