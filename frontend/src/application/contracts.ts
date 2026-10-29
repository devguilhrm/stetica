import {
  Address,
  CatalogItem,
  CustomerSession,
  Dashboard,
  OrderLine,
  OrderStatus,
  Person,
  StockEntry,
  StockRecord,
} from "../domain/models";

export interface CatalogQuery {
  busca?: string;
  categoriaId?: number;
  tipo?: "P" | "S";
}
export interface LoginInput {
  email: string;
  senha: string;
}
export type PersonInput = Omit<Person, "id" | "ativo">;
export interface RegistrationInput extends PersonInput {
  senha: string;
}
export interface EmployeeInput extends PersonInput {
  cargo: string;
  dataAdmissao: string;
}
export interface ItemInput {
  nome: string;
  descricao: string;
  categoriaId: number;
  tipo: "P" | "S";
  preco: number;
  ativo: boolean;
  codigoPreco: number;
  unidade: string;
}
export interface CategoryInput {
  nome: string;
}
export type EntryInput = Omit<StockEntry, "id">;
export interface OrderInput {
  itens: Array<{ itemId: number; quantidade: number; funcionarioId: number }>;
}
export type AdminResource =
  | "itens"
  | "categorias"
  | "pessoas"
  | "funcionarios"
  | "estoque"
  | "entradaprodutos"
  | "pedidos";
export type AdminTab = "resumo" | AdminResource;
export type AdminWrite =
  | PersonInput
  | EmployeeInput
  | ItemInput
  | CategoryInput
  | EntryInput;

/** Projeção de leitura do painel; não é usada como comando de gravação. */
export type AdminRow = Partial<
  Person & CatalogItem & StockRecord & StockEntry
> & {
  id: number;
  cargo?: string;
  dataAdmissao?: string;
  pessoaId?: number;
  cliente?: string;
  status?: OrderStatus;
  total?: number;
};
export type AdminDetail = Partial<AdminRow> & {
  pessoa?: Person;
  itens?: OrderLine[];
};
export type { Address, CustomerSession, Dashboard };
