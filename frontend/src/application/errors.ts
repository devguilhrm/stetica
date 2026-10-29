export class ApplicationError extends Error {
  override readonly name = "ApplicationError";
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}
export class SessionRequiredError extends ApplicationError {
  constructor() {
    super("Entre na sua conta para continuar.", 401);
  }
}
