import { AdminRepository } from "../application/ports";
import {
  AdminDetail,
  AdminResource,
  AdminRow,
  AdminWrite,
} from "../application/contracts";
import { Dashboard } from "../domain/models";
import { HttpApiClient } from "./http-api.client";

export class HttpAdminRepository implements AdminRepository {
  constructor(private readonly api: HttpApiClient) {}
  verify(key: string): Promise<Dashboard> {
    return this.api.request("GET", "resumo", undefined, { "X-Admin-Key": key });
  }
  summary(): Promise<Dashboard> {
    return this.api.request("GET", "resumo");
  }
  list(resource: Exclude<AdminResource, "pedidos">): Promise<AdminRow[]> {
    return this.api.request(
      "GET",
      resource === "itens" ? "admin/itens" : resource,
    );
  }
  get(
    resource: Exclude<AdminResource, "pedidos">,
    id: number,
  ): Promise<AdminDetail> {
    return this.api.request("GET", resource + "/" + id);
  }
  async save(
    resource: AdminResource,
    id: number | null,
    input: AdminWrite,
  ): Promise<void> {
    await this.api.request(
      id === null ? "POST" : "PUT",
      resource + (id === null ? "" : "/" + id),
      input,
    );
  }
  remove(resource: AdminResource, id: number): Promise<void> {
    return this.api.request("DELETE", resource + "/" + id);
  }
}
