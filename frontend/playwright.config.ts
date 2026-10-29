import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env["STETICA_UI_URL"] ?? "http://localhost:4200",
    headless: true,
    launchOptions: {
      executablePath: process.env["STETICA_CHROMIUM_PATH"] || undefined,
    },
  },
});
