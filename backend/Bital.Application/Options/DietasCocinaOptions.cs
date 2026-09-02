namespace Bital.Application.Options;

/// <summary>
/// Opciones del módulo Dietas-Cocina (URL pública del front para el QR de etiquetas).
/// </summary>
public class DietasCocinaOptions
{
    public const string SectionName = "DietasCocina";

    /// <summary>
    /// Origen del frontend (p. ej. https://riosoft.clinicadelrio.org o :8080) para el payload del QR.
    /// Si está vacío se usa el primer origen CORS.
    /// </summary>
    public string FrontendPublicUrl { get; set; } = string.Empty;

    /// <summary>
    /// En Development: agrega N pacientes sintéticos al censo (Vital suele tener pocos).
    /// 0 = desactivado.
    /// </summary>
    public int DevSeedHospitalizadosCount { get; set; }

    /// <summary>
    /// Intervalo del sync HIS en servidor. Mínimo efectivo 5 s. 0 desactiva el hosted service.
    /// </summary>
    public int CensoHisSyncIntervalSeconds { get; set; } = 15;
}
