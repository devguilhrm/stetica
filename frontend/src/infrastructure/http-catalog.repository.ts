import { CatalogRepository } from "../application/ports";
import { CatalogQuery } from "../application/contracts";
import { CatalogItem, Category, TeamMember } from "../domain/models";
import { HttpApiClient } from "./http-api.client";

export class HttpCatalogRepository implements CatalogRepository {
  constructor(private readonly api: HttpApiClient) {}
  list(query: CatalogQuery): Promise<CatalogItem[]> {
    const params = new URLSearchParams();
    if (query.busca) params.set("busca", query.busca);
    if (query.categoriaId) params.set("categoriaId", String(query.categoriaId));
    if (query.tipo) params.set("tipo", query.tipo);
    const suffix = params.toString();
    return this.api.request("GET", "itens" + (suffix ? "?" + suffix : ""));
  }
  get(id: number): Promise<CatalogItem> {
    return this.api.request("GET", "itens/" + id);
  }
  categories(): Promise<Category[]> {
    return this.api.request("GET", "categorias");
  }
  team(): Promise<TeamMember[]> {
    return this.api.request("GET", "equipe");
  }
}
