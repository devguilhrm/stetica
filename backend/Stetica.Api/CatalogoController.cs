using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace Stetica.Api
{
 [ApiController, Route("api")]
 public class CatalogoController : ControllerBase
 {
  private readonly SteticaContext db;
  public CatalogoController(SteticaContext db) { this.db = db; }
  [HttpGet("categorias")]
  public async Task<IActionResult> Categories() => Ok(await db.Categorias.OrderBy(c => c.Nome).ToListAsync());
  [HttpGet("categorias/{id:int}")]
  public async Task<IActionResult> Category(int id) { var c = await db.Categorias.FindAsync(id); return c == null ? (IActionResult)NotFound() : Ok(c); }
  [Admin, HttpPost("categorias")]
  public async Task<IActionResult> CreateCategory(CategoriaInput x)
  {
   var c = new Categoria { Nome = x.Nome.Trim() }; db.Categorias.Add(c); await db.SaveChangesAsync(); return Created("/api/categorias/" + c.Id,c);
  }
  [Admin, HttpPut("categorias/{id:int}")]
  public async Task<IActionResult> UpdateCategory(int id, CategoriaInput x)
  {
   var c = await db.Categorias.FindAsync(id); if (c == null) return NotFound(); c.Nome = x.Nome.Trim(); await db.SaveChangesAsync(); return NoContent();
  }
  [Admin, HttpDelete("categorias/{id:int}")]
  public async Task<IActionResult> DeleteCategory(int id)
  {
   var c = await db.Categorias.FindAsync(id); if (c == null) return NotFound();
   if (await db.Itens.AnyAsync(i => i.CategoriaId == id)) return Conflict(new { message = "Categoria vinculada a itens; exclusão não permitida." });
   db.Categorias.Remove(c); await db.SaveChangesAsync(); return NoContent();
  }
  private IQueryable<object> Catalog(string? busca, int? categoriaId, string? tipo, bool all, int? id = null)
  {
   return from i in db.Itens join c in db.Categorias on i.CategoriaId equals c.Id
          join product in db.Produtos on i.Id equals product.Id into products from p in products.DefaultIfEmpty()
          join stock in db.Estoques on i.Id equals stock.Id into stocks from s in stocks.DefaultIfEmpty()
          where (all || i.Ativo) && (id == null || i.Id == id) && (string.IsNullOrEmpty(busca) || i.Nome.Contains(busca)) && (categoriaId == null || i.CategoriaId == categoriaId) && (string.IsNullOrEmpty(tipo) || i.Tipo == tipo)
          orderby i.Nome
          select (object)new { i.Id, i.Nome, i.Descricao, i.CategoriaId, Categoria = c.Nome, i.Tipo, i.Ativo, Preco = p == null ? i.Preco : p.PrecoVenda, PrecoCusto = i.Preco, CodigoPreco = p == null ? 1 : p.CodigoPreco, Unidade = p == null ? "" : p.Unidade, Estoque = s == null ? 0 : s.Quantidade };
  }
  [HttpGet("itens")]
  public async Task<IActionResult> Items(string? busca, int? categoriaId, string? tipo) => Ok(await Catalog(busca,categoriaId,tipo,false).ToListAsync());
  [HttpGet("itens/{id:int}")]
  public async Task<IActionResult> Item(int id)
  {
   var x = await Catalog(null,null,null,false,id).FirstOrDefaultAsync(); return x == null ? (IActionResult)NotFound() : Ok(x);
  }
  [Admin, HttpGet("admin/itens")]
  public async Task<IActionResult> AllItems() => Ok(await Catalog(null,null,null,true).ToListAsync());
  [Admin, HttpPost("itens")]
  public async Task<IActionResult> Create(ItemInput x)
  {
   if (!await db.Categorias.AnyAsync(c => c.Id == x.CategoriaId)) return BadRequest(new { message = "Categoria não encontrada." });
   await using (var tx = await db.Database.BeginTransactionAsync())
   {
    var i = new Item(); Apply(i,x); db.Itens.Add(i); await db.SaveChangesAsync();
    if (x.Tipo == "P")
    {
     // O trigger de produto cria o estoque inicial. A função SQL define o preço de venda.
     db.Produtos.Add(new Produto { Id = i.Id, CodigoPreco = x.CodigoPreco, PrecoVenda = await SalePrice(x.Preco,x.CodigoPreco), Unidade = x.Unidade });
     await db.SaveChangesAsync();
    }
    await tx.CommitAsync(); return Created("/api/itens/" + i.Id,new { i.Id });
   }
  }
  private async Task<decimal> SalePrice(decimal cost,int code) => await db.Database.SqlQuery<decimal>($"SELECT fn_calc_preco_venda({code}, {cost}) AS `Value`").SingleAsync();
  private static void Apply(Item i,ItemInput x) { i.Nome=x.Nome.Trim(); i.Descricao=x.Descricao; i.CategoriaId=x.CategoriaId; i.Tipo=x.Tipo; i.Preco=x.Preco; i.Ativo=x.Ativo; }
  [Admin, HttpPut("itens/{id:int}")]
  public async Task<IActionResult> Update(int id,ItemInput x)
  {
   var i = await db.Itens.FindAsync(id); if (i == null) return NotFound();
   if (i.Tipo != x.Tipo) return BadRequest(new { message = "O tipo de um item existente não pode mudar." });
   if (!await db.Categorias.AnyAsync(c => c.Id == x.CategoriaId)) return BadRequest(new { message = "Categoria não encontrada." });
   Apply(i,x); if (i.Tipo == "P") { var p = await db.Produtos.FindAsync(id); p!.CodigoPreco=x.CodigoPreco; p.Unidade=x.Unidade; p.PrecoVenda=await SalePrice(x.Preco,x.CodigoPreco); }
   await db.SaveChangesAsync(); return NoContent();
  }
  [Admin, HttpDelete("itens/{id:int}")]
  public async Task<IActionResult> Disable(int id) { var i=await db.Itens.FindAsync(id); if(i==null)return NotFound(); i.Ativo=false;await db.SaveChangesAsync();return NoContent(); }
  private IQueryable<object> Stock(int? id = null) => from s in db.Estoques join i in db.Itens on s.Id equals i.Id join p in db.Produtos on i.Id equals p.Id join c in db.Categorias on i.CategoriaId equals c.Id where id == null || i.Id == id select (object)new { i.Id, i.Nome, i.Descricao, i.Preco, p.PrecoVenda, p.Unidade, Categoria=c.Nome, s.Quantidade, i.Ativo };
  [Admin, HttpGet("estoque")]
  public async Task<IActionResult> Stocks() => Ok(await Stock().ToListAsync());
  [Admin, HttpGet("estoque/{id:int}")]
  public async Task<IActionResult> StockById(int id) { var x=await Stock(id).FirstOrDefaultAsync();return x==null?(IActionResult)NotFound():Ok(x); }
  [Admin, HttpGet("entradaprodutos")]
  public async Task<IActionResult> Entries() => Ok(await db.Entradas.OrderByDescending(e=>e.Id).ToListAsync());
  [Admin, HttpGet("entradaprodutos/{id:int}")]
  public async Task<IActionResult> Entry(int id) { var e=await db.Entradas.FindAsync(id);return e==null?(IActionResult)NotFound():Ok(e); }
  [Admin, HttpPost("entradaprodutos")]
  public async Task<IActionResult> CreateEntry(EntradaInput x)
  {
   if(x.Data < new DateTime(1900,1,1) || x.Data.Date > DateTime.Today) return BadRequest(new {message="Data de entrada inválida."});
   if(!await db.Itens.AnyAsync(i=>i.Id==x.ProdutoId && i.Tipo=="P" && i.Ativo))return BadRequest(new {message="Produto ativo não encontrado."});
   var e = new Entrada { ProdutoId=x.ProdutoId,Data=x.Data.Date,Quantidade=x.Quantidade,ValorUnitario=x.ValorUnitario };
   // Um único INSERT e seu trigger constituem uma operação atômica no InnoDB.
   db.Entradas.Add(e);await db.SaveChangesAsync();return Created("/api/entradaprodutos/"+e.Id,e);
  }
  [Admin, HttpGet("resumo")]
  public async Task<IActionResult> Summary() => Ok(new { Clientes=await db.Pessoas.CountAsync(p=>p.SenhaHash!=null && p.Ativo), Produtos=await db.Itens.CountAsync(i=>i.Tipo=="P" && i.Ativo), Servicos=await db.Itens.CountAsync(i=>i.Tipo=="S" && i.Ativo), Pedidos=await db.Pedidos.CountAsync(), Abertos=await db.Pedidos.CountAsync(p=>p.Status=="Aberto"), Unidades=await db.Estoques.SumAsync(e=>(int?)e.Quantidade)??0 });
 }
}
