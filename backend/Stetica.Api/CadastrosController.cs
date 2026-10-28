using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Stetica.Api
{
 [ApiController, Route("api")]
 public class CadastrosController : ControllerBase
 {
  private readonly SteticaContext db;
  public CadastrosController(SteticaContext db) { this.db = db; }
  private object PublicPerson(Pessoa p, Endereco? e) => new { p.Id, p.Nome, p.Cpf, p.DataNascimento, p.Sexo, p.Email, p.Telefone, p.Ativo, Endereco = e };
  private void Apply(Pessoa p, PessoaInput x)
  {
   p.Nome = x.Nome.Trim(); p.Cpf = x.Cpf; p.Email = x.Email.Trim().ToLowerInvariant();
   p.DataNascimento = x.DataNascimento.Date; p.Sexo = x.Sexo; p.Telefone = x.Telefone;
  }
  private void ApplyAddress(Endereco e, EnderecoInput x)
  {
   e.Cep = x.Cep; e.Logradouro = x.Logradouro; e.Bairro = x.Bairro;
   e.Cidade = x.Cidade; e.Uf = x.Uf; e.Numero = x.Numero; e.Complemento = x.Complemento;
  }
  private async Task<bool> ValidPerson(PessoaInput x, int id = 0)
  {
   if (x.DataNascimento < new DateTime(1900, 1, 1) || x.DataNascimento.Date > DateTime.Today) return false;
   return !await db.Pessoas.AnyAsync(p => p.Id != id && (p.Cpf == x.Cpf || p.Email == x.Email.Trim().ToLower()));
  }
  private async Task<Pessoa> CreatePerson(PessoaInput x, string? password = null)
  {
   var p = new Pessoa { Ativo = true, SenhaHash = password == null ? null : Security.HashPassword(password) };
   Apply(p, x); db.Pessoas.Add(p); await db.SaveChangesAsync();
   var e = new Endereco { PessoaId = p.Id }; ApplyAddress(e, x.Endereco); db.Enderecos.Add(e);
   await db.SaveChangesAsync(); return p;
  }
  private async Task<object> Session(Pessoa p)
  {
   var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
   db.Sessoes.Add(new Sessao { PessoaId = p.Id, TokenHash = Security.HashToken(token), ExpiraEm = DateTime.UtcNow.AddHours(12) });
   await db.SaveChangesAsync(); return new { token, cliente = new { p.Id, p.Nome, p.Email } };
  }
  [HttpPost("clientes")]
  public async Task<IActionResult> Register(CadastroInput x)
  {
   if (!await ValidPerson(x)) return BadRequest(new { message = "CPF/e-mail já cadastrado ou nascimento inválido." });
   await using (var tx = await db.Database.BeginTransactionAsync())
   {
    var p = await CreatePerson(x, x.Senha); var result = await Session(p); await tx.CommitAsync();
    return StatusCode(201, result);
   }
  }
  [HttpPost("sessoes")]
  public async Task<IActionResult> Login(LoginInput x)
  {
   var p = await db.Pessoas.FirstOrDefaultAsync(p => p.Email == x.Email.Trim().ToLower() && p.Ativo);
   if (p == null || !Security.VerifyPassword(x.Senha, p.SenhaHash)) return Unauthorized(new { message = "E-mail ou senha inválidos." });
   return Ok(await Session(p));
  }
  [HttpDelete("sessoes")]
  public async Task<IActionResult> Logout()
  {
   var header = Request.Headers["Authorization"].ToString();
   if (header.StartsWith("Bearer ", StringComparison.Ordinal))
   {
    var hash = Security.HashToken(header.Substring(7));
    await db.Sessoes.Where(s => s.TokenHash == hash).ExecuteDeleteAsync();
   }
   return NoContent();
  }
  [Admin, HttpGet("pessoas")]
  public async Task<IActionResult> People() => Ok(await db.Pessoas.Where(p => p.SenhaHash != null).Select(p => new { p.Id, p.Nome, p.Cpf, p.Email, p.Telefone, p.Ativo, p.DataNascimento, p.Sexo, Endereco = db.Enderecos.FirstOrDefault(e => e.PessoaId == p.Id) }).ToListAsync());
  [Admin, HttpGet("pessoas/{id:int}")]
  public async Task<IActionResult> Person(int id)
  {
   var p = await db.Pessoas.FindAsync(id); if (p == null) return NotFound();
   return Ok(PublicPerson(p, await db.Enderecos.FirstOrDefaultAsync(e => e.PessoaId == id)));
  }
  [Admin, HttpPut("pessoas/{id:int}")]
  public async Task<IActionResult> UpdatePerson(int id, PessoaInput x)
  {
   var p = await db.Pessoas.FindAsync(id); if (p == null) return NotFound();
   if (!await ValidPerson(x, id)) return BadRequest(new { message = "CPF/e-mail duplicado ou nascimento inválido." });
   Apply(p, x); var e = await db.Enderecos.FirstAsync(e => e.PessoaId == id); ApplyAddress(e, x.Endereco);
   await db.SaveChangesAsync(); return NoContent();
  }
  [Admin, HttpDelete("pessoas/{id:int}")]
  public async Task<IActionResult> DisablePerson(int id)
  {
   var p = await db.Pessoas.FindAsync(id); if (p == null) return NotFound();
   p.Ativo = false; await db.SaveChangesAsync(); return NoContent();
  }
  [HttpGet("equipe")]
  public async Task<IActionResult> Team() => Ok(await (from f in db.Funcionarios join p in db.Pessoas on f.Id equals p.Id where p.Ativo select new { f.Id, p.Nome, f.Cargo }).ToListAsync());
  [Admin, HttpGet("funcionarios")]
  public async Task<IActionResult> Employees() => Ok(await (from f in db.Funcionarios join p in db.Pessoas on f.Id equals p.Id select new { f.Id, p.Nome, p.Cpf, p.Email, p.Telefone, p.DataNascimento, p.Sexo, p.Ativo, f.Cargo, f.DataAdmissao, Endereco = db.Enderecos.FirstOrDefault(e => e.PessoaId == p.Id) }).ToListAsync());
  [Admin, HttpGet("funcionarios/{id:int}")]
  public async Task<IActionResult> Employee(int id)
  {
   var f = await db.Funcionarios.FindAsync(id); if (f == null) return NotFound();
   var p = await db.Pessoas.FindAsync(id); return Ok(new { pessoa = PublicPerson(p!, await db.Enderecos.FirstOrDefaultAsync(e => e.PessoaId == id)), f.Cargo, f.DataAdmissao });
  }
  [Admin, HttpPost("funcionarios")]
  public async Task<IActionResult> CreateEmployee(FuncionarioInput x)
  {
   if (!await ValidPerson(x) || x.DataAdmissao < new DateTime(1900,1,1) || x.DataAdmissao.Date > DateTime.Today) return BadRequest(new { message = "Dados pessoais ou data de admissão inválidos." });
   await using (var tx = await db.Database.BeginTransactionAsync())
   {
    var p = await CreatePerson(x); db.Funcionarios.Add(new Funcionario { Id = p.Id, Cargo = x.Cargo, DataAdmissao = x.DataAdmissao.Date });
    await db.SaveChangesAsync(); await tx.CommitAsync(); return Created("/api/funcionarios/" + p.Id, new { p.Id });
   }
  }
  [Admin, HttpPut("funcionarios/{id:int}")]
  public async Task<IActionResult> UpdateEmployee(int id, FuncionarioInput x)
  {
   var f = await db.Funcionarios.FindAsync(id); if (f == null) return NotFound();
   if (!await ValidPerson(x,id) || x.DataAdmissao < new DateTime(1900,1,1) || x.DataAdmissao.Date > DateTime.Today) return BadRequest(new { message = "Dados pessoais ou data de admissão inválidos." });
   var p = await db.Pessoas.FindAsync(id); Apply(p!,x);
   var e = await db.Enderecos.FirstAsync(e => e.PessoaId == id); ApplyAddress(e,x.Endereco);
   f.Cargo = x.Cargo; f.DataAdmissao = x.DataAdmissao.Date; await db.SaveChangesAsync(); return NoContent();
  }
  [Admin, HttpDelete("funcionarios/{id:int}")]
  public async Task<IActionResult> DisableEmployee(int id)
  {
   if (!await db.Funcionarios.AnyAsync(f => f.Id == id)) return NotFound();
   return await DisablePerson(id);
  }
 }
}
