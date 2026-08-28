using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Bital.ApiNegocio.Filters;

public sealed class ConflictoEstadoOperativoFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not Application.ConflictoEstadoOperativoException ex)
            return;

        context.Result = new ConflictObjectResult(new
        {
            error = ex.Message,
            estadoActual = ex.EstadoActual,
        });
        context.ExceptionHandled = true;
    }
}
