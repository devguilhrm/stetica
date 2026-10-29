import { Provider } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Cart } from "./domain/cart";
import { AccountUseCases } from "./application/account.use-cases";
import { AdminUseCases } from "./application/admin.use-cases";
import { CartUseCases } from "./application/cart.use-cases";
import { CatalogUseCases } from "./application/catalog.use-cases";
import { OrdersUseCases } from "./application/orders.use-cases";
import { BrowserSessionStore } from "./infrastructure/browser-session.store";
import { HttpApiClient } from "./infrastructure/http-api.client";
import { HttpAccountRepository } from "./infrastructure/http-account.repository";
import { HttpAdminRepository } from "./infrastructure/http-admin.repository";
import { HttpCatalogRepository } from "./infrastructure/http-catalog.repository";
import { HttpOrderRepository } from "./infrastructure/http-order.repository";

/** Composition root: único lugar que escolhe os adapters dos contratos da aplicação. */
export const APPLICATION_PROVIDERS: Provider[] = [
  {
    provide: BrowserSessionStore,
    useFactory: () => new BrowserSessionStore(window.sessionStorage),
  },
  {
    provide: HttpApiClient,
    useFactory: (http: HttpClient, session: BrowserSessionStore) =>
      new HttpApiClient(http, session),
    deps: [HttpClient, BrowserSessionStore],
  },
  {
    provide: HttpAccountRepository,
    useFactory: (api: HttpApiClient) => new HttpAccountRepository(api),
    deps: [HttpApiClient],
  },
  {
    provide: HttpCatalogRepository,
    useFactory: (api: HttpApiClient) => new HttpCatalogRepository(api),
    deps: [HttpApiClient],
  },
  {
    provide: HttpOrderRepository,
    useFactory: (api: HttpApiClient) => new HttpOrderRepository(api),
    deps: [HttpApiClient],
  },
  {
    provide: HttpAdminRepository,
    useFactory: (api: HttpApiClient) => new HttpAdminRepository(api),
    deps: [HttpApiClient],
  },
  { provide: Cart, useFactory: () => new Cart() },
  {
    provide: AccountUseCases,
    useFactory: (repo: HttpAccountRepository, session: BrowserSessionStore) =>
      new AccountUseCases(repo, session),
    deps: [HttpAccountRepository, BrowserSessionStore],
  },
  {
    provide: CatalogUseCases,
    useFactory: (repo: HttpCatalogRepository) => new CatalogUseCases(repo),
    deps: [HttpCatalogRepository],
  },
  {
    provide: CartUseCases,
    useFactory: (
      cart: Cart,
      repo: HttpOrderRepository,
      session: BrowserSessionStore,
    ) => new CartUseCases(cart, repo, session),
    deps: [Cart, HttpOrderRepository, BrowserSessionStore],
  },
  {
    provide: OrdersUseCases,
    useFactory: (repo: HttpOrderRepository, session: BrowserSessionStore) =>
      new OrdersUseCases(repo, session),
    deps: [HttpOrderRepository, BrowserSessionStore],
  },
  {
    provide: AdminUseCases,
    useFactory: (
      repo: HttpAdminRepository,
      orders: HttpOrderRepository,
      session: BrowserSessionStore,
    ) => new AdminUseCases(repo, orders, session),
    deps: [HttpAdminRepository, HttpOrderRepository, BrowserSessionStore],
  },
];
