export type ItemType = "P" | "S";
export type OrderStatus =
  | "Aberto"
  | "Em processamento"
  | "Concluído"
  | "Cancelado";
export interface Category {
  id: number;
  nome: string;
}
export interface TeamMember {
  id: number;
  nome: string;
  cargo: string;
}
export interface CatalogItem {
  id: number;
  nome: string;
  descricao: string;
  categoriaId: number;
  categoria: string;
  tipo: ItemType;
  ativo: boolean;
  preco: number;
  precoCusto: number;
  codigoPreco: number;
  unidade: string;
  estoque: number;
}
export interface Address {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  numero: string;
  complemento: string;
}
export interface Person {
  id: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  sexo: string;
  email: string;
  telefone: string;
  ativo: boolean;
  endereco: Address;
}
export interface Employee extends Person {
  cargo: string;
  dataAdmissao: string;
}
export interface CustomerIdentity {
  id: number;
  nome: string;
  email: string;
}
export interface CustomerSession {
  token: string;
  cliente: CustomerIdentity;
}
export interface OrderSummary {
  id: number;
  pessoaId: number;
  cliente?: string;
  data: string;
  status: OrderStatus;
  total: number;
}
export interface OrderLine {
  itemId: number;
  nome: string;
  tipo: ItemType;
  quantidade: number;
  valorUnitario: number;
  funcionarioId: number;
  funcionario: string;
  cargo: string;
}
export interface OrderDetail extends OrderSummary {
  itens: OrderLine[];
}
export interface StockRecord {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  precoVenda: number;
  unidade: string;
  categoria: string;
  quantidade: number;
  ativo: boolean;
}
export interface StockEntry {
  id: number;
  produtoId: number;
  data: string;
  quantidade: number;
  valorUnitario: number;
}
export interface Dashboard {
  clientes: number;
  produtos: number;
  servicos: number;
  pedidos: number;
  abertos: number;
  unidades: number;
}
