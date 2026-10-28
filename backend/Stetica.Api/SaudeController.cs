using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace Stetica.Api
{
    [ApiController, Route("api/saude")]
    public class SaudeController : ControllerBase
    {
        private readonly SteticaContext db;
        public SaudeController(SteticaContext db) { this.db = db; }
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            await db.Categorias.CountAsync();
            return Ok(new { status = "ok", banco = "bd_stetica" });
        }
    }
}
