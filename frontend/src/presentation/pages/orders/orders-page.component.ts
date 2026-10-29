import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AccountUseCases } from "../../../application/account.use-cases";
import { OrdersUseCases } from "../../../application/orders.use-cases";
import { OrderDetail, OrderSummary } from "../../../domain/models";
import { FeedbackService } from "../../shared/feedback.service";
import { RecordDetailComponent } from "../../shared/record-detail.component";
@Component({
  selector: "app-orders-page",
  standalone: true,
  imports: [CommonModule, RecordDetailComponent],
  templateUrl: "./orders-page.component.html",
})
export class OrdersPageComponent implements OnInit {
  private readonly cases = inject(OrdersUseCases);
  private readonly account = inject(AccountUseCases);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  rows: OrderSummary[] = [];
  detail: OrderDetail | null =
    (this.router.getCurrentNavigation()?.extras.state?.["order"] as
      | OrderDetail
      | undefined) ?? null;
  loading = false;
  get customer() {
    return this.account.customer;
  }
  go(view: string) {
    return this.router.navigate(["/" + view]);
  }
  async ngOnInit(): Promise<void> {
    if (!this.customer) return;
    this.loading = true;
    try {
      this.rows = await this.cases.listMine();
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.loading = false;
    }
  }
  async orderDetail(id: number): Promise<void> {
    try {
      this.detail = await this.cases.getMine(id);
    } catch (error) {
      this.feedback.fail(error);
    }
  }
}
