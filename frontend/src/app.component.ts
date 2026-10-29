import { Component, inject } from "@angular/core";
import {
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { AccountUseCases } from "./application/account.use-cases";
import { CartUseCases } from "./application/cart.use-cases";
import { FeedbackService } from "./presentation/shared/feedback.service";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./app.component.html",
})
export class AppComponent {
  private readonly account = inject(AccountUseCases);
  private readonly cart = inject(CartUseCases);
  readonly feedback = inject(FeedbackService);
  get customer() {
    return this.account.customer;
  }
  get cartCount() {
    return this.cart.count;
  }
  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.feedback.clear());
  }
}
