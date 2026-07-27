namespace Bital.Infrastructure.DietasCocina;

internal static class ArchivosUploadHelper
{
    private const string UploadRoot = "wwwroot/uploads";

    public static async Task<string> GuardarAsync(
        Stream contenido,
        string subcarpeta,
        string nombreArchivo,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(nombreArchivo);
        var nombreSeguro = $"{Guid.NewGuid():N}{extension}".ToLowerInvariant();
        var directorio = Path.Combine(Directory.GetCurrentDirectory(), UploadRoot, subcarpeta);
        Directory.CreateDirectory(directorio);

        var rutaFisica = Path.Combine(directorio, nombreSeguro);
        await using var salida = File.Create(rutaFisica);
        await contenido.CopyToAsync(salida, cancellationToken);

        return $"/uploads/{subcarpeta}/{nombreSeguro}";
    }
}
