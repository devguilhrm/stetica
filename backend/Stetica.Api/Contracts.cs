using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
namespace Stetica.Api
{
 public class PessoaInput
 {
  [Required, StringLength(100, MinimumLength = 2)] public string Nome { get; set; } = "";
  [Required, RegularExpression(@"\d{11}")] public string Cpf { get; set; } = "";
  public DateTime DataNascimento { get; set; }
  [Required, RegularExpression("[MFO]")] public string Sexo { get; set; } = "O";
  [Required, EmailAddress, StringLength(100)] public string Email { get; set; } = "";
  [Required, RegularExpression(@"\d{10,11}")] public string Telefone { get; set; } = "";
  [Required] public EnderecoInput Endereco { get; set; } = new EnderecoInput();
 }
 public class CadastroInput : PessoaInput
 {
  [Required, StringLength(128, MinimumLength = 8)] public string Senha { get; set; } = "";
 }
 public class EnderecoInput
 {
  [Required, RegularExpression(@"\d{8}")] public string Cep { get; set; } = "";
  [Required, StringLength(150)] public string Logradouro { get; set; } = "";
  [Required, StringLength(100)] public string Bairro { get; set; } = "";
  [Required, StringLength(100)] public string Cidade { get; set; } = "";
  [Required, RegularExpression("[A-Z]{2}")] public string Uf { get; set; } = "";
  [Required, StringLength(10)] public string Numero { get; set; } = "";
  [StringLength(150)] public string Complemento { get; set; } = "";
 }
 public class LoginInput
 {
  [Required, EmailAddress] public string Email { get; set; } = "";
  [Required, StringLength(128)] public string Senha { get; set; } = "";
 }
 public class FuncionarioInput : PessoaInput
 {
  [Required, StringLength(50)] public string Cargo { get; set; } = "";
  public DateTime DataAdmissao { get; set; }
 }
 public class CategoriaInput
 {
  [Required, StringLength(35, MinimumLength = 2)] public string Nome { get; set; } = "";
 }
 public class ItemInput
 {
  [Required, StringLength(40, MinimumLength = 2)] public string Nome { get; set; } = "";
  [Required, StringLength(200)] public string Descricao { get; set; } = "";
  [Range(1, int.MaxValue)] public int CategoriaId { get; set; }
  [Required, RegularExpression("[PS]")] public string Tipo { get; set; } = "P";
  [Range(typeof(decimal), "0.01", "99999999.99")] public decimal Preco { get; set; }
  public bool Ativo { get; set; } = true;
  [Range(1, 3)] public int CodigoPreco { get; set; } = 1;
  [Required, StringLength(10)] public string Unidade { get; set; } = "UN";
 }
 public class EntradaInput
 {
  [Range(1, int.MaxValue)] public int ProdutoId { get; set; }
  [Range(1, 1000000)] public int Quantidade { get; set; }
  [Range(typeof(decimal), "0.01", "99999999.99")] public decimal ValorUnitario { get; set; }
  public DateTime Data { get; set; }
 }
 public class PedidoInput
 {
  [Required, MinLength(1), MaxLength(100)] public List<PedidoLinhaInput> Itens { get; set; } = new List<PedidoLinhaInput>();
 }
 public class PedidoLinhaInput
 {
  [Range(1, int.MaxValue)] public int ItemId { get; set; }
  [Range(1, 10000)] public int Quantidade { get; set; }
  [Range(1, int.MaxValue)] public int FuncionarioId { get; set; }
 }
 public class StatusInput
 {
  [Required, RegularExpression("^(Em processamento|Concluído|Cancelado)$")] public string Status { get; set; } = "";
 }
}
