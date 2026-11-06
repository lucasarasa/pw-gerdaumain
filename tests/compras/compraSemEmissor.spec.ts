import { test, expect } from "@playwright/test";
import { getEnv } from "../support/env";
import { login } from "../support/auth";
import {
  ROTA_COMPRAR_LANDING,
  acessarComprarLanding,
  acessarCatalogoVitrineComEmissor,
  clicarPrimeiroProdutoVisivelNoCatalogo,
  irParaCarrinhoViaHeader,
  finalizarPedidoNoCarrinho,
} from "../support/fluxoCompra";
import { fecharModaisIniciais } from "../support/modals";

/**
 * Migração de `cypress/e2e/compras/compraSemEmissor.cy.js`.
 */

const env = getEnv();
const EMISSOR_ESPERADO = env.emissor || "ACOS FAVORIT DISTRIBUIDORA LTDA";

test.describe("Compra sem emissor", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, env);
  });

  test("@smoke @critical Bloqueia avanço da compra sem emissor", async ({ page }) => {
    await acessarComprarLanding(page);
    await fecharModaisIniciais(page);

    await page.getByRole("button", { name: /comprar por vitrine/i }).click({ force: true });

    // Sem emissor: ou a URL permanece na landing, ou aparece mensagem de validação.
    await page.waitForTimeout(2000);
    const aindaNaLanding = page.url().includes(ROTA_COMPRAR_LANDING);
    if (!aindaNaLanding) {
      await expect(
        page.getByText(/selecione\s+um\s+emissor|obrigat[óo]rio|campo\s+obrigat[óo]rio/i).first(),
      ).toBeVisible();
    }
  });

  test("@regression @p2 Compra efetiva após selecionar emissor na landing", async ({ page }) => {
    await acessarCatalogoVitrineComEmissor(page, EMISSOR_ESPERADO);
    await clicarPrimeiroProdutoVisivelNoCatalogo(page);
    await irParaCarrinhoViaHeader(page);
    await finalizarPedidoNoCarrinho(page, { pularPrimeiroAvancar: true });

    await page.screenshot({
      path: "test-results/compra-sem-emissor-pedido-efetivado.png",
      fullPage: true,
    });
  });
});
