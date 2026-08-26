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

/// <summary>
/// Identidad HIS para consultar salida clínica (INGRESOS.IngInSlC).
/// </summary>
public sealed class IdentidadIngresoHis
{
    public string TipoDocumento { get; init; } = string.Empty;
    public string Cedula { get; init; } = string.Empty;
    public int? IdIngreso { get; init; }
}

/// <summary>
/// Pacientes/ingresos con IngInSlC = 'S' en INGRESOS.
/// </summary>
public sealed class SalidaClinicaHisLookup
{
    /// <summary>
    /// `INGRESOS.IngCsc` es un consecutivo <b>por paciente</b> (1, 2, 3…), no un id
    /// global: solo identifica un ingreso junto con el documento. Se guarda como
    /// «TipoDoc-Cédula#IngCsc» para no confundir pacientes distintos.
    /// </summary>
    public HashSet<string> IngresosPorPaciente { get; } = new(StringComparer.OrdinalIgnoreCase);

    public HashSet<string> PacienteIds { get; } = new(StringComparer.OrdinalIgnoreCase);

    public static string ClaveIngreso(string? tipoDocumento, string? cedula, int idIngreso) =>
        $"{(tipoDocumento ?? string.Empty).Trim()}-{(cedula ?? string.Empty).Trim()}#{idIngreso}";

    public void AgregarIngreso(string? tipoDocumento, string? cedula, int idIngreso)
    {
        if (idIngreso <= 0) return;
        if (string.IsNullOrWhiteSpace(tipoDocumento) && string.IsNullOrWhiteSpace(cedula)) return;
        IngresosPorPaciente.Add(ClaveIngreso(tipoDocumento, cedula, idIngreso));
    }

    public void AgregarPaciente(string? tipoDocumento, string? cedula)
    {
        var clave = $"{tipoDocumento?.Trim()}-{cedula?.Trim()}";
        if (clave.Length > 1) PacienteIds.Add(clave);
    }

    public bool Coincide(int? idIngreso, string? tipoDocumento, string? cedula, string? pacienteId)
    {
        if (!string.IsNullOrWhiteSpace(pacienteId) && PacienteIds.Contains(pacienteId))
            return true;

        var clave = $"{tipoDocumento?.Trim()}-{cedula?.Trim()}";
        if (clave.Length > 1 && PacienteIds.Contains(clave))
            return true;

        return idIngreso is > 0
            && IngresosPorPaciente.Contains(ClaveIngreso(tipoDocumento, cedula, idIngreso.Value));
    }
}
