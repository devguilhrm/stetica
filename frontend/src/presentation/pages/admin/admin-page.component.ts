import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { AdminUseCases } from "../../../application/admin.use-cases";
import { CatalogUseCases } from "../../../application/catalog.use-cases";
import { OrdersUseCases } from "../../../application/orders.use-cases";
import {
  AdminDetail,
  AdminRow,
  AdminTab,
} from "../../../application/contracts";
import { Category, Dashboard, OrderStatus } from "../../../domain/models";
import { FeedbackService } from "../../shared/feedback.service";
import { FormModel } from "../../shared/person-form";
import { RecordDetailComponent } from "../../shared/record-detail.component";
import { columnLabel, displayValue } from "../../shared/record-format";
import {
  ADMIN_COLUMNS,
  ADMIN_MENU,
  adminFields,
  adminInput,
  editAdminForm,
  newAdminForm,
} from "./admin-form";
@Component({
  selector: "app-admin-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RecordDetailComponent],
  templateUrl: "./admin-page.component.html",
})
export class AdminPageComponent implements OnInit {
  private readonly cases = inject(AdminUseCases);
  private readonly catalog = inject(CatalogUseCases);
  private readonly orders = inject(OrdersUseCases);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly document = inject(DOCUMENT);
  private loadVersion = 0;
  readonly menu = ADMIN_MENU;
  readonly label = columnLabel;
  readonly display = displayValue;
  tab: AdminTab = "resumo";
  adminKey = "";
  admin = false;
  busy = false;
  loading = false;
  idSearch: string | number = "";
  statusFilter: OrderStatus | "" = "";
  editing: number | null = null;
  model: FormModel = newAdminForm();
  categorias: Category[] = [];
  itens: AdminRow[] = [];
  rows: AdminRow[] = [];
  detail: AdminDetail | null = null;
  summary: Dashboard = {
    clientes: 0,
    produtos: 0,
    servicos: 0,
    pedidos: 0,
    abertos: 0,
    unidades: 0,
  };
  get title() {
    return this.menu.find((item) => item.key === this.tab)?.label ?? "";
  }
  get fields() {
    return adminFields(this.tab, this.model, this.categorias, this.itens);
  }
  get columns() {
    return this.tab === "resumo" ? [] : ADMIN_COLUMNS[this.tab];
  }
  get canCreate() {
    return ["itens", "categorias", "funcionarios", "entradaprodutos"].includes(
      this.tab,
    );
  }
  get canEdit() {
    return ["itens", "categorias", "funcionarios", "pessoas"].includes(
      this.tab,
    );
  }
  async ngOnInit(): Promise<void> {
    if (!this.cases.authenticated) return;
    try {
      this.summary = await this.cases.summary();
      this.admin = true;
    } catch {
      this.cases.logout();
    }
  }
  async enterAdmin(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      this.summary = await this.cases.login(this.adminKey);
      this.admin = true;
      this.adminKey = "";
      this.tab = "resumo";
      this.feedback.clear();
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.busy = false;
    }
  }
  leaveAdmin(): void {
    this.cases.logout();
    this.admin = false;
    void this.router.navigate(["/"]);
  }
  resetForm(form?: NgForm): void {
    this.editing = null;
    this.model = newAdminForm();
    form?.resetForm(this.model);
  }
  async openTab(tab: AdminTab): Promise<void> {
    const version = ++this.loadVersion;
    this.tab = tab;
    this.detail = null;
    this.idSearch = "";
    this.rows = [];
    this.resetForm();
    this.feedback.clear();
    this.loading = true;
    try {
      const categories = await this.catalog.categories();
      const items = ["itens", "entradaprodutos"].includes(tab)
        ? await this.cases.list("itens")
        : [];
      const summary =
        tab === "resumo" ? await this.cases.summary() : this.summary;
      const rows =
        tab === "resumo"
          ? []
          : await this.cases.list(tab, this.statusFilter || undefined);
      if (version !== this.loadVersion) return;
      this.categorias = categories;
      this.itens = items;
      this.summary = summary;
      this.rows = rows;
    } catch (error) {
      if (version === this.loadVersion) this.feedback.fail(error);
    } finally {
      if (version === this.loadVersion) this.loading = false;
    }
  }
  private async loadRows(): Promise<void> {
    if (this.tab !== "resumo")
      this.rows = await this.cases.list(
        this.tab,
        this.statusFilter || undefined,
      );
  }
  async findId(): Promise<void> {
    if (this.tab === "resumo") return;
    try {
      this.detail = await this.cases.get(this.tab, Number(this.idSearch));
      this.feedback.notify("Registro encontrado.");
    } catch (error) {
      this.detail = null;
      this.feedback.fail(error);
    }
  }
  edit(row: AdminRow): void {
    this.editing = row.id;
    this.model = editAdminForm(row, this.tab);
    this.document
      .getElementById("editor")
      ?.scrollIntoView({ behavior: "smooth" });
  }
  async save(form: NgForm): Promise<void> {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    if (this.busy || this.tab === "resumo") return;
    this.busy = true;
    try {
      await this.cases.save(
        this.tab,
        this.editing,
        adminInput(this.tab, this.model),
      );
      this.resetForm(form);
      await this.loadRows();
      this.feedback.notify("Dados salvos com sucesso.");
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.busy = false;
    }
  }
  async remove(row: AdminRow): Promise<void> {
    if (this.busy || this.tab === "resumo") return;
    if (
      !confirm(
        this.tab === "categorias"
          ? "Excluir esta categoria?"
          : "Desativar este registro?",
      )
    )
      return;
    this.busy = true;
    try {
      await this.cases.remove(this.tab, row.id);
      await this.loadRows();
      this.feedback.notify("Operação realizada.");
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.busy = false;
    }
  }
  async orderDetail(id: number): Promise<void> {
    try {
      this.detail = await this.orders.getAdmin(id);
    } catch (error) {
      this.feedback.fail(error);
    }
  }
  async changeStatus(next: OrderStatus): Promise<void> {
    if (this.busy || !this.detail?.id || !this.detail.status) return;
    this.busy = true;
    const id = this.detail.id;
    try {
      await this.orders.changeStatus(id, this.detail.status, next);
      this.detail = await this.orders.getAdmin(id);
      await this.loadRows();
      this.feedback.notify("Situação atualizada.");
    } catch (error) {
      this.feedback.fail(error);
    } finally {
      this.busy = false;
    }
  }
}
