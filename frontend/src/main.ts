import { registerLocaleData } from "@angular/common";
import pt from "@angular/common/locales/pt";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { AppComponent } from "./app.component";
import { APPLICATION_PROVIDERS } from "./app.providers";
import { APP_ROUTES } from "./app.routes";
registerLocaleData(pt);
bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(APP_ROUTES),
    ...APPLICATION_PROVIDERS,
  ],
}).catch(console.error);
