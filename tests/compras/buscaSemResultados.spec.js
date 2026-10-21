// @ts-check
import { test, expect } from "@playwright/test";
import { getEnv } from "../support/env.js";
import { login } from "../support/auth.js";
import {
  acessarComprarLanding,
  acessarCatalogoVitrineComEmissor,
  acessarComprarSelecionandoItensComEmissor,
  acessarComprarPorPlanilhaComEmissor,
  enviarPlanilha,
  avancarPlanilhaParaCarrinho,
  adicionarProdutoPorSku,
  avancarParaCarrinho,
  selecionarEmissorDoPedido,
  clicarPrimeiroProdutoVisivelNoCatalogo,
  irParaCarrinhoViaHeader,
  finalizarPedidoNoCarrinho,
  buscarTextoSemValidarResultado,
  validarMensagemBuscaSemResultados,
} from "../support/fluxoCompra.js";

/**
 * Migração de `cypress/e2e/compras/buscaSemResultados.cy.js` para Playwright — primeiro fluxo
 * portado, como piloto pra avaliar a troca de ferramenta.
 */

const env = getEnv();
const EMISSOR_ESPERADO = env.emissor || "ACOS FAVORIT DISTRIBUIDORA LTDA";
const TERMO_INEXISTENTE = "ZZZ_PRODUTO_INEXISTENTE_99999";
const SKU_COMPRA = "106032353";
const CAMINHO_PLANILHA =
  env.planilha || "C:\\Users\\lucas\\Downloads\\Planilha_padrao_de_pedido_1 cod gerdau.xlsx";

test.describe("Busca de produtos", () => {
  test.beforeEach(async ({ page }) => {
    // Cada `test()` do Playwright já roda com um contexto de navegador novo (cookies e
    // localStorage vazios) — não existe equivalente a `limparSessao()` pra chamar aqui.
    await login(page, env);
  });

  // Mantido desativado, espelhando o `it.skip()` do spec original no Cypress — esse cenário
  // específico ainda não foi revalidado nesse fluxo.
  test.skip("@smoke @p1 @regression Busca sem resultados exibe estado adequado", async ({
    page,
  }) => {
    await acessarComprarLanding(page);
    await selecionarEmissorDoPedido(page, EMISSOR_ESPERADO);

    await page.getByRole("button", { name: /comprar selecionando itens/i }).click();
    await expect(page).toHaveURL(/search-items/);

    await buscarTextoSemValidarResultado(page, TERMO_INEXISTENTE);
    await validarMensagemBuscaSemResultados(page);

    await page.screenshot({
      path: "test-results/busca-sem-resultados.png",
      fullPage: true,
    });
  });

  test("@regression @p2 Compra rápida via vitrine fecha pedido", async ({ page }) => {
    await acessarCatalogoVitrineComEmissor(page, EMISSOR_ESPERADO);
    await clicarPrimeiroProdutoVisivelNoCatalogo(page);
    await irParaCarrinhoViaHeader(page);

    // Já chegamos em "Configurar carrinho" (via ícone do carrinho), não em "Selecionar
    // produtos" — pula o 1º clique de "Avançar para revisão".
    await finalizarPedidoNoCarrinho(page, { pularPrimeiroAvancar: true });

    await page.screenshot({
      path: "test-results/busca-sem-resultados-pedido-efetivado.png",
      fullPage: true,
    });
  });

  test("@regression @p2 Compra via Comprar selecionando itens fecha pedido", async ({ page }) => {
    await acessarComprarSelecionandoItensComEmissor(page, EMISSOR_ESPERADO);
    await adicionarProdutoPorSku(page, SKU_COMPRA);
    await avancarParaCarrinho(page);

    await finalizarPedidoNoCarrinho(page, { pularPrimeiroAvancar: true });

    await page.screenshot({
      path: "test-results/compra-selecionando-itens-pedido-efetivado.png",
      fullPage: true,
    });
  });

  test("@regression @p2 Compra por planilha fecha pedido", async ({ page }) => {
    await acessarComprarPorPlanilhaComEmissor(page, EMISSOR_ESPERADO);
    await enviarPlanilha(page, CAMINHO_PLANILHA, SKU_COMPRA);
    await avancarPlanilhaParaCarrinho(page);

    await finalizarPedidoNoCarrinho(page, { pularPrimeiroAvancar: true });

    await page.screenshot({
      path: "test-results/compra-por-planilha.png",
      fullPage: true,
    });
  });
});
