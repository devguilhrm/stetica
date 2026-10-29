import { Injectable } from "@angular/core";
@Injectable({ providedIn: "root" })
export class FeedbackService {
  message = "";
  error = false;
  notify(message: string, error = false): void {
    this.message = message;
    this.error = error;
  }
  fail(error: unknown): void {
    this.notify(
      error instanceof Error
        ? error.message
        : "Não foi possível concluir a operação.",
      true,
    );
  }
  clear(): void {
    this.message = "";
    this.error = false;
  }
}
