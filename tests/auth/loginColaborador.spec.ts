import { test, expect } from "@playwright/test";
import { getEnv } from "../support/env";
import {
  acessarLogin,
  ssoLoginButton,
  clicarLoginColaborador,
} from "../support/loginPage";

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
    await page.screenshot({
      path: "test-results/login-colaborador-botao-sso.png",
    });
  });

  // Semi-manual: o SSO (Microsoft) exige o código MFA do autenticador, que a automação não
  // obtém. O teste preenche e-mail/senha (se `ssoUsername`/`ssoPassword` estiverem no
  // playwright.env.json) e então ESPERA você digitar o código no navegador (até 120s).
  test("@manual @positive Login colaborador via SSO (requer digitar o código MFA)", async ({
    page,
  }) => {
    test.setTimeout(180000);
    const env = getEnv();

    await acessarLogin(page);
    await expect(ssoLoginButton(page)).toBeVisible();
    await clicarLoginColaborador(page);

    // Microsoft: e-mail → Avançar → senha → Entrar. Sem credenciais no env, digite à mão.
    if (env.ssoUsername && env.ssoPassword) {
      await page.locator('input[name="loginfmt"]').fill(env.ssoUsername);
      // A Microsoft devolve a página no idioma do navegador (headless = inglês: "Next"/"Sign in"),
      // então não dá pra achar o botão pelo texto. #idSIButton9 é o botão primário em todas as
      // etapas (Avançar/Entrar/Sim), independente do idioma.
      const botaoPrimario = page.locator("#idSIButton9");
      await botaoPrimario.click();
      await page.locator('input[name="passwd"]').fill(env.ssoPassword);
      await botaoPrimario.click();
    }

    // Tela "Inserir código": a automação fica parada até você digitar o código e clicar em
    // "Verificar". Em vez de um sleep fixo, segue assim que o login termina e volta ao portal.
    await expect(page.getByText(/inserir c[óo]digo|enter code/i)).toBeVisible({ timeout: 30000 });
    await page.waitForURL(
      (url) => /egerdau\.com\.br$/.test(url.hostname) && !url.pathname.includes("/auth"),
      { timeout: 120000 },
    );
    await page.screenshot({
      path: "test-results/login-colaborador-concluido.png",
    });
  });
});
