using Bital.Application.Interfaces;
using Bital.Domain.Enums;
using Bital.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Bital.Infrastructure.Services;

public class PermisosOperativosService : IPermisosOperativosService
{
    private static readonly RutaDietas[] RutasConsultaEtiquetas =
    [
        RutaDietas.ListarEtiquetas,
        RutaDietas.ImprimirEtiquetas,
        RutaDietas.RecepcionProveedor,
        RutaDietas.EntregaPaciente,
        RutaDietas.RechazoAntesEntrega,
        RutaDietas.RecogidaBandeja,
        RutaDietas.VerBandejasPiso,
    ];

    private readonly BitalNegocioDbContext _context;

    public PermisosOperativosService(BitalNegocioDbContext context)
    {
        _context = context;
    }

    public async Task<bool> UsuarioTieneRutaAsync(
        Guid rolModuloId,
        RutaDietas ruta,
        CancellationToken cancellationToken = default)
    {
        return await _context.PermisosRol.AnyAsync(
            p => p.RolModuloId == rolModuloId && p.Ruta == ruta && p.Permitido,
            cancellationToken);
    }

    public async Task VerificarRutaAsync(
        Guid rolModuloId,
        RutaDietas ruta,
        CancellationToken cancellationToken = default)
    {
        if (!await UsuarioTieneRutaAsync(rolModuloId, ruta, cancellationToken))
        {
            throw new UnauthorizedAccessException(
                $"No tiene permiso para ejecutar la operación de etiquetas ({(int)ruta}).");
        }
    }

    public async Task VerificarConsultaEtiquetasAsync(
        Guid rolModuloId,
        CancellationToken cancellationToken = default)
    {
        var puede = await _context.PermisosRol.AnyAsync(
            p => p.RolModuloId == rolModuloId
                 && p.Permitido
                 && RutasConsultaEtiquetas.Contains(p.Ruta),
            cancellationToken);

        if (!puede)
        {
            throw new UnauthorizedAccessException(
                "No tiene permiso para consultar etiquetas de bandejas.");
        }
    }
}
