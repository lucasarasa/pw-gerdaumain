import { test, expect, type Page } from "@playwright/test";
import { getEnv } from "../support/env";
import { login } from "../support/auth";
import {
  URL_CARRINHO,
  acessarCatalogoVitrineComEmissor,
  clicarPrimeiroProdutoVisivelNoCatalogo,
  irParaCarrinhoViaHeader,
} from "../support/fluxoCompra";
import { aguardarLoadingSumir, fecharModaisIniciais } from "../support/modals";

/**
 * Migração de `carrinhoPersistencia`, `carrinhoPersistenciaRelogin`, `carrinhoNavegacaoVoltar` e
 * `carrinhoChecklistCampos` (Cypress). `carrinhoQuantidade` e `carrinhoRemocao` ficam pra depois:
 * dependem dos controles de quantidade/lixeira da tela atual do carrinho, ainda não mapeados.
 */

const env = getEnv();
const EMISSOR_ESPERADO = env.emissor || "ACOS FAVORIT DISTRIBUIDORA LTDA";

async function montarCarrinhoComUmItem(page: Page) {
  await acessarCatalogoVitrineComEmissor(page, EMISSOR_ESPERADO);
  await clicarPrimeiroProdutoVisivelNoCatalogo(page);
}

test.describe("Carrinho", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, env);
  });

  test("@regression @p1 Mantém evidência de carrinho após recarregar a página", async ({
    page,
  }) => {
    await montarCarrinhoComUmItem(page);

    // Antes do reload: o produto está na página do carrinho (linha com "Unidade de medida" e
    // "Data desejada").
    await irParaCarrinhoViaHeader(page);
    await aguardarLoadingSumir(page);
    await fecharModaisIniciais(page);
    await expect(page.getByText(/unidade de medida/i).first()).toBeVisible();
    await expect(page.getByText(/data desejada/i).first()).toBeVisible();

    // Depois do reload, na própria página do carrinho: o produto continua lá.
    await page.reload();
    // O modal "Preparando o seu pedido" demora pra surgir depois do reload e ainda carrega por um
    // bom tempo: dá uma janela maior pra ele aparecer e prazo maior pro carrinho renderizar.
    await aguardarLoadingSumir(page, { aparecer: 10000, sumir: 60000 });
    await fecharModaisIniciais(page);
    await expect(page).toHaveURL(URL_CARRINHO);
    await expect(page.getByText(/unidade de medida/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/data desejada/i).first()).toBeVisible({ timeout: 30000 });
  });

  test("@regression @p1 @AUT-012 Mantém evidência de carrinho após novo login", async ({
    page,
  }) => {
    await montarCarrinhoComUmItem(page);

    // Antes do relogin: o produto está na página do carrinho.
    await irParaCarrinhoViaHeader(page);
    await aguardarLoadingSumir(page);
    await fecharModaisIniciais(page);
    await expect(page.getByText(/unidade de medida/i).first()).toBeVisible();
    await expect(page.getByText(/data desejada/i).first()).toBeVisible();

    // Novo login: descarta a sessão (cookies e storage) e entra de novo.
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await login(page, env);
    await aguardarLoadingSumir(page);
    await fecharModaisIniciais(page);

    // Depois do relogin: abre o carrinho e o produto continua lá.
    await irParaCarrinhoViaHeader(page);
    await aguardarLoadingSumir(page, { aparecer: 10000, sumir: 60000 });
    await fecharModaisIniciais(page);
    await expect(page.getByText(/unidade de medida/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/data desejada/i).first()).toBeVisible({ timeout: 30000 });
  });

  test("@regression @p2 Voltar pelo histórico do browser após entrar no carrinho", async ({
    page,
  }) => {
    await montarCarrinhoComUmItem(page);
    await irParaCarrinhoViaHeader(page);
    await expect(page).toHaveURL(URL_CARRINHO);

    await page.goBack();
    await aguardarLoadingSumir(page);

    // Saiu do carrinho e continua dentro da área de compras (volta pro catálogo da vitrine).
    await expect(page).not.toHaveURL(URL_CARRINHO);
    await expect(page).toHaveURL(/\/purchase\//);
  });

  test("@regression @p3 Carrinho exibe unidade, data, destinação e pagamento", async ({ page }) => {
    await montarCarrinhoComUmItem(page);
    await irParaCarrinhoViaHeader(page);
    await aguardarLoadingSumir(page, { aparecer: 10000, sumir: 60000 });
    await fecharModaisIniciais(page);

    // O original só registrava se os campos existiam (nunca falhava). A tela atual do carrinho
    // mostra todos eles por item, então agora é uma verificação de verdade.
    await expect(page.getByText(/unidade de medida/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/data desejada/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/destina[cç][aã]o/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/condi[cç][aã]o de pagamento/i).first()).toBeVisible({ timeout: 30000 });

    await page.screenshot({ path: "test-results/carrinho-checklist-campos.png", fullPage: true });
  });
});
