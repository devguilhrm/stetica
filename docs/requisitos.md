# Escopo da atividade

Fonte: documento “ATIVIDADE 04 — CODIFICAÇÃO BACKEND”, enviado pelo usuário. Ele foi tratado como especificação acadêmica. As padronizações explícitas do usuário prevalecem: Angular 17, linguagem C# 8.0 em .NET 8, execução em outro computador e banco `bd_stetica`.

| Requisitos | Implementação |
| --- | --- |
| RF01–RF03 | Catálogo ativo de produtos/serviços, detalhes por ID, pesquisa por nome e filtros por categoria/tipo. |
| RF04 | Cadastro de clientes com endereço, validações de formato/obrigatoriedade e unicidade de CPF/e-mail. |
| RF05–RF06 | Carrinho temporário na memória do frontend, quantidade de produtos, remoção e total. |
| RF07–RF08 | Pedido persistido pelo backend; histórico e detalhes restritos à sessão do cliente. |
| RF09 | Painel de clientes: listagem, consulta por ID, edição e desativação. |
| RF10–RF11 | Cadastro, listagem, consulta, edição e desativação de produtos/serviços. Tipo não muda após criação. |
| RF12 | Categorias com CRUD e bloqueio de exclusão quando vinculadas a itens. |
| RF13–RF15 | Pedidos no painel, detalhes, filtro por situação e transições validadas no backend. |
| RF16–RF19 | Entradas, consulta de estoque e movimentação transacional, com triggers e controle de concorrência. |
| RF20–RF22 | Mensagens de resultado, validação de formulários e tratamento de erros HTTP. |
| RF23 | Navegação entre loja, conta, sacola, histórico e painel administrativo. |
| RF24 | Resumo administrativo com dados reais da API. |
| Funcionários | Cadastro com dados pessoais/endereço, cargo e admissão; listagem, consulta por ID, edição e desativação. |

## Contratos da API

Todos os caminhos abaixo têm prefixo `/api`.

| Recurso | Operações | Acesso |
| --- | --- | --- |
| `saude` | GET | Público; confirma consulta ao banco. |
| `categorias`, `categorias/{id}` | GET; POST/PUT/DELETE para manutenção | Consulta pública; manutenção administrativa. |
| `itens`, `itens/{id}` | GET; POST/PUT/DELETE para manutenção | Consulta de ativos pública; manutenção administrativa. |
| `admin/itens` | GET | Administrativo, inclui inativos. |
| `clientes` | POST | Cadastro público, devolve sessão. |
| `sessoes` | POST / DELETE | Entrar / encerrar sessão de cliente. |
| `pessoas`, `pessoas/{id}` | GET; PUT/DELETE no detalhe | Administrativo. |
| `equipe` | GET | Público; somente ID, nome e cargo de funcionários ativos. |
| `funcionarios`, `funcionarios/{id}` | GET/POST; GET/PUT/DELETE no detalhe | Administrativo. |
| `pedidos` | POST | Cliente com Bearer token. |
| `meus-pedidos`, `meus-pedidos/{id}` | GET | Cliente com Bearer token; nunca retorna pedido de outra pessoa. |
| `pedidos`, `pedidos/{id}` | GET | Administrativo. |
| `pedidos/{id}/status` | PUT | Administrativo; recebe `{"status":"Em processamento"}` etc. |
| `pessoas/{id}/pedidos` | GET | Administrativo; consulta de um cliente. |
| `estoque`, `estoque/{iditem}` | GET | Administrativo. |
| `entradaprodutos`, `entradaprodutos/{id}` | GET; POST na coleção | Administrativo. |
| `resumo` | GET | Administrativo. |

Clientes usam `Authorization: Bearer <token>`; painel usa `X-Admin-Key`. Dados de autenticação nunca fazem parte do código-fonte. O formulário permite escolher um funcionário responsável por item, inclusive para produtos, conforme a relação obrigatória do modelo da atividade.

O carrinho é temporário na memória do componente de apresentação e se perde ao recarregar a página; somente pedidos confirmados são persistidos. Sessão de cliente e chave administrativa ficam no `sessionStorage` da aba. Pagamentos, recuperação de senha e perfis individuais administrativos não fazem parte desta entrega.

## Documentação interativa e roteiro de testes

A API publica Swagger UI em `/swagger` e OpenAPI em `/swagger/v1/swagger.json` quando iniciada em Development. Consulte [o guia de Workbench, Swagger e Insomnia](testes-api.md). O SQL opcional inclui uma conta fictícia de cliente para o roteiro, e a coleção de 43 requisições usa campos vazios para chave/token reais.
