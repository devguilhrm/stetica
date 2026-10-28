# Validação da entrega

Validação executada neste ambiente Linux. O procedimento do README para Windows/macOS ainda precisa ser executado no computador de destino; a validação em Linux não equivale a essa execução.

| Verificação | Resultado |
| --- | --- |
| SDK .NET 8.0.427, compilação com `LangVersion=8.0` | Passou, zero erros e zero avisos. |
| Restore NuGet com `--locked-mode` | Passou. |
| Node 20 e instalação Angular com `npm ci` | Passou. |
| Build Angular 17.3 de produção | Passou. |
| Importação e reexecução do SQL principal no MySQL 8.4 | Passou. |
| Importação e reexecução do SQL principal no MySQL 8.0.46 | Passou. |
| Dados de demonstração nas duas versões | Passou; reexecução sem duplicar os registros da demonstração. |
| UTF-8 explícito e acentuação dos dados demonstrativos | Conferidos e corrigidos; scripts usam `SET NAMES utf8mb4`. |
| `tests/smoke.py` sobre MySQL 8.4 | Passou: 49 verificações HTTP. |
| `tests/smoke.py` sobre MySQL 8.0.46 | Passou: 49 verificações HTTP. |
| Catálogo no Chromium em 1440px e 390px | Passou, sem overflow horizontal. |
| Entrada no painel e abertura do formulário de itens pelo navegador | Passou, sem erros JavaScript. |
| Cadastro de cliente, sacola e confirmação de pedido pelo navegador | Passou, incluindo os dados reais nos detalhes do pedido. |
| Swagger UI: Authorize e Try it out no navegador | Passou; consultas administrativa e de cliente retornaram 200 com suas respectivas autenticações. |
| Swagger/OpenAPI gerado com C# 8.0 | Passou; esquemas AdminKey/Bearer, operação pública e respostas 201/204 conferidas. |
| Coleção Insomnia com 43 requisições | JSONs/corpos/rotas/métodos conferidos contra o OpenAPI real; importação na interface do Insomnia não executada neste ambiente. |
| Login do cliente fictício criado pelo SQL | Passou; reexecução do script sem duplicar registros nem alterar saldos em MySQL 8.0/8.4. |
| Publicação do ambiente ou execução no outro PC | Não executadas. |

## O que o teste de integração verifica

- API consulta o banco, aceita cadastros válidos e rejeita campos obrigatórios ausentes.
- Operações administrativas sem chave retornam 401.
- CPF/e-mail duplicados são recusados; senha errada é recusada; login correto funciona.
- Categoria vinculada não pode ser excluída; filtros retornam o produto esperado; IDs inexistentes retornam 404.
- Produto nasce com saldo zero; entrada atualiza saldo e preço calculado pela função SQL.
- Serviço não tem estoque; pedido combina produto e serviço com total calculado no servidor.
- Estoque insuficiente desfaz o pedido inteiro.
- Outro cliente não acessa o pedido alheio; requisições sem sessão são recusadas.
- Cancelamento devolve estoque uma única vez e a conclusão segue as transições permitidas.
- Duas compras concorrentes de todo o saldo não podem vencer juntas.
- Mudança posterior no preço não altera o valor unitário gravado no pedido.
- Item desativado deixa de aparecer na consulta pública; sessão encerrada deixa de acessar pedidos.

Os testes criam registros fictícios marcados por execução. Os dados são mantidos para inspeção, como documentado no README. As imagens da pasta `docs` foram capturadas do aplicativo rodando com o banco real.

## Limites da validação

Não foram testadas versões históricas do MySQL, MariaDB, publicação em servidor público, gateway de pagamentos, recuperação de senha nem um arquivo Figma editável. O SQL foi preparado para MySQL 8.0/8.4. O projeto é uma aplicação acadêmica executada localmente, com chave administrativa compartilhada e sessões de clientes.

O ambiente de nuvem teve `install_script` e `start_skill` salvos como rascunho. Salvar essas instruções não publica o ambiente. Para reutilizar o snapshot pela plataforma, revise e salve a configuração nas configurações do ambiente e publique-o.
