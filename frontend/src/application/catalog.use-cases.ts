import { CatalogQuery } from "./contracts";
import { CatalogRepository } from "./ports";

export class CatalogUseCases {
  constructor(private readonly repository: CatalogRepository) {}
  async load(query: CatalogQuery = {}) {
    const [items, categories, team] = await Promise.all([
      this.repository.list(query),
      this.repository.categories(),
      this.repository.team(),
    ]);
    return { items, categories, team };
  }
  get(id: number) {
    return this.repository.get(id);
  }
  categories() {
    return this.repository.categories();
  }
  team() {
    return this.repository.team();
  }
}
