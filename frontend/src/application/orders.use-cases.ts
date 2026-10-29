import { BusinessRuleError } from "../domain/errors";
import { OrderStatus } from "../domain/models";
import { canTransition } from "../domain/order-status";
import { SessionRequiredError } from "./errors";
import { OrderRepository, SessionStore } from "./ports";

export class OrdersUseCases {
  constructor(
    private readonly repository: OrderRepository,
    private readonly session: SessionStore,
  ) {}
  listMine() {
    this.requireSession();
    return this.repository.listMine();
  }
  getMine(id: number) {
    this.requireSession();
    return this.repository.getMine(id);
  }
  getAdmin(id: number) {
    return this.repository.getAdmin(id);
  }
  async changeStatus(
    id: number,
    current: OrderStatus,
    next: OrderStatus,
  ): Promise<void> {
    if (!canTransition(current, next))
      throw new BusinessRuleError("Transição de situação inválida.");
    await this.repository.changeStatus(id, next);
  }
  private requireSession(): void {
    if (!this.session.customer() || !this.session.token())
      throw new SessionRequiredError();
  }
}
