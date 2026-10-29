import { LoginInput, RegistrationInput } from "./contracts";
import { AccountRepository, SessionStore } from "./ports";

export class AccountUseCases {
  constructor(
    private readonly repository: AccountRepository,
    private readonly session: SessionStore,
  ) {}
  get customer() {
    return this.session.customer();
  }
  async register(input: RegistrationInput): Promise<void> {
    this.session.saveCustomer(await this.repository.register(input));
  }
  async login(input: LoginInput): Promise<void> {
    this.session.saveCustomer(await this.repository.login(input));
  }
  async logout(): Promise<void> {
    try {
      await this.repository.logout();
    } finally {
      this.session.clearCustomer();
    }
  }
}
