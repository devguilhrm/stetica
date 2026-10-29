import { OrderRepository } from "../application/ports";
import { OrderInput } from "../application/contracts";
import { OrderDetail, OrderStatus, OrderSummary } from "../domain/models";
import { HttpApiClient } from "./http-api.client";

export class HttpOrderRepository implements OrderRepository {
  constructor(private readonly api: HttpApiClient) {}
  create(input: OrderInput): Promise<OrderDetail> {
    return this.api.request("POST", "pedidos", input);
  }
  listMine(): Promise<OrderSummary[]> {
    return this.api.request("GET", "meus-pedidos");
  }
  getMine(id: number): Promise<OrderDetail> {
    return this.api.request("GET", "meus-pedidos/" + id);
  }
  listAdmin(status?: OrderStatus): Promise<OrderSummary[]> {
    return this.api.request(
      "GET",
      "pedidos" + (status ? "?status=" + encodeURIComponent(status) : ""),
    );
  }
  getAdmin(id: number): Promise<OrderDetail> {
    return this.api.request("GET", "pedidos/" + id);
  }
  changeStatus(id: number, status: OrderStatus): Promise<void> {
    return this.api.request("PUT", "pedidos/" + id + "/status", { status });
  }
}
