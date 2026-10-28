# Guia prático — Workbench, Swagger e Insomnia

Use este guia depois de instalar os programas e configurar a API conforme o [README](../README.md). Angular não precisa estar rodando para testar a API no Swagger ou Insomnia. A API e o MySQL precisam estar iniciados.

## 1. Criar e popular o banco no Workbench

1. Inicie o **MySQL Server**. Abra o **MySQL Workbench** e conecte-se ao servidor com seu usuário, senha e porta (normalmente `localhost:3306`). O Workbench é o programa cliente, não o servidor.
2. Vá a **File → Open SQL Script**, abra `database/01_bd_stetica.sql` e execute o arquivo inteiro pelo botão de raio. Ele cria o banco `bd_stetica`, tabelas, função, triggers, views e procedure, na ordem necessária.
3. Abra `database/02_dados_demonstracao.sql` e execute o arquivo inteiro. Não execute somente a seleção de texto: as variáveis e a transação precisam do script completo.
4. Atualize **Schemas**. Execute:

```sql
USE bd_stetica;
SHOW TABLES;
SHOW TRIGGERS;
SELECT * FROM vw_produto_categoria;
SELECT idpessoa, nome, email FROM pessoa;
SELECT idcategoria, categoria FROM categoria;
SELECT iditem, item, tipo_item FROM item;
```

Os dados incluem duas categorias, um funcionário com endereço, um produto com dez unidades iniciais, dois serviços e um cliente com endereço. A entrada inicial passa pelo trigger: custo R$ 50,00 e venda R$ 54,00 (margem de 8%). Uma reexecução não repõe unidades já vendidas nem duplica a entrada inicial.

**Conta fictícia de cliente:** e-mail `cliente.demo@stetica.example`, senha `SteticaDemo@123`. É uma senha pública de demonstração local; não é a chave do administrador. O SQL guarda um hash PBKDF2 compatível com a API. Contas existentes não são sobrescritas. Se você alterou/desativou essa conta, repetir o script não restaura a senha nem reativa o cadastro.

Anote os IDs retornados ao final do script: produto, serviço, funcionário e cliente. **Não presuma que esses IDs são 1.** O banco pode já conter outros registros.

O script principal não é uma migração de um modelo antigo e não apaga tabelas. Em banco existente com outra estrutura, faça backup e compare o modelo antes de importar. O script de dados fictícios deve ser usado em banco de desenvolvimento. Ele pode ser executado novamente; a conta de importação precisa ter permissão de criação de tabelas e rotinas.

## 2. Iniciar a API com Swagger

Abra PowerShell na pasta principal do projeto:

```powershell
cd backend\Stetica.Api
dotnet restore --locked-mode
dotnet user-secrets set "ConnectionStrings:Stetica" "Server=localhost;Port=3306;Database=bd_stetica;User=root;Password=SUA_SENHA_MYSQL;"
dotnet user-secrets set "Admin:Key" "SUA_CHAVE_ADMINISTRATIVA_COM_16_OU_MAIS_CARACTERES"
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet build --no-restore
dotnet run --no-build --no-launch-profile --urls http://localhost:5080
```

Configure os user-secrets apenas na primeira execução ou quando quiser alterá-los. Use sua senha real do MySQL e uma chave administrativa própria. Mantenha o terminal aberto.

No macOS/Linux, use `/` nos caminhos e inicie com:

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run --no-build --no-launch-profile --urls http://localhost:5080
```

No navegador **do computador em que a API está rodando**, abra:

- Interface Swagger: `http://localhost:5080/swagger`
- Documento OpenAPI: `http://localhost:5080/swagger/v1/swagger.json`
- Saúde com consulta ao banco: `http://localhost:5080/api/saude`

O Swagger fica habilitado somente em **Development**. Se `/swagger` retornar 404, confira a variável de ambiente, reconstrua e reinicie a API. Não é preciso iniciar Angular para acessá-lo.

### Usar “Try it out”

1. Expanda `GET /api/saude`, clique **Try it out → Execute**. Espere HTTP 200 e `{"status":"ok","banco":"bd_stetica"}`.
2. Faça o mesmo em `GET /api/itens` e `GET /api/equipe`. São públicos.
3. Clique **Authorize** no topo. No campo **AdminKey**, informe somente a chave definida em `Admin:Key`. Clique **Authorize** nessa seção e depois **Close**.
4. Execute `GET /api/resumo` ou `GET /api/estoque`. O Swagger enviará `X-Admin-Key` automaticamente.
5. Execute `POST /api/sessoes` com o JSON abaixo. Copie o campo `token` da resposta:

```json
{
  "email": "cliente.demo@stetica.example",
  "senha": "SteticaDemo@123"
}
```

6. Em **Authorize → Bearer**, cole **somente o token**, sem escrever `Bearer ` antes. A interface adiciona o prefixo automaticamente. Autorize e feche a janela.
7. Execute `GET /api/meus-pedidos`. Em um banco novo, a resposta é uma lista vazia; depois da compra, ela terá o pedido.
8. Para confirmar uma compra, execute `POST /api/pedidos`, trocando os números pelos IDs reais do seu banco:

```json
{
  "itens": [
    { "itemId": 1, "quantidade": 1, "funcionarioId": 1 },
    { "itemId": 2, "quantidade": 1, "funcionarioId": 1 }
  ]
}
```

A primeira linha pode ser um produto e a segunda um serviço. Use IDs diferentes e válidos; serviços têm quantidade 1. O cliente vem da sessão, não de um `clienteId` informado no JSON. Preços e total são calculados no backend.

Cada operação exibe o cadeado correspondente à autenticação exigida. Consultas públicas não exigem chave nem sessão; **POST pedidos usa Bearer**, enquanto **GET pedidos usa a chave administrativa**. Os valores inseridos no Swagger não fazem parte dos arquivos exportados.

## 3. Importar a coleção no Insomnia

1. Instale e abra o [Insomnia](https://insomnia.rest/download).
2. Escolha **Import / Import from File** (o nome pode variar conforme a versão).
3. Importe **`docs/insomnia/stetica.insomnia.json`**. Ela contém 43 requisições agrupadas, corpos JSON de exemplo e cabeçalhos preparados.
4. Abra o ambiente da coleção (**Manage Environments / Base Environment**) e preencha os campos:

| Variável | Valor |
| --- | --- |
| `base_url` | `http://localhost:5080`, sem `/api` no final. |
| `admin_key` | A chave definida em `Admin:Key` no seu computador. |
| `cliente_token` | Inicialmente vazio; depois, o `token` retornado pelo login. |
| `categoria_id` | ID de uma categoria existente. |
| `produto_id` | ID do produto de demonstração. |
| `servico_id` | ID de um dos serviços de demonstração. |
| `funcionario_id` | ID do funcionário de demonstração. |
| `cliente_id` | ID do cliente retornado no login. |
| `pedido_id` | ID retornado após criar o pedido. |
| `entrada_id` | ID retornado após registrar uma entrada. |

IDs começam em **0 como marcadores** na coleção. Substitua-os pelos números reais antes de testar operações por ID. Mantenha as variáveis de IDs como números e URL/chave/token como textos. A coleção não inclui sua chave ou tokens reais. Não exporte uma cópia com suas credenciais preenchidas para o Git.

Alternativa: importe `docs/insomnia/stetica.openapi.json` como OpenAPI. Esse documento é gerado pelo Swagger e descreve o contrato completo. A coleção Insomnia é mais conveniente para o roteiro porque já inclui exemplos e variáveis.

### Sequência de teste sugerida

1. **01 → Saúde da API**: HTTP 200 confirma que a API consulta o banco.
2. **01 → Catálogo / Equipe ativa**: localize os IDs e preencha o ambiente.
3. **02 → Entrar com cliente de demonstração**: HTTP 200. Copie `token` para `cliente_token` e `cliente.id` para `cliente_id`. Não copie as aspas.
4. **04 → Resumo administrativo** e **05 → Consultar estoque**: HTTP 200 com sua chave válida.
5. **03 → Confirmar pedido de produto e serviço**: HTTP 201. Guarde o `id` em `pedido_id`. Um produto debita estoque; serviço não usa estoque.
6. **03 → Meus pedidos / Meu pedido por ID**: confirme itens, total e situação `Aberto`.
7. **05 → Estoque de um produto**: confira o saldo depois da compra.
8. **06 → Alterar situação: Em processamento**: HTTP 204, sem corpo.
9. Escolha **um** desfecho: **Concluído**, ou **Cancelado**. Ambos retornam 204 quando permitidos. Um pedido concluído não pode ser cancelado. Para testar o outro desfecho, crie outro pedido.
10. Se cancelou, consulte novamente o estoque: a quantidade do produto será devolvida uma única vez. Repetir o cancelamento deve retornar 409.
11. **05 → Registrar entrada**: HTTP 201; atualize `entrada_id`, consulte o estoque e confira o aumento de cinco unidades e a atualização do preço pela função SQL.
12. **02 → Sair da sessão**: HTTP 204. Uma consulta posterior aos próprios pedidos com esse token deve retornar 401. Faça login novamente para continuar.

As requisições de cadastro, edição, exclusão e desativação são testes independentes; **não execute todas como um lote**. Ao cadastrar outro cliente/funcionário, altere CPF e e-mail para não colidir com registros anteriores. Ao criar recursos novos, use o ID retornado. Desative registros somente depois dos testes que dependem deles.

### Cabeçalhos ao criar uma requisição manualmente

| Requisição | Cabeçalhos |
| --- | --- |
| Consultas públicas / cadastro / login | `Content-Type: application/json` quando há corpo JSON. |
| Administrativo | `X-Admin-Key: SUA_CHAVE`, além de Content-Type quando há JSON. |
| Cliente autenticado | `Authorization: Bearer SEU_TOKEN`, além de Content-Type quando há JSON. |

No Insomnia, a coleção já prepara esses cabeçalhos com variáveis. Não configure uma segunda autenticação que duplique `Authorization`. Se escolher a aba **Auth → Bearer Token** numa requisição manual, informe só o token.

## 4. Resultados esperados e falhas comuns

| HTTP | Significado neste projeto |
| --- | --- |
| 200 | Consulta/login realizado; corpo JSON com resultado. |
| 201 | Registro criado; resposta contém ID/dados para a próxima requisição. |
| 204 | Atualização, desativação ou logout realizado; resposta sem corpo. |
| 400 | Dados inválidos, campos obrigatórios ausentes, CPF/e-mail duplicado ou regra de cadastro inválida. |
| 401 | Falta de autenticação, chave administrativa incorreta, sessão expirada/encerrada ou senha incorreta. |
| 404 | ID não encontrado, item inativo na consulta pública ou pedido de outro cliente. |
| 409 | Conflito: estoque insuficiente, relacionamento que impede exclusão ou transição de status inválida. |
| 503 | Conexão/consulta ao banco indisponível; confira serviço, credenciais e importação do SQL. |

Para verificar o isolamento dos pedidos, cadastre um segundo cliente, copie seu token e tente acessar o pedido do primeiro em `/api/meus-pedidos/{id}`: a resposta deve ser 404. Volte ao token original para continuar. Não use `GET /api/pedidos/{id}` para esse teste: esse caminho é administrativo e exige a chave.

## 5. Testes automatizados

O [README](../README.md#7-conferir-builds-e-testes) explica `tests/smoke.py`. Ele testa o fluxo real, concorrência de estoque e permissões. As verificações de Swagger/OpenAPI e da coleção são descritas em [validacao.md](validacao.md).
