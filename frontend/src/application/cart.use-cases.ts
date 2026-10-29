import { Cart } from "../domain/cart";
import { BusinessRuleError } from "../domain/errors";
import { CatalogItem } from "../domain/models";
import { SessionRequiredError } from "./errors";
import { OrderRepository, SessionStore } from "./ports";

export class CartUseCases {
  private submitting = false;
  get pending(): boolean {
    return this.submitting;
  }
  constructor(
    private readonly cart: Cart,
    private readonly orders: OrderRepository,
    private readonly session: SessionStore,
  ) {}
  get items() {
    return this.cart.items;
  }
  get count() {
    return this.cart.count;
  }
  get total() {
    return this.cart.total;
  }
  add(item: CatalogItem, employeeId: number | null) {
    this.ensureEditable();
    this.cart.add(item, employeeId);
  }
  setQuantity(id: number, quantity: number) {
    this.ensureEditable();
    this.cart.setQuantity(id, quantity);
  }
  assignEmployee(id: number, employeeId: number | null) {
    this.ensureEditable();
    this.cart.assignEmployee(id, employeeId);
  }
  remove(id: number) {
    this.ensureEditable();
    this.cart.remove(id);
  }
  private ensureEditable(): void {
    if (this.submitting)
      throw new BusinessRuleError(
        "Um pedido já está sendo confirmado. Aguarde.",
      );
  }
  async checkout() {
    this.ensureEditable();
    if (!this.session.customer() || !this.session.token())
      throw new SessionRequiredError();
    const lines = this.cart.items;
    if (!lines.length) throw new BusinessRuleError("A sacola está vazia.");
    if (lines.some((line) => !line.funcionarioId))
      throw new BusinessRuleError("Selecione o funcionário de cada item.");
    this.submitting = true;
    try {
      const order = await this.orders.create({
        itens: lines.map((line) => ({
          itemId: line.id,
          quantidade: line.quantidade,
          funcionarioId: line.funcionarioId!,
        })),
      });
      // A sacola só é limpa depois da confirmação do servidor.
      this.cart.clear();
      return order;
    } finally {
      this.submitting = false;
    }
  }
}
