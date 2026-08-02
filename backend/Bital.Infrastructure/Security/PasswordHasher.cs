using System.Security.Cryptography;
using System.Text;

namespace Bital.Infrastructure.Security;

/// <summary>
/// Hash de contraseñas con PBKDF2 (producción). Compatible con hashes legacy SHA-256 hex.
/// </summary>
public static class PasswordHasher
{
    private const int Pbkdf2Iterations = 100_000;
    private const int SaltSize = 16;
    private const int KeySize = 32;
    private const string Pbkdf2Prefix = "pbkdf2";

    public static string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            Pbkdf2Iterations,
            HashAlgorithmName.SHA256,
            KeySize);

        return $"{Pbkdf2Prefix}${Pbkdf2Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public static bool Verify(string password, string storedHash)
    {
        if (string.IsNullOrEmpty(storedHash))
            return false;

        if (storedHash.StartsWith($"{Pbkdf2Prefix}$", StringComparison.Ordinal))
            return VerifyPbkdf2(password, storedHash);

        return VerifyLegacySha256(password, storedHash);
    }

    public static bool EsHashLegacy(string storedHash) =>
        !string.IsNullOrEmpty(storedHash) &&
        !storedHash.StartsWith($"{Pbkdf2Prefix}$", StringComparison.Ordinal);

    private static bool VerifyPbkdf2(string password, string storedHash)
    {
        var parts = storedHash.Split('$');
        if (parts.Length != 4 ||
            !parts[0].Equals(Pbkdf2Prefix, StringComparison.Ordinal) ||
            !int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        byte[] salt;
        byte[] expected;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expected = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password,
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expected.Length);

        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static bool VerifyLegacySha256(string password, string storedHash)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        var computed = Convert.ToHexString(bytes);
        return FixedTimeEqualsHex(computed, storedHash);
    }

    private static bool FixedTimeEqualsHex(string a, string b)
    {
        if (a.Length != b.Length)
            return false;

        var diff = 0;
        for (var i = 0; i < a.Length; i++)
        {
            diff |= char.ToUpperInvariant(a[i]) ^ char.ToUpperInvariant(b[i]);
        }

        return diff == 0;
    }
}
