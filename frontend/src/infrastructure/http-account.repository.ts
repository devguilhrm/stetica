import { AccountRepository } from "../application/ports";
import { LoginInput, RegistrationInput } from "../application/contracts";
import { CustomerSession } from "../domain/models";
import { HttpApiClient } from "./http-api.client";

export class HttpAccountRepository implements AccountRepository {
  constructor(private readonly api: HttpApiClient) {}
  register(input: RegistrationInput): Promise<CustomerSession> {
    return this.api.request("POST", "clientes", input);
  }
  login(input: LoginInput): Promise<CustomerSession> {
    return this.api.request("POST", "sessoes", input);
  }
  logout(): Promise<void> {
    return this.api.request("DELETE", "sessoes");
  }
}
