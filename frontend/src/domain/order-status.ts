import { OrderStatus } from "./models";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  Aberto: ["Em processamento", "Cancelado"],
  "Em processamento": ["Concluído", "Cancelado"],
  Concluído: [],
  Cancelado: [],
};

export function canTransition(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return transitions[current].includes(next);
}
