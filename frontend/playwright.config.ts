import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    baseURL: 'http://localhost:5173'
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    cwd: 'frontend'
  }
})
