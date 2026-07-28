using Bital.Application.Options;

namespace Bital.ApiNegocio.Extensions;

public static class AuthCookieExtensions
{
    public static void AppendAuthCookie(
        this HttpResponse response,
        string token,
        JwtOptions options,
        IWebHostEnvironment environment)
    {
        response.Cookies.Append(options.CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !environment.IsDevelopment(),
            SameSite = environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
            MaxAge = TimeSpan.FromMinutes(options.ExpirationMinutes),
            Path = "/",
        });
    }

    public static void DeleteAuthCookie(
        this HttpResponse response,
        JwtOptions options,
        IWebHostEnvironment environment)
    {
        response.Cookies.Delete(options.CookieName, new CookieOptions
        {
            Path = "/",
            Secure = !environment.IsDevelopment(),
            SameSite = environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict,
        });
    }
}
