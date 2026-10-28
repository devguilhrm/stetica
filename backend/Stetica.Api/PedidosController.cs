using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace Stetica.Api
{
 [ApiController,Route("api")]
 public class PedidosController : ControllerBase
 {
  private readonly SteticaContext db;
  public PedidosController(SteticaContext db) { this.db=db; }
  private async Task<object?> Detail(int id,int? customer=null)
  {
   var p=await db.Pedidos.FirstOrDefaultAsync(p=>p.Id==id && (customer==null || p.PessoaId==customer));
   if(p==null)return null;
   var cliente=await db.Pessoas.Where(c=>c.Id==p.PessoaId).Select(c=>new{c.Id,c.Nome}).FirstAsync();
   var itens=await (from l in db.PedidoItens join i in db.Itens on l.ItemId equals i.Id join f in db.Funcionarios on l.FuncionarioId equals f.Id join pessoa in db.Pessoas on f.Id equals pessoa.Id where l.PedidoId==id select new { l.ItemId,i.Nome,i.Tipo,l.Quantidade,l.ValorUnitario,l.FuncionarioId,Funcionario=pessoa.Nome,f.Cargo }).ToListAsync();
   return new {p.Id,p.PessoaId,Cliente=cliente.Nome,p.Data,p.Status,p.Total,Itens=itens};
  }
  [HttpPost("pedidos")]
  public async Task<IActionResult> Create(PedidoInput x)
  {
   var customer=await Security.Customer(this,db);if(customer==null)return Unauthorized();
   if(x.Itens.Select(l=>l.ItemId).Distinct().Count()!=x.Itens.Count)return BadRequest(new{message="Agrupe itens repetidos em uma única linha."});
   await using(var tx=await db.Database.BeginTransactionAsync())
   {
    var p=new Pedido{PessoaId=customer.Value,Data=DateTime.UtcNow,Status="Aberto"};
    db.Pedidos.Add(p);await db.SaveChangesAsync();
    // Ordem estável reduz impasses quando dois pedidos disputam os mesmos produtos.
    foreach(var l in x.Itens.OrderBy(l=>l.ItemId))
    {
     var i=await db.Itens.AsNoTracking().FirstOrDefaultAsync(i=>i.Id==l.ItemId && i.Ativo);
     if(i==null)return BadRequest(new{message="Item inativo ou inexistente."});
     if(!await (from f in db.Funcionarios join pessoa in db.Pessoas on f.Id equals pessoa.Id where f.Id==l.FuncionarioId && pessoa.Ativo select f.Id).AnyAsync())return BadRequest(new{message="Funcionário ativo não encontrado."});
     if(i.Tipo=="S" && l.Quantidade!=1)return BadRequest(new{message="Cada serviço deve ter quantidade 1."});
     var value=i.Tipo=="P"?await db.Produtos.Where(v=>v.Id==i.Id).Select(v=>v.PrecoVenda).FirstAsync():i.Preco;
     p.Total+=value*l.Quantidade;
     if(p.Total>99999999.99m)return BadRequest(new{message="Valor total excede o limite do pedido."});
     db.PedidoItens.Add(new PedidoItem{PedidoId=p.Id,ItemId=i.Id,FuncionarioId=l.FuncionarioId,Quantidade=l.Quantidade,ValorUnitario=value});
    }
    // O trigger debita o estoque com bloqueio e rejeita saldo insuficiente.
    await db.SaveChangesAsync();await tx.CommitAsync();return Created("/api/meus-pedidos/"+p.Id,await Detail(p.Id,customer));
   }
  }
  [HttpGet("meus-pedidos")]
  public async Task<IActionResult> OwnOrders()
  {
   var customer=await Security.Customer(this,db);if(customer==null)return Unauthorized();
   return Ok(await db.Pedidos.Where(p=>p.PessoaId==customer).OrderByDescending(p=>p.Id).ToListAsync());
  }
  [HttpGet("meus-pedidos/{id:int}")]
  public async Task<IActionResult> OwnOrder(int id)
  {
   var customer=await Security.Customer(this,db);if(customer==null)return Unauthorized();
   var x=await Detail(id,customer);return x==null?(IActionResult)NotFound():Ok(x);
  }
  [Admin,HttpGet("pessoas/{id:int}/pedidos")]
  public async Task<IActionResult> CustomerOrders(int id)
  {
   if(!await db.Pessoas.AnyAsync(p=>p.Id==id))return NotFound();return Ok(await db.Pedidos.Where(p=>p.PessoaId==id).ToListAsync());
  }
  [Admin,HttpGet("pedidos")]
  public async Task<IActionResult> Orders(string? status) => Ok(await (from p in db.Pedidos join c in db.Pessoas on p.PessoaId equals c.Id where status==null || p.Status==status orderby p.Id descending select new {p.Id,p.PessoaId,Cliente=c.Nome,p.Data,p.Status,p.Total}).ToListAsync());
  [Admin,HttpGet("pedidos/{id:int}")]
  public async Task<IActionResult> Order(int id) {var x=await Detail(id);return x==null?(IActionResult)NotFound():Ok(x);}
  [Admin,HttpPut("pedidos/{id:int}/status")]
  public async Task<IActionResult> Status(int id,StatusInput x)
  {
   await using(var tx=await db.Database.BeginTransactionAsync())
   {
    // Bloquear o cabeçalho impede cancelamentos concorrentes de devolverem estoque duas vezes.
    var p=await db.Pedidos.FromSqlInterpolated($"SELECT * FROM atendimento WHERE idatendimento={id} FOR UPDATE").AsTracking().FirstOrDefaultAsync();
    if(p==null)return NotFound();
    var valid=(p.Status=="Aberto" && (x.Status=="Em processamento" || x.Status=="Cancelado")) || (p.Status=="Em processamento" && (x.Status=="Concluído" || x.Status=="Cancelado"));
    if(!valid)return Conflict(new{message="Transição inválida. Use Aberto → Em processamento → Concluído, ou cancele antes da conclusão."});
    if(x.Status=="Cancelado")
    {
     var lines=await db.PedidoItens.Where(l=>l.PedidoId==id).OrderBy(l=>l.ItemId).ToListAsync();
     foreach(var line in lines)
      await db.Estoques.Where(e=>e.Id==line.ItemId).ExecuteUpdateAsync(s=>s.SetProperty(e=>e.Quantidade,e=>e.Quantidade+line.Quantidade));
    }
    p.Status=x.Status;await db.SaveChangesAsync();await tx.CommitAsync();return NoContent();
   }
  }
 }
}
