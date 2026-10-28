using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;

namespace Stetica.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var connection = builder.Configuration.GetConnectionString("Stetica");
            if (string.IsNullOrWhiteSpace(connection))
                throw new InvalidOperationException("Configure ConnectionStrings:Stetica via dotnet user-secrets ou variável de ambiente.");
            var adminKey = builder.Configuration["Admin:Key"];
            if (string.IsNullOrWhiteSpace(adminKey) || adminKey.Length < 16)
                throw new InvalidOperationException("Configure Admin:Key com pelo menos 16 caracteres.");
            builder.Services.AddDbContext<SteticaContext>(o => o.UseMySql(connection,
                new MySqlServerVersion(new Version(8, 0, 0))));
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(o =>
            {
                o.SwaggerDoc("v1", new OpenApiInfo { Title = "Stetica API", Version = "v1", Description = "API acadêmica de produtos, serviços, clientes, estoque e pedidos. Autorização administrativa por X-Admin-Key e clientes por Bearer token." });
                o.AddSecurityDefinition("AdminKey", new OpenApiSecurityScheme { Type = SecuritySchemeType.ApiKey, In = ParameterLocation.Header, Name = "X-Admin-Key", Description = "Use a chave configurada em Admin:Key na sua API." });
                o.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", Description = "Cadastre ou autentique um cliente e cole apenas o token retornado, sem o prefixo Bearer." });
                o.OperationFilter<SwaggerAuthorization>();
            });
            builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
                .WithOrigins(builder.Configuration["FrontendOrigin"] ?? "http://localhost:4200")
                .AllowAnyHeader().AllowAnyMethod()));
            var app = builder.Build();
            app.Use(async (context, next) =>
            {
                try { await next(); }
                catch (DbUpdateException)
                {
                    context.Response.StatusCode = 409;
                    await context.Response.WriteAsJsonAsync(new { message = "Operação recusada: dados duplicados, relacionamento inválido ou estoque indisponível." });
                }
                catch (Exception ex) when (ex is MySqlConnector.MySqlException || ex is System.Data.Common.DbException)
                {
                    context.Response.StatusCode = 503;
                    await context.Response.WriteAsJsonAsync(new { message = "Banco indisponível. Verifique a conexão e a importação do script SQL." });
                }
            });
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(o =>
                {
                    o.SwaggerEndpoint("/swagger/v1/swagger.json", "Stetica API v1");
                    o.DocumentTitle = "Stetica · Swagger";
                });
            }
            app.UseCors();
            app.MapControllers();
            app.Run();
        }
    }
}
