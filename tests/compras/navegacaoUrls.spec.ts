import { test, expect } from "@playwright/test";
import { getEnv } from "../support/env";
import { login } from "../support/auth";
import {
  ROTA_COMPRAR_LANDING,
  acessarComprarLanding,
  selecionarEmissorDoPedido,
} from "../support/fluxoCompra";
import { aguardarLoadingSumir, fecharModaisIniciais } from "../support/modals";

/** Cenários só de navegação: chega na tela e confirma a URL. */

const env = getEnv();
const EMISSOR_ESPERADO = env.emissor || "ACOS FAVORIT DISTRIBUIDORA LTDA";

test.describe("Navegação: URLs da área de compras", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, env);
  });

  test("@smoke @p1 Área Comprar abre na tela de escolha de tipo de aço", async ({ page }) => {
    await acessarComprarLanding(page);
    await fecharModaisIniciais(page);

    await expect(page).toHaveURL(new RegExp(ROTA_COMPRAR_LANDING));
    await expect(page.getByRole("button", { name: /comprar por vitrine/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /comprar selecionando itens/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: /comprar por planilha/i })).toBeVisible({ timeout: 30000 });
  });

  test("@smoke @p1 Comprar por vitrine leva ao catálogo da vitrine", async ({ page }) => {
    await acessarComprarLanding(page);
    await selecionarEmissorDoPedido(page, EMISSOR_ESPERADO);
    await page.getByRole("button", { name: /comprar por vitrine/i }).click();
    await aguardarLoadingSumir(page);

    await expect(page).toHaveURL(/\/purchase\/long-steel\/commerce\/catalog/);
  });

  test("@smoke @p1 Comprar selecionando itens leva à busca de itens", async ({ page }) => {
    await acessarComprarLanding(page);
    await selecionarEmissorDoPedido(page, EMISSOR_ESPERADO);
    await page.getByRole("button", { name: /comprar selecionando itens/i }).click();
    await aguardarLoadingSumir(page);

    await expect(page).toHaveURL(/search-items/);
  });
});
