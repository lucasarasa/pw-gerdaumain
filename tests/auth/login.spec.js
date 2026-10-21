// @ts-check
import { test, expect } from "@playwright/test";
import { getEnv } from "../support/env.js";
import {
  acessarLogin,
  usernameInput,
  passwordInput,
  preencherFormulario,
  fazerLogin,
} from "../support/loginPage.js";

/**
 * Migração de `cypress/e2e/auth/login.cy.js` para Playwright.
 */

const env = getEnv();

/** @param {import('@playwright/test').Page} page */
async function permaneceNoContextoDeLogin(page) {
  const url = page.url();
  if (url.includes("/auth")) return;

  // Fallback para casos em que o app permanece no formulário sem refletir URL estável imediatamente.
  await expect(usernameInput(page)).toBeVisible();
  await expect(passwordInput(page)).toBeVisible();
}

test.describe("Cenários de Login", () => {
  test("@smoke @positive Login com credenciais válidas", async ({ page }) => {
    await acessarLogin(page);
    await expect(usernameInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();

    await preencherFormulario(page, env.username, env.password);
    await fazerLogin(page);

    // Aguarda redirecionamento - não valida elementos específicos pois pode haver
    // mudança de domínio/origem.
    await page.waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 15000 });
    await page.screenshot({ path: "test-results/login-credenciais-validas.png" });
  });

  test("@negative @security Login com email inválido", async ({ page }) => {
    await acessarLogin(page);
    await expect(usernameInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();

    await preencherFormulario(page, env.invalidUsername, env.password);
    await fazerLogin(page);

    await permaneceNoContextoDeLogin(page);
    await page.screenshot({ path: "test-results/login-email-invalido.png" });
  });

  test("@negative @security Login com senha inválida", async ({ page }) => {
    await acessarLogin(page);
    await expect(usernameInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();

    await preencherFormulario(page, env.username, env.invalidPassword);
    await fazerLogin(page);

    await permaneceNoContextoDeLogin(page);
    await page.screenshot({ path: "test-results/login-senha-invalida.png" });
  });

  test("@validation @negative Login com campos vazios", async ({ page }) => {
    await acessarLogin(page);
    await expect(usernameInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();

    await fazerLogin(page);

    await permaneceNoContextoDeLogin(page);
    await expect(usernameInput(page)).toBeVisible();
    await page.screenshot({ path: "test-results/login-campos-vazios.png" });
  });

  test("@validation @negative Login com apenas email preenchido", async ({ page }) => {
    await acessarLogin(page);
    await expect(usernameInput(page)).toBeVisible();
    await expect(passwordInput(page)).toBeVisible();

    await usernameInput(page).fill(env.username);
    await fazerLogin(page);

    await permaneceNoContextoDeLogin(page);
    await expect(usernameInput(page)).toBeVisible();
    await page.screenshot({ path: "test-results/login-apenas-email-preenchido.png" });
  });
});
