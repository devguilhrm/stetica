import {
  AccountRepository,
  AdminRepository,
  OrderRepository,
  SessionStore,
} from "../src/application/ports";
import {
  CustomerIdentity,
  CustomerSession,
  CatalogItem,
  OrderDetail,
} from "../src/domain/models";

export const item: CatalogItem = {
  id: 1,
  nome: "Produto",
  descricao: "Teste",
  categoriaId: 1,
  categoria: "Categoria",
  tipo: "P",
  ativo: true,
  preco: 10,
  precoCusto: 9,
  codigoPreco: 1,
  unidade: "UN",
  estoque: 2,
};
export const session: CustomerSession = {
  token: "token-ficticio-de-teste",
  cliente: { id: 1, nome: "Cliente", email: "cliente@example.test" },
};
export const order: OrderDetail = {
  id: 10,
  pessoaId: 1,
  data: "2026-01-01",
  status: "Aberto",
  total: 123,
  itens: [],
};
export class MemorySession implements SessionStore {
  value: CustomerSession | null = null;
  key: string | null = null;
  customer(): CustomerIdentity | null {
    return this.value?.cliente ?? null;
  }
  token(): string | null {
    return this.value?.token ?? null;
  }
  saveCustomer(value: CustomerSession) {
    this.value = value;
  }
  clearCustomer() {
    this.value = null;
  }
  adminKey() {
    return this.key;
  }
  saveAdminKey(key: string) {
    this.key = key;
  }
  clearAdminKey() {
    this.key = null;
  }
}
export function orderRepository(
  overrides: Partial<OrderRepository> = {},
): OrderRepository {
  return {
    create: async () => order,
    listMine: async () => [],
    getMine: async () => order,
    listAdmin: async () => [],
    getAdmin: async () => order,
    changeStatus: async () => {},
    ...overrides,
  };
}
export function accountRepository(
  overrides: Partial<AccountRepository> = {},
): AccountRepository {
  return {
    register: async () => session,
    login: async () => session,
    logout: async () => {},
    ...overrides,
  };
}
export function adminRepository(
  overrides: Partial<AdminRepository> = {},
): AdminRepository {
  const summary = {
    clientes: 1,
    produtos: 1,
    servicos: 1,
    pedidos: 1,
    abertos: 1,
    unidades: 2,
  };
  return {
    verify: async () => summary,
    summary: async () => summary,
    list: async () => [],
    get: async () => ({ id: 1 }),
    save: async () => {},
    remove: async () => {},
    ...overrides,
  };
}
