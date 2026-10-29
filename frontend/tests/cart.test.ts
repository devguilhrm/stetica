import test from "node:test";
import assert from "node:assert/strict";
import { Cart, CartLine } from "../src/domain/cart";
import { CartUseCases } from "../src/application/cart.use-cases";
import { SessionRequiredError } from "../src/application/errors";
import {
  item,
  MemorySession,
  order,
  orderRepository,
  session,
} from "./fixtures";

test("carrinho calcula valores em centavos sem erro de ponto flutuante", () => {
  const cart = new Cart();
  cart.add({ ...item, preco: 0.1 }, 1);
  cart.add({ ...item, id: 2, preco: 0.2 }, 1);
  assert.equal(cart.total, 0.3);
  assert.equal(cart.count, 2);
});
test("produto inativo e produto sem estoque são recusados", () => {
  const cart = new Cart();
  assert.throws(() => cart.add({ ...item, ativo: false }, 1), /indisponível/);
  assert.throws(() => cart.add({ ...item, estoque: 0 }, 1), /sem estoque/);
  assert.equal(cart.count, 0);
});
test("adições do mesmo produto respeitam o estoque", () => {
  const cart = new Cart();
  cart.add(item, 1);
  cart.add(item, 1);
  assert.throws(() => cart.add(item, 1), /indisponível/);
  assert.equal(cart.count, 2);
});
test("serviços não usam estoque e não são duplicados", () => {
  const cart = new Cart();
  const service = { ...item, tipo: "S" as const, estoque: 0 };
  cart.add(service, 1);
  cart.setQuantity(service.id, 4);
  assert.equal(cart.count, 1);
  assert.throws(() => cart.add(service, 1), /já está/);
});
test("quantidades de produtos são inteiras, positivas e limitadas ao saldo", () => {
  const cart = new Cart();
  cart.add(item, 1);
  cart.setQuantity(1, 100);
  assert.equal(cart.count, 2);
  cart.setQuantity(1, -10);
  assert.equal(cart.count, 1);
  cart.setQuantity(1, Number.NaN);
  assert.equal(cart.count, 1);
  cart.setQuantity(1, 1.8);
  assert.equal(cart.count, 1);
});
test("consumidores não modificam o estado interno através das leituras", () => {
  const cart = new Cart();
  cart.add(item, 1);
  const snapshot = cart.items[0] as CartLine;
  snapshot.quantidade = 999;
  assert.equal(cart.count, 1);
  cart.remove(1);
  assert.equal(cart.total, 0);
});
test("funcionário inválido não é aceito", () => {
  const cart = new Cart();
  cart.add(item, null);
  assert.throws(() => cart.assignEmployee(1, -1), /funcionário válido/);
  cart.assignEmployee(1, 7);
  assert.equal(cart.items[0].funcionarioId, 7);
});
test("checkout sem sessão não envia pedido", async () => {
  const cart = new Cart();
  cart.add(item, 1);
  let calls = 0;
  const cases = new CartUseCases(
    cart,
    orderRepository({
      create: async () => {
        calls++;
        return order;
      },
    }),
    new MemorySession(),
  );
  await assert.rejects(() => cases.checkout(), SessionRequiredError);
  assert.equal(calls, 0);
});
test("checkout exige itens e funcionário antes de enviar", async () => {
  const cart = new Cart();
  const store = new MemorySession();
  store.value = session;
  const cases = new CartUseCases(cart, orderRepository(), store);
  await assert.rejects(() => cases.checkout(), /vazia/);
  cart.add(item, null);
  await assert.rejects(() => cases.checkout(), /funcionário/);
});
test("falha na confirmação preserva o carrinho para tentar novamente", async () => {
  const cart = new Cart();
  cart.add(item, 1);
  const store = new MemorySession();
  store.value = session;
  const cases = new CartUseCases(
    cart,
    orderRepository({
      create: async () => {
        throw new Error("Sem estoque");
      },
    }),
    store,
  );
  await assert.rejects(() => cases.checkout(), /Sem estoque/);
  assert.equal(cart.count, 1);
});
test("checkout envia somente IDs/quantidades e usa o total confirmado pelo servidor", async () => {
  const cart = new Cart();
  cart.add(item, 2);
  const store = new MemorySession();
  store.value = session;
  const repo = orderRepository({
    create: async (input) => {
      assert.deepEqual(input, {
        itens: [{ itemId: 1, quantidade: 1, funcionarioId: 2 }],
      });
      return order;
    },
  });
  const result = await new CartUseCases(cart, repo, store).checkout();
  assert.equal(result.total, 123);
  assert.equal(cart.count, 0);
});

test("uma confirmação em andamento sobrevive à navegação e não duplica o pedido", async () => {
  const cart = new Cart();
  cart.add(item, 1);
  const store = new MemorySession();
  store.value = session;
  let finish!: (value: typeof order) => void;
  let calls = 0;
  const cases = new CartUseCases(
    cart,
    orderRepository({
      create: () => {
        calls++;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    }),
    store,
  );
  const first = cases.checkout();
  assert.equal(cases.pending, true);
  await assert.rejects(() => cases.checkout(), /Aguarde/);
  assert.throws(() => cases.add({ ...item, id: 2 }, 1), /Aguarde/);
  assert.equal(calls, 1);
  finish(order);
  await first;
  assert.equal(cases.pending, false);
  cases.add(item, 1);
  assert.equal(cases.count, 1);
});
