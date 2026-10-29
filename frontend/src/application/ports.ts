import {
  CatalogItem,
  Category,
  CustomerIdentity,
  CustomerSession,
  Dashboard,
  OrderDetail,
  OrderStatus,
  OrderSummary,
  TeamMember,
} from "../domain/models";
import {
  AdminDetail,
  AdminResource,
  AdminRow,
  AdminWrite,
  CatalogQuery,
  LoginInput,
  OrderInput,
  RegistrationInput,
} from "./contracts";

export interface CatalogRepository {
  list(query: CatalogQuery): Promise<CatalogItem[]>;
  get(id: number): Promise<CatalogItem>;
  categories(): Promise<Category[]>;
  team(): Promise<TeamMember[]>;
}
export interface AccountRepository {
  register(input: RegistrationInput): Promise<CustomerSession>;
  login(input: LoginInput): Promise<CustomerSession>;
  logout(): Promise<void>;
}
export interface OrderRepository {
  create(input: OrderInput): Promise<OrderDetail>;
  listMine(): Promise<OrderSummary[]>;
  getMine(id: number): Promise<OrderDetail>;
  listAdmin(status?: OrderStatus): Promise<OrderSummary[]>;
  getAdmin(id: number): Promise<OrderDetail>;
  changeStatus(id: number, status: OrderStatus): Promise<void>;
}
export interface AdminRepository {
  verify(key: string): Promise<Dashboard>;
  summary(): Promise<Dashboard>;
  list(resource: Exclude<AdminResource, "pedidos">): Promise<AdminRow[]>;
  get(
    resource: Exclude<AdminResource, "pedidos">,
    id: number,
  ): Promise<AdminDetail>;
  save(
    resource: AdminResource,
    id: number | null,
    input: AdminWrite,
  ): Promise<void>;
  remove(resource: AdminResource, id: number): Promise<void>;
}
export interface SessionStore {
  customer(): CustomerIdentity | null;
  token(): string | null;
  saveCustomer(session: CustomerSession): void;
  clearCustomer(): void;
  adminKey(): string | null;
  saveAdminKey(key: string): void;
  clearAdminKey(): void;
}
