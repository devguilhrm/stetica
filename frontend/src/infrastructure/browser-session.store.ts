import { SessionStore } from "../application/ports";
import { CustomerIdentity, CustomerSession } from "../domain/models";

/** Adapter browser. O contrato Storage permite usar memória nos testes e outro meio no futuro. */
export class BrowserSessionStore implements SessionStore {
  constructor(
    private readonly storage: Pick<
      Storage,
      "getItem" | "setItem" | "removeItem"
    >,
  ) {}
  customer(): CustomerIdentity | null {
    const raw = this.storage.getItem("stetica-cliente");
    if (!raw) return null;
    try {
      const value: unknown = JSON.parse(raw);
      if (
        value &&
        typeof value === "object" &&
        "id" in value &&
        typeof value.id === "number" &&
        "nome" in value &&
        typeof value.nome === "string" &&
        "email" in value &&
        typeof value.email === "string"
      ) {
        return { id: value.id, nome: value.nome, email: value.email };
      }
    } catch {
      /* Sessão inválida não deve impedir a abertura da loja. */
    }
    this.clearCustomer();
    return null;
  }
  token(): string | null {
    return this.storage.getItem("stetica-token");
  }
  saveCustomer(session: CustomerSession): void {
    this.storage.setItem("stetica-token", session.token);
    this.storage.setItem("stetica-cliente", JSON.stringify(session.cliente));
  }
  clearCustomer(): void {
    this.storage.removeItem("stetica-token");
    this.storage.removeItem("stetica-cliente");
  }
  adminKey(): string | null {
    return this.storage.getItem("stetica-admin");
  }
  saveAdminKey(key: string): void {
    this.storage.setItem("stetica-admin", key);
  }
  clearAdminKey(): void {
    this.storage.removeItem("stetica-admin");
  }
}
