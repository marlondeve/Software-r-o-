using Bital.Application.DTOs.DietasCocina;
using Bital.Shared.Contracts.Responses;

namespace Bital.Infrastructure.DietasCocina;

/// <summary>
/// Pacientes sintéticos para Development (prefijo DEVSEED) cuando Vital tiene pocos hospitalizados.
/// </summary>
internal static class DevHospitalizadosSeed
{
    public const string PrefijoCedula = "90000";
    public const string PrefijoPacienteId = "CC-90000";

    public static IReadOnlyList<AtencionHospitalariaResponse> Crear(int cantidad)
    {
        if (cantidad <= 0) return [];

        var lista = new List<AtencionHospitalariaResponse>(cantidad);
        for (var i = 1; i <= cantidad; i++)
        {
            var cedula = $"{PrefijoCedula}{i:000}";
            lista.Add(new AtencionHospitalariaResponse
            {
                IdIngreso = 910_000 + i,
                TipoDocumento = "CC",
                Cedula = cedula,
                NombreCompleto = $"PACIENTE PRUEBA {i:00}, SEED",
                Pabellon = "HOSPITALIZACION PISO 3",
                Cama = $"3HP{i:00}",
            });
        }

        return lista;
    }

    public static bool EsPacienteSeed(string? pacienteId) =>
        !string.IsNullOrWhiteSpace(pacienteId)
        && pacienteId.StartsWith(PrefijoPacienteId, StringComparison.OrdinalIgnoreCase);

    public static List<ChecklistItemDto> ChecklistCompleto()
    {
        var items = ChecklistOperativoHelper.PlantillaInicial();
        foreach (var item in items)
            item.Completado = true;
        return items;
    }
}
