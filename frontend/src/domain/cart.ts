import { BusinessRuleError } from "./errors";
import { CatalogItem } from "./models";

export interface CartLine extends CatalogItem {
  quantidade: number;
  funcionarioId: number | null;
}

/** Regras locais de seleção. Saldo e preço finais continuam validados pelo backend. */
export class Cart {
  private lines: CartLine[] = [];

  get items(): ReadonlyArray<Readonly<CartLine>> {
    return this.lines.map((line) => ({ ...line }));
  }

  get count(): number {
    return this.lines.reduce((sum, line) => sum + line.quantidade, 0);
  }

  get total(): number {
    return (
      this.lines.reduce(
        (cents, line) => cents + Math.round(line.preco * 100) * line.quantidade,
        0,
      ) / 100
    );
  }

  add(item: CatalogItem, employeeId: number | null): void {
    if (!item.ativo) throw new BusinessRuleError("Item indisponível.");
    if (item.tipo === "P" && item.estoque <= 0)
      throw new BusinessRuleError("Produto sem estoque.");
    const line = this.lines.find((value) => value.id === item.id);
    if (line) {
      if (item.tipo === "S")
        throw new BusinessRuleError("O serviço já está no carrinho.");
      if (line.quantidade >= line.estoque)
        throw new BusinessRuleError("Quantidade indisponível.");
      line.quantidade++;
    } else {
      this.lines.push({ ...item, quantidade: 1, funcionarioId: employeeId });
    }
  }

  setQuantity(id: number, quantity: number): void {
    const line = this.find(id);
    if (line.tipo === "S") {
      line.quantidade = 1;
      return;
    }
    line.quantidade = Math.max(
      1,
      Math.min(line.estoque, Math.floor(Number(quantity) || 1)),
    );
  }

  assignEmployee(id: number, employeeId: number | null): void {
    if (
      employeeId !== null &&
      (!Number.isInteger(employeeId) || employeeId <= 0)
    ) {
      throw new BusinessRuleError("Selecione um funcionário válido.");
    }
    this.find(id).funcionarioId = employeeId;
  }

  remove(id: number): void {
    this.lines = this.lines.filter((line) => line.id !== id);
  }

  clear(): void {
    this.lines = [];
  }

  private find(id: number): CartLine {
    const line = this.lines.find((value) => value.id === id);
    if (!line) throw new BusinessRuleError("Item não encontrado na sacola.");
    return line;
  }
}
