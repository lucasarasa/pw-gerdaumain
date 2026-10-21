import { expect } from "@playwright/test";
import { fecharModaisIniciais } from "./modals.js";

/**
 * Login na tela /auth, com uma repetição caso a 1ª tentativa não saia de /auth (mesmo padrão
 * de retry do `realizarLoginComRetry` do projeto Cypress).
 *
 * Diferente do Cypress (onde specs no mesmo arquivo compartilham cookies/localStorage a não ser
 * que você limpe manualmente), cada `test()` do Playwright já roda num `page`/contexto de
 * navegador isolado e com estado zerado — não existe equivalente a `limparSessao()` a chamar.
 */
export async function login(page, env) {
  const fazerLogin = async () => {
    await page.goto("/auth");
    // Se a conta ainda tiver sessão presa no servidor, /auth pode redirecionar primeiro pra um
    // modal "Sua sessão foi encerrada" (com "Voltar ao login") antes do formulário aparecer.
    await fecharModaisIniciais(page);

    const email = page
      .locator('input[type="email"], input[name*="email" i], input[autocomplete="username"]')
      .first();
    const senha = page
      .locator('input[type="password"], input[autocomplete="current-password"]')
      .first();
    await expect(email).toBeVisible({ timeout: 15000 });
    await expect(senha).toBeVisible({ timeout: 15000 });
    await email.fill(env.username);
    await senha.fill(env.password);
    await page.getByRole("button", { name: /fazer login/i }).click();
  };

  await fazerLogin();

  const saiuDoAuth = await page
    .waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 20000 })
    .then(() => true)
    .catch(() => false);

  if (!saiuDoAuth) {
    // Login não concluiu na primeira tentativa — repete uma vez.
    await fazerLogin();
    await page.waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 30000 });
  }
}
