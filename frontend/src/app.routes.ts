import { Routes } from "@angular/router";
export const APP_ROUTES: Routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () =>
      import("./presentation/pages/catalog/catalog-page.component").then(
        (m) => m.CatalogPageComponent,
      ),
  },
  {
    path: "carrinho",
    loadComponent: () =>
      import("./presentation/pages/cart/cart-page.component").then(
        (m) => m.CartPageComponent,
      ),
  },
  {
    path: "conta",
    loadComponent: () =>
      import("./presentation/pages/account/account-page.component").then(
        (m) => m.AccountPageComponent,
      ),
  },
  {
    path: "pedidos",
    loadComponent: () =>
      import("./presentation/pages/orders/orders-page.component").then(
        (m) => m.OrdersPageComponent,
      ),
  },
  {
    path: "admin",
    loadComponent: () =>
      import("./presentation/pages/admin/admin-page.component").then(
        (m) => m.AdminPageComponent,
      ),
  },
  { path: "**", redirectTo: "" },
];
