// frontend/playwright.config.ts
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.e2e.local') });

const authFile = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'dot' : [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    // Authentication setup — runs once before authenticated tests
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // Unauthenticated tests (login page, redirects, signup page)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth-flow\.spec\.ts/,
    },

    // Authenticated tests — depend on auth setup completing first
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: /auth-flow\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
