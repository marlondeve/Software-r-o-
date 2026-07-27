using Bital.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Bital.Infrastructure.DietasCocina;

internal static class AuditoriaOperativaHelper
{
    public static void RegistrarSilencioso(
        IAuditoriaService? auditoria,
        ILogger logger,
        string modulo,
        string accion,
        string usuario,
        string? entidad,
        Guid? entidadId,
        string? datosDespues = null,
        string? error = null)
    {
        if (auditoria == null)
        {
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                await auditoria.RegistrarEventoAsync(
                    modulo,
                    accion,
                    string.IsNullOrWhiteSpace(error) ? "Exitoso" : "Fallido",
                    usuario,
                    entidad,
                    entidadId,
                    null,
                    datosDespues,
                    null,
                    error,
                    null,
                    null);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "No se pudo registrar auditoría {Modulo}/{Accion}", modulo, accion);
            }
        });
    }
}
