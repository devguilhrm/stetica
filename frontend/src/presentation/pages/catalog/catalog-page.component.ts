import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CatalogUseCases } from "../../../application/catalog.use-cases";
import { CartUseCases } from "../../../application/cart.use-cases";
import { CatalogItem, Category, TeamMember } from "../../../domain/models";
import { FeedbackService } from "../../shared/feedback.service";
import { ProductCardComponent } from "../../shared/product-card.component";
@Component({
  selector: "app-catalog-page",
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: "./catalog-page.component.html",
})
export class CatalogPageComponent implements OnInit {
  private readonly catalog = inject(CatalogUseCases);
  private readonly cart = inject(CartUseCases);
  private readonly feedback = inject(FeedbackService);
  busca = "";
  categoria = "";
  tipo: "" | "P" | "S" = "";
  itens: CatalogItem[] = [];
  categorias: Category[] = [];
  equipe: TeamMember[] = [];
  selectedItem: CatalogItem | null = null;
  loading = false;
  async ngOnInit() {
    await this.loadCatalog();
  }
  async loadCatalog(): Promise<void> {
    this.loading = true;
    try {
      const result = await this.catalog.load({
        busca: this.busca,
        categoriaId: this.categoria ? Number(this.categoria) : undefined,
        tipo: this.tipo || undefined,
      });
      this.itens = result.items;
      this.categorias = result.categories;
      this.equipe = result.team;
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.loading = false;
    }
  }
  add(item: CatalogItem): void {
    try {
      this.cart.add(item, this.equipe[0]?.id ?? null);
      this.feedback.notify(item.nome + " adicionado ao carrinho.");
    } catch (error) {
      this.feedback.fail(error);
    }
  }
  async itemDetail(item: CatalogItem): Promise<void> {
    try {
      this.selectedItem = await this.catalog.get(item.id);
    } catch (error) {
      this.feedback.fail(error);
    }
  }
}
