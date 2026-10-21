// @ts-check
import { fecharModaisIniciais } from "./modals.js";

/**
 * Locators/ações da tela de login (/auth). Portado de `cypress/pages/loginPage/loginPage.js`.
 * Os seletores por XPath fixo do fallback original foram descartados — o `locator()` principal
 * já cobre o campo em todas as variações vistas, e o auto-wait do Playwright elimina a
 * necessidade do fallback por "existe no body?" feito no Cypress.
 */

/** @typedef {import('@playwright/test').Page} Page */

/** @param {Page} page */
export function usernameInput(page) {
  return page
    .locator(
      'input[type="email"], input[name*="email" i], input[id*="email" i], input[autocomplete="username"]',
    )
    .first();
}

/** @param {Page} page */
export function passwordInput(page) {
  return page
    .locator(
      'input[type="password"], input[name*="password" i], input[id*="password" i], input[autocomplete="current-password"]',
    )
    .first();
}

/** @param {Page} page */
export function loginButton(page) {
  return page
    .locator(
      'button[type="submit"], button[data-cy*="login" i], button[data-testid*="login" i]',
    )
    .first();
}

/** @param {Page} page */
export function ssoLoginButton(page) {
  return page.locator('[data-testid="sso-login-button"]');
}

/** @param {Page} page */
export async function acessarLogin(page) {
  await page.goto("/auth");
  await fecharModaisIniciais(page);
}

/**
 * @param {Page} page
 * @param {string} [username]
 * @param {string} [password]
 */
export async function preencherFormulario(page, username, password) {
  if (username) await usernameInput(page).fill(username);
  if (password) await passwordInput(page).fill(password);
}

/** @param {Page} page */
export async function fazerLogin(page) {
  await loginButton(page).click();
}

/** @param {Page} page */
export async function clicarLoginColaborador(page) {
  await ssoLoginButton(page).click();
}
