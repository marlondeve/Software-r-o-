using System.Collections.Generic;
using System.Threading.Tasks;
using Bital.Application.DTOs.DietasCocina;

namespace Bital.Application.Interfaces;

public interface IParametrosService
{
    /// <summary>
    /// Obtiene la configuración de tiempos de comida
    /// </summary>
    Task<TiemposComidaConfiguracionDto> ObtenerTiemposComidaAsync();

    /// <summary>
    /// Actualiza la configuración de tiempos de comida
    /// </summary>
    Task<TiemposComidaConfiguracionDto> ActualizarTiemposComidaAsync(ActualizarTiemposComidaDto dto);

    /// <summary>
    /// Obtiene las categorías de edad configuradas
    /// </summary>
    Task<List<CategoriaEdadDto>> ObtenerCategoriasEdadAsync();

    /// <summary>
    /// Actualiza las categorías de edad
    /// </summary>
    Task<List<CategoriaEdadDto>> ActualizarCategoriasEdadAsync(ActualizarCategoriasEdadDto dto);

    /// <summary>
    /// Clasifica un paciente según su edad en una categoría
    /// </summary>
    Task<ClasificarEdadResponseDto> ClasificarEdadAsync(int edad);
}
