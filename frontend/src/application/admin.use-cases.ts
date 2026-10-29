import { AdminResource, AdminWrite } from "./contracts";
import { BusinessRuleError } from "../domain/errors";
import { OrderStatus } from "../domain/models";
import { AdminRepository, OrderRepository, SessionStore } from "./ports";

export class AdminUseCases {
  constructor(
    private readonly repository: AdminRepository,
    private readonly orders: OrderRepository,
    private readonly session: SessionStore,
  ) {}
  get authenticated(): boolean {
    return !!this.session.adminKey();
  }
  async login(key: string) {
    if (key.length < 16)
      throw new BusinessRuleError(
        "Informe uma chave administrativa com pelo menos 16 caracteres.",
      );
    const summary = await this.repository.verify(key);
    this.session.saveAdminKey(key);
    return summary;
  }
  logout(): void {
    this.session.clearAdminKey();
  }
  summary() {
    return this.repository.summary();
  }
  list(resource: AdminResource, status?: OrderStatus) {
    return resource === "pedidos"
      ? this.orders.listAdmin(status)
      : this.repository.list(resource);
  }
  get(resource: AdminResource, id: number) {
    if (!Number.isSafeInteger(id) || id <= 0)
      throw new BusinessRuleError("Informe um ID numérico válido.");
    return resource === "pedidos"
      ? this.orders.getAdmin(id)
      : this.repository.get(resource, id);
  }
  save(resource: AdminResource, id: number | null, input: AdminWrite) {
    return this.repository.save(resource, id, input);
  }
  remove(resource: AdminResource, id: number) {
    return this.repository.remove(resource, id);
  }
}
