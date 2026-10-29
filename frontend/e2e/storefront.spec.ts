import { test, expect, Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const run = randomUUID().slice(0, 8);
const productName = "Produto E2E " + run;
const serviceName = "Serviço E2E " + run;
const adminKey = process.env["STETICA_TEST_ADMIN_KEY"] ?? "";
const adminHeaders = { "X-Admin-Key": adminKey };
let employeeId: number;
let productId: number;
let serviceId: number;
let categoryId: number;

function person(name: string, suffix: string) {
  return {
    nome: name,
    cpf: String(Date.now()).slice(-9) + suffix,
    dataNascimento: "1995-06-15",
    sexo: "O",
    email: run + suffix + "@e2e.stetica.test",
    telefone: "11912345678",
    endereco: {
      cep: "01001000",
      logradouro: "Rua E2E",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
      numero: "10",
      complemento: "",
    },
  };
}

function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test.beforeAll(async ({ request }) => {
  expect(
    adminKey.length,
    "Configure STETICA_TEST_ADMIN_KEY com a chave da API de desenvolvimento",
  ).toBeGreaterThanOrEqual(16);
  const category = await request.post("/api/categorias", {
    headers: adminHeaders,
    data: { nome: "Categoria E2E " + run },
  });
  expect(category.status()).toBe(201);
  categoryId = (await category.json()).id;
  const employee = await request.post("/api/funcionarios", {
    headers: adminHeaders,
    data: {
      ...person("Profissional E2E " + run, "01"),
      cargo: "Esteticista",
      dataAdmissao: "2024-01-01",
    },
  });
  expect(employee.status()).toBe(201);
  employeeId = (await employee.json()).id;
  for (const tipo of ["P", "S"]) {
    const response = await request.post("/api/itens", {
      headers: adminHeaders,
      data: {
        nome: tipo === "P" ? productName : serviceName,
        descricao: "Fixture de teste do frontend",
        categoriaId: categoryId,
        tipo,
        preco: tipo === "P" ? 10 : 50,
        ativo: true,
        codigoPreco: 2,
        unidade: "UN",
      },
    });
    expect(response.status()).toBe(201);
    const id = (await response.json()).id;
    if (tipo === "P") productId = id;
    else serviceId = id;
  }
  const entry = await request.post("/api/entradaprodutos", {
    headers: adminHeaders,
    data: {
      produtoId: productId,
      quantidade: 3,
      valorUnitario: 10,
      data: "2024-01-01",
    },
  });
  expect(entry.status()).toBe(201);
});

test.afterAll(async ({ request }) => {
  // Preserva o histórico, mas retira os fixtures ativos da loja.
  for (const id of [productId, serviceId])
    if (id) {
      const response = await request.delete("/api/itens/" + id, {
        headers: adminHeaders,
      });
      expect(response.status()).toBe(204);
    }
  if (employeeId) {
    const response = await request.delete("/api/funcionarios/" + employeeId, {
      headers: adminHeaders,
    });
    expect(response.status()).toBe(204);
  }
});

test("catálogo, carrinho, cadastro, pedido e cancelamento administrativo com banco real", async ({
  page,
  request,
}) => {
  const errors = captureErrors(page);
  await page.goto("/");
  await page.getByLabel("Pesquisar por nome").fill(run);
  await page.getByRole("button", { name: "Filtrar", exact: true }).click();
  await expect(page.locator("app-product-card")).toHaveCount(2);
  await page
    .getByRole("button", {
      name: "Ver detalhes de " + productName,
      exact: true,
    })
    .click();
  await expect(
    page.locator(".detail").getByRole("heading", { name: productName }),
  ).toBeVisible();
  await page
    .locator(".detail")
    .getByRole("button", { name: "Adicionar à sacola" })
    .click();
  await page
    .getByRole("button", { name: "Adicionar " + serviceName, exact: true })
    .click();
  await page.getByRole("button", { name: /Sacola/ }).click();
  await expect(page).toHaveURL(/\/carrinho$/);
  const product = page.locator(".cart-line").filter({ hasText: productName });
  await product.getByRole("spinbutton").fill("2");
  await product.getByRole("spinbutton").blur();
  for (const name of [productName, serviceName]) {
    await page
      .getByLabel("Profissional de " + name)
      .selectOption({ label: "Profissional E2E " + run + " · Esteticista" });
  }
  await expect(page.locator(".cart-summary .total")).toContainText("71,60");
  await page.getByRole("button", { name: "Entrar para continuar" }).click();
  await expect(page).toHaveURL(/\/conta$/);
  const form = page
    .locator("form")
    .filter({
      has: page.getByRole("heading", { name: "Meu primeiro cuidado" }),
    });
  const customer = person("Cliente E2E " + run, "02");
  const fields: Record<string, string> = {
    "Nome completo": customer.nome,
    "CPF (11 dígitos)": customer.cpf,
    Nascimento: customer.dataNascimento,
    "E-mail": customer.email,
    "Telefone com DDD": customer.telefone,
    "CEP (8 dígitos)": customer.endereco.cep,
    Logradouro: customer.endereco.logradouro,
    Número: customer.endereco.numero,
    Bairro: customer.endereco.bairro,
    Cidade: customer.endereco.cidade,
    "UF (sigla maiúscula)": customer.endereco.uf,
    "Senha (mínimo de 8 caracteres)": "SenhaFicticiaE2E@123",
  };
  for (const [label, value] of Object.entries(fields))
    await form.getByLabel(label, { exact: true }).fill(value);
  await form.getByRole("combobox").selectOption({ label: "Outro" });
  await form.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/\/carrinho$/);
  await expect(page.locator(".cart-summary .total")).toContainText("71,60");
  const created = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/pedidos") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Confirmar pedido", exact: true })
    .click();
  const response = await created;
  expect(response.status()).toBe(201);
  const order = await response.json();
  await expect(page).toHaveURL(/\/pedidos$/);
  await expect(page.locator(".detail")).toContainText(productName);
  await expect(page.locator(".detail")).toContainText(serviceName);
  await expect(page.locator(".detail")).toContainText("71,60");
  expect(
    (
      await (
        await request.get("/api/estoque/" + productId, {
          headers: adminHeaders,
        })
      ).json()
    ).quantidade,
  ).toBe(1);
  // Entrar pelo cabeçalho mantém a sessão de cliente e usa a chave apenas no painel.
  await page
    .getByRole("button", { name: "Administrativo", exact: true })
    .click();
  await page.getByLabel("Chave de acesso").fill(adminKey);
  await page
    .getByRole("button", { name: "Acessar painel", exact: true })
    .click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Pedidos/ })
    .click();
  await page.getByLabel("Consultar registro por ID").fill(String(order.id));
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(page.locator(".detail")).toContainText(productName);
  const cancelled = page.waitForResponse(
    (value) =>
      value.url().endsWith("/status") && value.request().method() === "PUT",
  );
  await page
    .locator(".detail")
    .getByRole("button", { name: "Cancelar pedido", exact: true })
    .click();
  expect((await cancelled).status()).toBe(204);
  await expect(page.locator(".detail .badge")).toHaveText("Cancelado");
  expect(
    (
      await (
        await request.get("/api/estoque/" + productId, {
          headers: adminHeaders,
        })
      ).json()
    ).quantidade,
  ).toBe(3);
  expect(errors).toEqual([]);
});

test("painel trata autenticação inválida e permite criar, editar, consultar e excluir categoria", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.goto("/admin");
  await page.getByLabel("Chave de acesso").fill("chave-incorreta-de-teste");
  await page
    .getByRole("button", { name: "Acessar painel", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Chave administrativa inválida",
  );
  await page.getByLabel("Chave de acesso").fill(adminKey);
  await page
    .getByRole("button", { name: "Acessar painel", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: /^Categorias/ })
    .click();
  const name = "Nova categoria " + run;
  await page.getByLabel("Nome da categoria").fill(name);
  const created = page.waitForResponse(
    (value) =>
      value.url().endsWith("/api/categorias") &&
      value.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Salvar registro" }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  const id = (await response.json()).id;
  const row = page.getByRole("row").filter({ hasText: name });
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Nome da categoria").fill(name + " editada");
  const updated = page.waitForResponse(
    (value) =>
      value.url().endsWith("/api/categorias/" + id) &&
      value.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Salvar registro" }).click();
  expect((await updated).status()).toBe(204);
  await page.getByLabel("Consultar registro por ID").fill(String(id));
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(page.locator(".detail")).toContainText(name + " editada");
  page.once("dialog", (dialog) => dialog.accept());
  const removed = page.waitForResponse(
    (value) =>
      value.url().endsWith("/api/categorias/" + id) &&
      value.request().method() === "DELETE",
  );
  await page
    .getByRole("row")
    .filter({ hasText: name + " editada" })
    .getByRole("button", { name: "Excluir", exact: true })
    .click();
  expect((await removed).status()).toBe(204);
  await expect(
    page.getByRole("row").filter({ hasText: name + " editada" }),
  ).toHaveCount(0);
  await page.getByLabel("Consultar registro por ID").fill("2147483647");
  await page.getByRole("button", { name: "Consultar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Registro não encontrado",
  );
  expect(errors).toEqual([]);
});

test("rotas funcionam por acesso direto, recarga e voltar; layout móvel não transborda", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Encontre seu próximo cuidado" }),
  ).toBeVisible();
  expect(
    await page
      .locator("body")
      .evaluate((element) => element.scrollWidth > window.innerWidth),
  ).toBe(false);
  await page.getByRole("button", { name: "Minha conta", exact: true }).click();
  await expect(page).toHaveURL(/\/conta$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Um espaço para você" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Sacola/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sua sacola", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Um espaço para você" }),
  ).toBeVisible();
  expect(
    await page
      .locator("body")
      .evaluate((element) => element.scrollWidth > window.innerWidth),
  ).toBe(false);
  expect(errors).toEqual([]);
});
