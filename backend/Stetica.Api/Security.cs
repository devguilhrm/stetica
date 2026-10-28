using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Stetica.Api
{
    public static class Security
    {
        public static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        public static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(16);
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 210000, HashAlgorithmName.SHA256, 32);
            return Convert.ToBase64String(salt) + ":" + Convert.ToBase64String(hash);
        }
        public static bool VerifyPassword(string password, string? stored)
        {
            if (string.IsNullOrWhiteSpace(stored)) return false;
            var parts = stored.Split(':');
            var hash = Rfc2898DeriveBytes.Pbkdf2(password, Convert.FromBase64String(parts[0]), 210000, HashAlgorithmName.SHA256, 32);
            return CryptographicOperations.FixedTimeEquals(hash, Convert.FromBase64String(parts[1]));
        }
        public static async Task<int?> Customer(ControllerBase controller, SteticaContext db)
        {
            var header = controller.Request.Headers["Authorization"].ToString();
            if (!header.StartsWith("Bearer ", StringComparison.Ordinal)) return null;
            var hash = HashToken(header.Substring(7));
            return await (from s in db.Sessoes join p in db.Pessoas on s.PessoaId equals p.Id
                          where s.TokenHash == hash && s.ExpiraEm > DateTime.UtcNow && p.Ativo
                          select (int?)p.Id).FirstOrDefaultAsync();
        }
    }
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AdminAttribute : Attribute, IAsyncActionFilter
    {
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var expected = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>()["Admin:Key"] ?? "";
            var supplied = context.HttpContext.Request.Headers["X-Admin-Key"].ToString();
            if (expected.Length < 16 || !CryptographicOperations.FixedTimeEquals(
                SHA256.HashData(Encoding.UTF8.GetBytes(expected)), SHA256.HashData(Encoding.UTF8.GetBytes(supplied))))
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Chave administrativa inválida." });
                return;
            }
            await next();
        }
    }
}
