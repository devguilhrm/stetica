using System;
using Microsoft.EntityFrameworkCore;
namespace Stetica.Api
{
public class Pessoa
{
 public int Id { get; set; }
 public string Nome { get; set; } = string.Empty;
 public string Cpf { get; set; } = string.Empty;
 public DateTime DataNascimento { get; set; }
 public string Sexo { get; set; } = string.Empty;
 public string Email { get; set; } = string.Empty;
 public string Telefone { get; set; } = string.Empty;
 public bool Ativo { get; set; }
 public string? SenhaHash { get; set; }
}
public class Endereco
{
 public int Id { get; set; }
 public int PessoaId { get; set; }
 public string Cep { get; set; } = string.Empty;
 public string Logradouro { get; set; } = string.Empty;
 public string Bairro { get; set; } = string.Empty;
 public string Cidade { get; set; } = string.Empty;
 public string Uf { get; set; } = string.Empty;
 public string Numero { get; set; } = string.Empty;
 public string Complemento { get; set; } = string.Empty;
}
public class Funcionario
{
 public int Id { get; set; }
 public string Cargo { get; set; } = string.Empty;
 public DateTime DataAdmissao { get; set; }
}
public class Categoria
{
 public int Id { get; set; }
 public string Nome { get; set; } = string.Empty;
}
public class Item
{
 public int Id { get; set; }
 public int CategoriaId { get; set; }
 public string Nome { get; set; } = string.Empty;
 public string Descricao { get; set; } = string.Empty;
 public decimal Preco { get; set; }
 public string Tipo { get; set; } = string.Empty;
 public bool Ativo { get; set; }
}
public class Produto
{
 public int Id { get; set; }
 public int CodigoPreco { get; set; }
 public decimal PrecoVenda { get; set; }
 public string Unidade { get; set; } = string.Empty;
}
public class Estoque
{
 public int Id { get; set; }
 public int Quantidade { get; set; }
}
public class Entrada
{
 public int Id { get; set; }
 public int ProdutoId { get; set; }
 public DateTime Data { get; set; }
 public int Quantidade { get; set; }
 public decimal ValorUnitario { get; set; }
}
public class Pedido
{
 public int Id { get; set; }
 public int PessoaId { get; set; }
 public DateTime Data { get; set; }
 public string Status { get; set; } = string.Empty;
 public decimal Total { get; set; }
}
public class PedidoItem
{
 public int PedidoId { get; set; }
 public int ItemId { get; set; }
 public int FuncionarioId { get; set; }
 public int Quantidade { get; set; }
 public decimal ValorUnitario { get; set; }
}
public class Sessao
{
 public int Id { get; set; }
 public int PessoaId { get; set; }
 public string TokenHash { get; set; } = string.Empty;
 public DateTime ExpiraEm { get; set; }
}
public class SteticaContext : DbContext
{
 public SteticaContext(DbContextOptions<SteticaContext> options) : base(options) {}
 public DbSet<Pessoa> Pessoas => Set<Pessoa>();
 public DbSet<Endereco> Enderecos => Set<Endereco>();
 public DbSet<Funcionario> Funcionarios => Set<Funcionario>();
 public DbSet<Categoria> Categorias => Set<Categoria>();
 public DbSet<Item> Itens => Set<Item>();
 public DbSet<Produto> Produtos => Set<Produto>();
 public DbSet<Estoque> Estoques => Set<Estoque>();
 public DbSet<Entrada> Entradas => Set<Entrada>();
 public DbSet<Pedido> Pedidos => Set<Pedido>();
 public DbSet<PedidoItem> PedidoItens => Set<PedidoItem>();
 public DbSet<Sessao> Sessoes => Set<Sessao>();
 protected override void OnModelCreating(ModelBuilder model)
 {
  model.Entity<Pessoa>(e => { e.ToTable("pessoa");
e.HasKey(x => x.Id);
e.Property(x => x.Id).HasColumnName("idpessoa");
e.Property(x => x.Nome).HasColumnName("nome");
e.Property(x => x.Cpf).HasColumnName("cpf");
e.Property(x => x.DataNascimento).HasColumnName("data_nascimento");
e.Property(x => x.Sexo).HasColumnName("sexo");
e.Property(x => x.Email).HasColumnName("email");
e.Property(x => x.Telefone).HasColumnName("telefone");
e.Property(x => x.Ativo).HasColumnName("ativo");
e.Property(x => x.SenhaHash).HasColumnName("senha_hash");
});
  model.Entity<Endereco>(e => { e.ToTable("endereco");
e.HasKey(x => x.Id);
e.Property(x => x.Id).HasColumnName("idendereco");
e.Property(x => x.PessoaId).HasColumnName("idpessoa");
e.Property(x => x.Cep).HasColumnName("cep");
e.Property(x => x.Logradouro).HasColumnName("logradouro");
e.Property(x => x.Bairro).HasColumnName("bairro");
e.Property(x => x.Cidade).HasColumnName("cidade");
e.Property(x => x.Uf).HasColumnName("uf");
e.Property(x => x.Numero).HasColumnName("numero");
e.Property(x => x.Complemento).HasColumnName("complemento");
});
  model.Entity<Funcionario>(e => { e.ToTable("funcionario");
e.HasKey(x => x.Id);
e.Property(x => x.Id).ValueGeneratedNever();
e.Property(x => x.Id).HasColumnName("idpessoa");
e.Property(x => x.Cargo).HasColumnName("cargo");
e.Property(x => x.DataAdmissao).HasColumnName("data_admissao");
});
  model.Entity<Categoria>(e => { e.ToTable("categoria");
e.HasKey(x => x.Id);
e.Property(x => x.Id).HasColumnName("idcategoria");
e.Property(x => x.Nome).HasColumnName("categoria");
});
  model.Entity<Item>(e => { e.ToTable("item");
e.HasKey(x => x.Id);
e.Property(x => x.Id).HasColumnName("iditem");
e.Property(x => x.CategoriaId).HasColumnName("idcategoria");
e.Property(x => x.Nome).HasColumnName("item");
e.Property(x => x.Descricao).HasColumnName("descricao_item");
e.Property(x => x.Preco).HasColumnName("preco").HasPrecision(10, 2);
e.Property(x => x.Tipo).HasColumnName("tipo_item");
e.Property(x => x.Ativo).HasColumnName("ativo");
});
  model.Entity<Produto>(e => { e.ToTable("produto");
e.HasKey(x => x.Id);
e.Property(x => x.Id).ValueGeneratedNever();
e.Property(x => x.Id).HasColumnName("iditem");
e.Property(x => x.CodigoPreco).HasColumnName("codigo_preco");
e.Property(x => x.PrecoVenda).HasColumnName("preco_venda").HasPrecision(10, 2);
e.Property(x => x.Unidade).HasColumnName("unidade");
});
  model.Entity<Estoque>(e => { e.ToTable("estoque");
e.HasKey(x => x.Id);
e.Property(x => x.Id).ValueGeneratedNever();
e.Property(x => x.Id).HasColumnName("iditem");
e.Property(x => x.Quantidade).HasColumnName("quantidade_estoque");
});
  model.Entity<Entrada>(e => { e.ToTable("entrada_produto");
e.HasKey(x => x.Id);
e.Property(x => x.Id).HasColumnName("identrada_produto");
e.Property(x => x.ProdutoId).HasColumnName("iditem");
e.Property(x => x.Data).HasColumnName("data_entrada_produto");
e.Property(x => x.Quantidade).HasColumnName("quantidade_entrada");
e.Property(x => x.ValorUnitario).HasColumnName("valor_unitario_entrada").HasPrecision(10, 2);
});
  model.Entity<Pedido>(e => { e.ToTable("atendimento");
e.HasKey(x => x.Id);
e.Property(x => x.Id).HasColumnName("idatendimento");
e.Property(x => x.PessoaId).HasColumnName("idpessoa");
e.Property(x => x.Data).HasColumnName("data_atendimento");
e.Property(x => x.Status).HasColumnName("status_atendimento");
e.Property(x => x.Total).HasColumnName("total").HasPrecision(10, 2);
});
  model.Entity<PedidoItem>(e => { e.ToTable("atendimentoitem");
e.HasKey(x => new { x.PedidoId, x.ItemId });
e.Property(x => x.PedidoId).HasColumnName("idatendimento");
e.Property(x => x.ItemId).HasColumnName("iditem");
e.Property(x => x.FuncionarioId).HasColumnName("idfuncionario");
e.Property(x => x.Quantidade).HasColumnName("quantidade_itens");
e.Property(x => x.ValorUnitario).HasColumnName("valor_unitario").HasPrecision(10, 2);
});
  model.Entity<Sessao>(e => { e.ToTable("sessao_cliente");
e.HasKey(x => x.Id);
e.Property(x => x.Id).HasColumnName("id");
e.Property(x => x.PessoaId).HasColumnName("idpessoa");
e.Property(x => x.TokenHash).HasColumnName("token_hash");
e.Property(x => x.ExpiraEm).HasColumnName("expira_em");
});
 }
}
}
