import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { getEnv } from "../support/env";
import { login } from "../support/auth";
import {
  URL_CARRINHO,
  acessarComprarSelecionandoItensComEmissor,
  acessarComprarPorPlanilhaComEmissor,
  adicionarProdutoPorSku,
  avancarParaCarrinho,
} from "../support/fluxoCompra";
import { aguardarLoadingSumir, fecharModaisIniciais } from "../support/modals";

/**
 * Cenários de validação (não finalizam pedido) sobre "Comprar selecionando itens" e
 * "Comprar por planilha".
 */

const env = getEnv();
const EMISSOR_ESPERADO = env.emissor || "ACOS FAVORIT DISTRIBUIDORA LTDA";
const SKU_COMPRA = "106032353";
const SKU_INEXISTENTE = "000000000";

// Linha de dados da tabela = linha que contém um código de produto (9 dígitos).
const LINHA_COM_CODIGO = /\d{9}/;

test.describe("Selecionando itens e planilha: validações", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, env);
  });

  test("@regression @p2 Item adicionado por código chega ao carrinho com os campos do pedido", async ({
    page,
  }) => {
    await acessarComprarSelecionandoItensComEmissor(page, EMISSOR_ESPERADO);
    await adicionarProdutoPorSku(page, SKU_COMPRA);
    await avancarParaCarrinho(page);

    await expect(page).toHaveURL(URL_CARRINHO);
    await aguardarLoadingSumir(page, { aparecer: 10000, sumir: 60000 });
    await fecharModaisIniciais(page);

    await expect(page.getByText(/unidade de medida/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/data desejada/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(SKU_COMPRA).first()).toBeVisible({ timeout: 30000 });

    await page.screenshot({ path: "test-results/selecao-item-no-carrinho.png", fullPage: true });
  });

  test("@regression @p2 Código inexistente não entra na tabela de itens", async ({ page }) => {
    await acessarComprarSelecionandoItensComEmissor(page, EMISSOR_ESPERADO);

    await page.getByTestId("hefesto-search-field").fill(SKU_INEXISTENTE);
    await page.getByRole("button", { name: /^\s*adicionar produto\s*$/i }).click();
    await aguardarLoadingSumir(page, { aparecer: 3000 });

    await expect(
      page.getByRole("table").getByRole("row").filter({ hasText: SKU_INEXISTENTE }),
    ).toHaveCount(0);

    await page.screenshot({ path: "test-results/selecao-codigo-inexistente.png", fullPage: true });
  });

  test("@regression @p2 Planilha em formato inválido não carrega itens", async ({ page }, testInfo) => {
    const arquivoInvalido = testInfo.outputPath("planilha-invalida.txt");
    fs.writeFileSync(arquivoInvalido, "isto não é uma planilha de pedido");

    await acessarComprarPorPlanilhaComEmissor(page, EMISSOR_ESPERADO);

    const botaoEnviar = page.getByRole("button", { name: /^\s*enviar planilha\s*$/i });
    await expect(botaoEnviar).toBeVisible({ timeout: 30000 });
    const [seletor] = await Promise.all([page.waitForEvent("filechooser"), botaoEnviar.click()]);
    await seletor.setFiles(arquivoInvalido);
    await aguardarLoadingSumir(page, { aparecer: 5000 });
    await page.waitForTimeout(2000);

    // Nenhum item foi carregado e o usuário continua na tela da planilha (não foi pro carrinho).
    await expect(page.getByRole("table").getByRole("row").filter({ hasText: LINHA_COM_CODIGO })).toHaveCount(0);
    await expect(page).not.toHaveURL(URL_CARRINHO);

    await page.screenshot({ path: "test-results/planilha-invalida.png", fullPage: true });
  });
});
