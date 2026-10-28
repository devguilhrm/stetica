using System.Collections.Generic;
using System.Linq;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
namespace Stetica.Api
{
    public class SwaggerAuthorization : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var attributes = context.MethodInfo.GetCustomAttributes(true)
                .Concat(context.MethodInfo.DeclaringType!.GetCustomAttributes(true));
            var path = context.ApiDescription.RelativePath ?? "";
            var method = context.ApiDescription.HttpMethod;
            if (method == "POST" && path != "api/sessoes")
            {
                operation.Responses.Remove("200");
                operation.Responses["201"] = new OpenApiResponse { Description = "Registro criado. A resposta contém os dados/ID do registro." };
            }
            if (method == "PUT" || method == "DELETE")
            {
                operation.Responses.Remove("200");
                operation.Responses["204"] = new OpenApiResponse { Description = "Operação concluída, sem corpo de resposta." };
            }
            if (method == "POST" || method == "PUT")
                operation.Responses.TryAdd("400", new OpenApiResponse { Description = "Dados inválidos ou regra de cadastro não atendida." });
            if (path.Contains("{id}"))
                operation.Responses.TryAdd("404", new OpenApiResponse { Description = "Registro não encontrado ou inacessível ao cliente." });
            if (method != "GET")
                operation.Responses.TryAdd("409", new OpenApiResponse { Description = "Conflito de relacionamento, estoque ou situação do pedido." });
            operation.Responses.TryAdd("503", new OpenApiResponse { Description = "Banco de dados indisponível." });
            string? scheme = attributes.OfType<AdminAttribute>().Any() ? "AdminKey" : null;
            if (scheme == null && (path.StartsWith("api/meus-pedidos") ||
                (path == "api/pedidos" && method == "POST") || (path == "api/sessoes" && method == "DELETE")))
                scheme = "Bearer";
            if (scheme == null) return;
            operation.Security = new List<OpenApiSecurityRequirement>
            {
                new OpenApiSecurityRequirement
                {
                    [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = scheme } }] = new string[0]
                }
            };
            operation.Responses.TryAdd("401", new OpenApiResponse { Description = "Autenticação ausente ou inválida." });
        }
    }
}
