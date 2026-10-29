import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AccountUseCases } from "../../../application/account.use-cases";
import { CartUseCases } from "../../../application/cart.use-cases";
import { CatalogUseCases } from "../../../application/catalog.use-cases";
import { SessionRequiredError } from "../../../application/errors";
import { TeamMember } from "../../../domain/models";
import { FeedbackService } from "../../shared/feedback.service";
@Component({
  selector: "app-cart-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./cart-page.component.html",
})
export class CartPageComponent implements OnInit {
  private readonly cases = inject(CartUseCases);
  private readonly account = inject(AccountUseCases);
  private readonly catalog = inject(CatalogUseCases);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  equipe: TeamMember[] = [];
  private processing = false;
  get busy(): boolean {
    return this.processing || this.cases.pending;
  }
  get cart() {
    return this.cases.items;
  }
  get cartCount() {
    return this.cases.count;
  }
  get total() {
    return this.cases.total;
  }
  get customer() {
    return this.account.customer;
  }
  async ngOnInit(): Promise<void> {
    try {
      this.equipe = await this.catalog.team();
    } catch (error) {
      this.feedback.fail(error);
    }
  }
  go(view: string) {
    return this.router.navigate([view === "catalogo" ? "/" : "/" + view]);
  }
  quantity(id: number, quantity: number): void {
    try {
      this.cases.setQuantity(id, quantity);
    } catch (error) {
      this.feedback.fail(error);
    }
  }
  assignEmployee(id: number, employeeId: number | null): void {
    try {
      this.cases.assignEmployee(id, employeeId);
    } catch (error) {
      this.feedback.fail(error);
    }
  }
  remove(id: number): void {
    try {
      this.cases.remove(id);
    } catch (error) {
      this.feedback.fail(error);
    }
  }
  async checkout(): Promise<void> {
    if (this.busy) return;
    this.processing = true;
    try {
      const order = await this.cases.checkout();
      await this.router.navigate(["/pedidos"], { state: { order } });
      this.feedback.notify("Pedido #" + order.id + " registrado.");
    } catch (error) {
      if (error instanceof SessionRequiredError) await this.go("conta");
      else this.feedback.fail(error);
    } finally {
      this.processing = false;
    }
  }
}
