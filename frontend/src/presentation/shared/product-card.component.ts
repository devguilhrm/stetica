import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CatalogItem } from "../../domain/models";
@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [CommonModule],
  styles: [":host { display: block; }"],
  template: `<article class="product-card">
    <button
      class="product-image"
      [class.service]="i.tipo === 'S'"
      (click)="showDetail.emit(i)"
      [attr.aria-label]="'Ver detalhes de ' + i.nome"
    >
      <span class="tag">{{
        i.tipo === "S" ? "EXPERIÊNCIA" : "AUTOCUIDADO"
      }}</span>
      <div class="product-symbol">{{ i.tipo === "S" ? "✧" : "s." }}</div>
      <span class="image-caption">{{ i.categoria }}</span>
    </button>
    <div class="product-info">
      <span class="eyebrow">{{ i.categoria }}</span>
      <h3>
        <button (click)="showDetail.emit(i)">{{ i.nome }}</button>
      </h3>
      <p>{{ i.descricao }}</p>
      <div class="product-bottom">
        <div>
          <strong>{{
            i.preco | currency: "BRL" : "symbol" : "1.2-2" : "pt-BR"
          }}</strong
          ><small>{{
            i.tipo === "S"
              ? "Um momento para você"
              : i.estoque > 0
                ? "Disponível · " + i.estoque + " " + i.unidade
                : "Sem estoque"
          }}</small>
        </div>
        <button
          class="add"
          [disabled]="i.tipo === 'P' && i.estoque <= 0"
          [attr.aria-label]="'Adicionar ' + i.nome"
          (click)="addProduct.emit(i)"
        >
          +
        </button>
      </div>
    </div>
  </article>`,
})
export class ProductCardComponent {
  @Input({ required: true }) i!: CatalogItem;
  @Output() addProduct = new EventEmitter<CatalogItem>();
  @Output() showDetail = new EventEmitter<CatalogItem>();
}
