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
        string? datosAntes = null,
        string? datosDespues = null,
        string? metadata = null,
        string? error = null,
        IAuditoriaContextoRequest? contexto = null)
    {
        if (auditoria == null)
        {
            return;
        }

        var ip = contexto?.ObtenerDireccionIp();
        var metadataFinal = metadata ?? contexto?.ConstruirMetadataCliente();

        _ = Task.Run(async () =>
        {
            try
            {
                await auditoria.RegistrarEventoAsync(
                    modulo,
                    accion,
                    string.IsNullOrWhiteSpace(error) ? AuditoriaCatalogo.Resultados.Exitoso : AuditoriaCatalogo.Resultados.Fallido,
                    usuario,
                    entidad,
                    entidadId,
                    datosAntes,
                    datosDespues,
                    metadataFinal,
                    error,
                    null,
                    ip);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "No se pudo registrar auditoría {Modulo}/{Accion}", modulo, accion);
            }
        });
    }

    public static void RegistrarFalloSilencioso(
        IAuditoriaService? auditoria,
        ILogger logger,
        string modulo,
        string accion,
        string usuario,
        string? entidad,
        Guid? entidadId,
        Exception ex,
        IAuditoriaContextoRequest? contexto = null,
        string? datosAntes = null)
    {
        RegistrarSilencioso(
            auditoria,
            logger,
            modulo,
            accion,
            usuario,
            entidad,
            entidadId,
            datosAntes,
            null,
            null,
            ex.Message,
            contexto);
    }
}
