import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    browserName: "chromium",
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  webServer: {
    command: "tsx scripts/serve-chat-e2e-web.ts",
    url: "http://127.0.0.1:4173/mock",
    reuseExistingServer: true,
    timeout: 240_000
  },
  projects: [
    {
      name: "mock",
      use: {
        baseURL: "http://127.0.0.1:4173/mock"
      }
    },
    {
      name: "api",
      use: {
        baseURL: "http://127.0.0.1:4173/api"
      }
    }
  ]
});
