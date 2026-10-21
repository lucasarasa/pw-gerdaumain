// @ts-check
import { test, expect } from "@playwright/test";
import { acessarLogin, ssoLoginButton, clicarLoginColaborador } from "../support/loginPage.js";

/**
 * Migração de `cypress/e2e/auth/loginColaborador.cy.js` para Playwright.
 */

test.describe("Autenticação — login colaborador (SSO)", () => {
  test('@regression @positive Botão "Acesso colaborador Gerdau" está visível na tela de login', async ({
    page,
  }) => {
    await acessarLogin(page);

    await expect(ssoLoginButton(page)).toBeVisible();
    await expect(ssoLoginButton(page)).toBeEnabled();
    await page.screenshot({ path: "test-results/login-colaborador-botao-sso.png" });
  });

  // Semi-manual: o SSO (Microsoft) exige código de autenticação (MFA), que a automação não
  // obtém. Fica sempre `skip` — para rodar, comente o skip e use `npx playwright test --ui` ou
  // `--headed`, com um `await page.pause()` logo após clicar no botão de SSO para fazer o login
  // manualmente na Microsoft antes de retomar.
  test.skip(
    "@manual @positive Login colaborador via SSO (requer digitar o código MFA)",
    async ({ page }) => {
      await acessarLogin(page);
      await expect(ssoLoginButton(page)).toBeVisible();

      await clicarLoginColaborador(page);

      // Pausa para o login manual na Microsoft (e-mail, senha e código MFA); retome pelo
      // inspector do Playwright (UI Mode / --debug) depois de concluir.
      await page.pause();

      await page.waitForURL(/egerdau\.com\.br/, { timeout: 60000 });
      await expect(page).not.toHaveURL(/\/auth/);
      await page.screenshot({ path: "test-results/login-colaborador-concluido.png" });
    },
  );
});
