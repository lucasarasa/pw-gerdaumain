import type { Page } from "@playwright/test";
import { fecharModaisIniciais } from "./modals";

/**
 * Locators/ações da tela de login (/auth). Portado de `cypress/pages/loginPage/loginPage.js`.
 * Os seletores por XPath fixo do fallback original foram descartados — o `locator()` principal
 * já cobre o campo em todas as variações vistas, e o auto-wait do Playwright elimina a
 * necessidade do fallback por "existe no body?" feito no Cypress.
 */


export function usernameInput(page: Page) {
  return page
    .locator(
      'input[type="email"], input[name*="email" i], input[id*="email" i], input[autocomplete="username"]',
    )
    .first();
}

export function passwordInput(page: Page) {
  return page
    .locator(
      'input[type="password"], input[name*="password" i], input[id*="password" i], input[autocomplete="current-password"]',
    )
    .first();
}

export function loginButton(page: Page) {
  return page
    .locator(
      'button[type="submit"], button[data-cy*="login" i], button[data-testid*="login" i]',
    )
    .first();
}

export function ssoLoginButton(page: Page) {
  return page.locator('[data-testid="sso-login-button"]');
}

export async function acessarLogin(page: Page) {
  await page.goto("/auth");
  await fecharModaisIniciais(page);
}

/**
 */
export async function preencherFormulario(page: Page, username?: string, password?: string) {
  if (username) await usernameInput(page).fill(username);
  if (password) await passwordInput(page).fill(password);
}

export async function fazerLogin(page: Page) {
  await loginButton(page).click();
}

export async function clicarLoginColaborador(page: Page) {
  await ssoLoginButton(page).click();
}
