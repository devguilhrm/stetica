import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { AccountUseCases } from "../../../application/account.use-cases";
import { FeedbackService } from "../../shared/feedback.service";
import {
  FormModel,
  PERSON_FIELDS,
  personInput,
} from "../../shared/person-form";
@Component({
  selector: "app-account-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./account-page.component.html",
})
export class AccountPageComponent {
  private readonly cases = inject(AccountUseCases);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  readonly personFields = PERSON_FIELDS;
  login = { email: "", senha: "" };
  signup: FormModel = {};
  busy = false;
  get customer() {
    return this.cases.customer;
  }
  go(view: string) {
    return this.router.navigate([view === "catalogo" ? "/" : "/" + view]);
  }
  async register(form: NgForm): Promise<void> {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    if (this.busy) return;
    this.busy = true;
    try {
      await this.cases.register({
        ...personInput(this.signup),
        senha: String(this.signup["senha"] ?? ""),
      });
      this.signup = {};
      await this.go("carrinho");
      this.feedback.notify("Cadastro realizado. Bem-vindo à Stetica.");
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.busy = false;
    }
  }
  async signIn(form: NgForm): Promise<void> {
    if (form.invalid || this.busy) return;
    this.busy = true;
    try {
      await this.cases.login(this.login);
      this.login = { email: "", senha: "" };
      await this.go("pedidos");
      this.feedback.notify("Você entrou na sua conta.");
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.busy = false;
    }
  }
  async logout(): Promise<void> {
    try {
      await this.cases.logout();
    } catch {
      /* A sessão local já foi removida mesmo se a rede estiver indisponível. */
    }
    await this.go("catalogo");
  }
}
