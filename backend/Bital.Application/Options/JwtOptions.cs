namespace Bital.Application.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;

    public string Issuer { get; set; } = "Bital.ApiNegocio";

    public string Audience { get; set; } = "Bital.Frontend";

    public int ExpirationMinutes { get; set; } = 480;

    public string CookieName { get; set; } = "bital_access_token";
}
