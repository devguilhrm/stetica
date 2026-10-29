import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ApplicationError } from "../application/errors";
import { SessionStore } from "../application/ports";

/** HTTP e formatos de erros do ASP.NET não atravessam esta fronteira. */
export class HttpApiClient {
  constructor(
    private readonly http: HttpClient,
    private readonly session: SessionStore,
  ) {}

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    let headers = new HttpHeaders();
    const token = this.session.token();
    const adminKey = this.session.adminKey();
    if (token) headers = headers.set("Authorization", "Bearer " + token);
    if (adminKey) headers = headers.set("X-Admin-Key", adminKey);
    for (const [name, value] of Object.entries(extraHeaders ?? {}))
      headers = headers.set(name, value);
    try {
      return await firstValueFrom(
        this.http.request<T>(method, "/api/" + path, { body, headers }),
      );
    } catch (error: unknown) {
      if (!(error instanceof HttpErrorResponse)) throw error;
      const body: unknown = error.error;
      let message: string | undefined;
      if (body && typeof body === "object") {
        if ("message" in body && typeof body.message === "string")
          message = body.message;
        else if (
          "errors" in body &&
          body.errors &&
          typeof body.errors === "object"
        ) {
          message = Object.values(body.errors)
            .flat()
            .filter((value) => typeof value === "string")
            .join(" ");
        }
      }
      throw new ApplicationError(
        message ||
          (error.status === 401
            ? "Entre novamente ou confira a chave administrativa."
            : error.status === 404
              ? "Registro não encontrado."
              : "Não foi possível concluir. Confira a API e o banco."),
        error.status,
      );
    }
  }
}
