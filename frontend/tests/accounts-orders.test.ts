import test from "node:test";
import assert from "node:assert/strict";
import { AccountUseCases } from "../src/application/account.use-cases";
import { AdminUseCases } from "../src/application/admin.use-cases";
import { OrdersUseCases } from "../src/application/orders.use-cases";
import { BrowserSessionStore } from "../src/infrastructure/browser-session.store";
import {
  MemorySession,
  accountRepository,
  adminRepository,
  orderRepository,
  session,
} from "./fixtures";

test("login só persiste a sessão depois da confirmação do repositório", async () => {
  const store = new MemorySession();
  const cases = new AccountUseCases(
    accountRepository({
      login: async () => {
        assert.equal(store.customer(), null);
        return session;
      },
    }),
    store,
  );
  await cases.login({ email: session.cliente.email, senha: "senha-de-teste" });
  assert.deepEqual(store.customer(), session.cliente);
});
test("login recusado não salva credenciais do cliente", async () => {
  const store = new MemorySession();
  const cases = new AccountUseCases(
    accountRepository({
      login: async () => {
        throw new Error("Senha inválida");
      },
    }),
    store,
  );
  await assert.rejects(
    () => cases.login({ email: "", senha: "" }),
    /Senha inválida/,
  );
  assert.equal(store.token(), null);
});
test("logout limpa a sessão local mesmo com falha de rede", async () => {
  const store = new MemorySession();
  store.value = session;
  const cases = new AccountUseCases(
    accountRepository({
      logout: async () => {
        throw new Error("offline");
      },
    }),
    store,
  );
  await assert.rejects(() => cases.logout());
  assert.equal(store.customer(), null);
  assert.equal(store.token(), null);
});
test("chave administrativa recusada não é persistida", async () => {
  const store = new MemorySession();
  const cases = new AdminUseCases(
    adminRepository({
      verify: async () => {
        throw new Error("Inválida");
      },
    }),
    orderRepository(),
    store,
  );
  await assert.rejects(
    () => cases.login("chave-ficticia-de-teste"),
    /Inválida/,
  );
  assert.equal(store.adminKey(), null);
});
test("chave administrativa é salva após a verificação e pode ser removida", async () => {
  const store = new MemorySession();
  const cases = new AdminUseCases(
    adminRepository({
      verify: async (key) => {
        assert.equal(store.adminKey(), null);
        assert.equal(key, "chave-ficticia-de-teste");
        return {
          clientes: 1,
          produtos: 1,
          servicos: 1,
          pedidos: 1,
          abertos: 1,
          unidades: 1,
        };
      },
    }),
    orderRepository(),
    store,
  );
  await cases.login("chave-ficticia-de-teste");
  assert.equal(cases.authenticated, true);
  cases.logout();
  assert.equal(cases.authenticated, false);
});
test("consulta do cliente usa o repositório de pedidos próprios", async () => {
  const store = new MemorySession();
  store.value = session;
  let mine = 0;
  const cases = new OrdersUseCases(
    orderRepository({
      listMine: async () => {
        mine++;
        return [];
      },
      listAdmin: async () => {
        throw new Error("Não deve consultar o painel");
      },
    }),
    store,
  );
  await cases.listMine();
  assert.equal(mine, 1);
  store.clearCustomer();
  assert.throws(() => cases.listMine(), /Entre/);
});
test("situação final não pode mudar e transição válida é encaminhada ao backend", async () => {
  let calls = 0;
  const cases = new OrdersUseCases(
    orderRepository({
      changeStatus: async (id, status) => {
        assert.equal(id, 10);
        assert.equal(status, "Em processamento");
        calls++;
      },
    }),
    new MemorySession(),
  );
  await assert.rejects(
    () => cases.changeStatus(10, "Concluído", "Cancelado"),
    /inválida/,
  );
  await cases.changeStatus(10, "Aberto", "Em processamento");
  assert.equal(calls, 1);
});
test("JSON de sessão corrompido não quebra a loja e elimina token inválido", () => {
  const values = new Map([
    ["stetica-cliente", "{inválido"],
    ["stetica-token", "token-antigo"],
  ]);
  const store = new BrowserSessionStore({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  });
  assert.equal(store.customer(), null);
  assert.equal(store.token(), null);
});
test("sessão de formato inesperado é rejeitada e chave administrativa não é removida", () => {
  const values = new Map([
    ["stetica-cliente", JSON.stringify({ nome: 123 })],
    ["stetica-admin", "chave-ficticia"],
  ]);
  const store = new BrowserSessionStore({
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  });
  assert.equal(store.customer(), null);
  assert.equal(store.adminKey(), "chave-ficticia");
});
