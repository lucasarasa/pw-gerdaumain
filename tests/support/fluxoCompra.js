import { expect } from "@playwright/test";
import { aguardarLoadingSumir, fecharModaisIniciais, tratarModaisTransientes } from "./modals.js";

export const ROTA_COMPRAR_LANDING = "/purchase/commerce/steel-type-choose/steel-type-choose";

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Acessa a área de Comprar (mesma rota do menu superior "Comprar"). */
export async function acessarComprarLanding(page) {
  await page.goto(ROTA_COMPRAR_LANDING);
  await expect(page).toHaveURL(new RegExp(escaparRegex(ROTA_COMPRAR_LANDING)));
}

/**
 * Seleciona o emissor "Emissor do pedido". O HTML atual não tem mais `#select-emissor-pedido`
 * (só classes geradas pelo styled-components, que mudam a cada build) — por isso localizamos
 * pelo texto do rótulo e pegamos o widget irmão, igual ao helper do Cypress.
 */
export async function selecionarEmissorDoPedido(page, nomeEmissor) {
  await fecharModaisIniciais(page);

  const widget = page
    .getByText(/^\s*emissor do pedido\s*$/i)
    .locator("xpath=following-sibling::div[1]")
    .first();
  await widget.click({ force: true });

  const opcao = page.getByText(new RegExp(escaparRegex(nomeEmissor), "i")).first();
  await opcao.click({ force: true });

  await expect(widget).not.toContainText(/selecione um emissor/i);
}

/**
 * Acessa o catálogo da vitrine **com emissor aplicado** (landing → emissor → "Comprar por
 * Vitrine"). Evita navegar direto pra `/purchase/long-steel/commerce/catalog`, que no QA perde
 * o contexto de emissor e quebra o checkout.
 */
export async function acessarCatalogoVitrineComEmissor(page, nomeEmissor) {
  await acessarComprarLanding(page);
  await selecionarEmissorDoPedido(page, nomeEmissor);

  await page.getByRole("button", { name: /comprar por vitrine/i }).click();
  await expect(page).toHaveURL(/\/purchase\/long-steel\/commerce\/catalog/);
}

/**
 * Acessa "Comprar selecionando itens" **com emissor aplicado** (landing → emissor → botão da
 * box). Mesma ideia da vitrine: não navega direto pra URL, pra não perder o contexto de emissor.
 */
export async function acessarComprarSelecionandoItensComEmissor(page, nomeEmissor) {
  await acessarComprarLanding(page);
  await selecionarEmissorDoPedido(page, nomeEmissor);

  await page.getByRole("button", { name: /comprar selecionando itens/i }).click();
  await expect(page).toHaveURL(/search-items/);
  // Tela carregada = campo de busca de SKU disponível.
  await expect(page.getByTestId("hefesto-search-field")).toBeVisible({ timeout: 30000 });
  await aguardarLoadingSumir(page);
}

/**
 * Acessa "Comprar por planilha" com emissor aplicado, espera o modal que aparece em seguida
 * (só confirma que está visível) e clica em "Aplicar alterações".
 */
export async function acessarComprarPorPlanilhaComEmissor(page, nomeEmissor) {
  await acessarComprarLanding(page);
  await selecionarEmissorDoPedido(page, nomeEmissor);

  await page.getByRole("button", { name: /comprar por planilha/i }).click();

  // `modal-container` também é o testid do modal de loading ("Aguarde alguns instantes"),
  // então ignora esse e espera o modal de conteúdo.
  const modal = page
    .getByTestId("modal-container")
    .filter({ hasNotText: /aguarde alguns instantes/i })
    .first();
  await expect(modal).toBeVisible({ timeout: 30000 });

  await modal.getByRole("button", { name: /aplicar altera[çc][õo]es/i }).click();
  await aguardarLoadingSumir(page);
}

/**
 * Envia a planilha de pedido: espera "Enviar planilha" ficar visível, entrega o arquivo ao
 * seletor de arquivos que o clique abre (sem depender do diálogo nativo do Windows), espera o
 * loading passar e confirma que o SKU esperado entrou na tabela.
 */
export async function enviarPlanilha(page, caminhoPlanilha, skuEsperado) {
  const botaoEnviar = page.getByRole("button", { name: /^\s*enviar planilha\s*$/i });
  await expect(botaoEnviar).toBeVisible({ timeout: 30000 });

  const [seletor] = await Promise.all([page.waitForEvent("filechooser"), botaoEnviar.click()]);
  await seletor.setFiles(caminhoPlanilha);
  await aguardarLoadingSumir(page, { aparecer: 5000 });

  const linha = page.getByRole("table").getByRole("row").filter({ hasText: skuEsperado });
  await expect(linha).toBeVisible({ timeout: 30000 });
}

/**
 * Avança da planilha para o carrinho. Se aparecer o modal "Sua planilha contém inconsistências",
 * avança mesmo assim.
 */
export async function avancarPlanilhaParaCarrinho(page) {
  await page.getByRole("button", { name: /avan[çc]ar para o carrinho/i }).click();
  await aguardarLoadingSumir(page, { aparecer: 5000 });

  const aviso = page.getByRole("heading", { name: /sua planilha cont[ée]m inconsist/i });
  if (await aviso.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page
      .getByTestId("modal-container")
      .getByRole("button", { name: /^\s*avan[çc]ar\s*$/i })
      .click();
    await aguardarLoadingSumir(page, { aparecer: 5000 });
  }
  await fecharModaisIniciais(page);
}

/** Informa o SKU, clica em "Adicionar produto" e confirma que ele entrou na tabela. */
export async function adicionarProdutoPorSku(page, sku) {
  await page.getByTestId("hefesto-search-field").fill(sku);
  await page.getByRole("button", { name: /^\s*adicionar produto\s*$/i }).click();

  const linha = page.getByRole("table").getByRole("row").filter({ hasText: sku });
  await expect(linha).toBeVisible({ timeout: 30000 });
}

/** Clica em "Avançar para o carrinho" e espera o modal de carregamento passar. */
export async function avancarParaCarrinho(page) {
  await page.getByRole("button", { name: /avan[çc]ar para o carrinho/i }).click();
  await aguardarLoadingSumir(page, { aparecer: 5000 });
  await fecharModaisIniciais(page);
}

const SEL_ADD_CARRINHO = '[data-cy*="add-cart"], .add-to-cart, button[aria-label*="carrinho" i]';

/**
 * Clica no primeiro produto disponível JÁ VISÍVEL no catálogo/vitrine, sem nenhum fallback de
 * busca por código ou planilha — cair pra busca mascararia o que o teste "via vitrine" deveria
 * estar validando.
 */
export async function clicarPrimeiroProdutoVisivelNoCatalogo(page) {
  await clicarProdutoNoCatalogo(page);
  await aguardarLoadingSumir(page);
}

async function clicarProdutoNoCatalogo(page) {
  await expect(page).toHaveURL(/\/purchase\/long-steel\/commerce\/catalog/);
  await fecharModaisIniciais(page);
  // Fotos do catálogo carregam de forma progressiva (lazy); dá uma folga curta antes de clicar.
  await page.waitForTimeout(3000);

  const botaoDireto = page.locator(SEL_ADD_CARRINHO).first();
  if (await botaoDireto.isVisible().catch(() => false)) {
    await botaoDireto.click({ force: true });
    return;
  }

  const textoAdicionar = page.getByText(/adicionar ao carrinho|^adicionar$/i).first();
  if (await textoAdicionar.isVisible().catch(() => false)) {
    await textoAdicionar.click({ force: true });
    return;
  }

  // Último recurso: clica na própria imagem do primeiro produto (abre detalhe ou já adiciona).
  await page.locator("img").first().click({ force: true });

  const botaoDepois = page.locator(SEL_ADD_CARRINHO).first();
  if (await botaoDepois.isVisible().catch(() => false)) {
    await botaoDepois.click({ force: true });
    return;
  }
  const textoDepois = page.getByText(/adicionar ao carrinho|^adicionar$/i).first();
  if (await textoDepois.isVisible().catch(() => false)) {
    await textoDepois.click({ force: true });
  }
}

/**
 * Clica no ícone do carrinho no header. Seletor por XPath herdado do projeto Cypress (frágil —
 * o header não expõe um `data-testid` estável pro ícone do carrinho ainda).
 */
export async function irParaCarrinhoViaHeader(page) {
  // Depois de "Adicionar ao carrinho" o modal "Aguarde alguns instantes" cobre a tela e
  // intercepta o clique (com force:true o clique é "perdido" e a URL não muda).
  await aguardarLoadingSumir(page);
  const carrinho = page.locator(
    "xpath=/html/body/div[1]/div[2]/div/div[1]/header/nav/div[2]/div[3]",
  );
  await carrinho.click({ force: true });
  await expect(page).toHaveURL(/shopping-cart|configure-cart|cart-checkout/);
  await tratarModaisTransientes(page);
}

/**
 * Fecha pelo X o modal "Condição de pagamento para..." se ele aparecer (ele pode surgir depois
 * que o painel de edição em lote já está visível e cobrir o checkbox "Selecionar todos").
 */
async function fecharModalCondicaoPagamento(page) {
  const modal = page.locator("#popup-40 div").filter({ hasText: "Condição de pagamento para" }).first();
  const apareceu = await modal
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (!apareceu) return;

  await page.locator(".x").first().click();
  await modal.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
}

/**
 * Preenche "Data desejada" no carrinho com D+N dias (default 7). Tenta primeiro o caminho
 * rápido — "Selecionar todos" + campo de data em lote + "Aplicar alterações" — e só cai no
 * campo-por-campo se esse painel de edição em lote não existir/habilitar nessa tela.
 */
export async function preencherDatasDesejadasNoCarrinho(page, diasAdiante = 7) {
  const hoje = new Date();
  hoje.setDate(hoje.getDate() + diasAdiante);
  const dd = String(hoje.getDate()).padStart(2, "0");
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const yyyy = hoje.getFullYear();
  const valorBR = `${dd}/${mm}/${yyyy}`;
  const valorISO = `${yyyy}-${mm}-${dd}`;

  await page.waitForTimeout(500); // linhas do carrinho podem hidratar um instante depois do overlay sumir

  // Painel de edição em lote: "Selecionar todos | Data desejada | Destinação | ...".
  const painel = page.getByText(/selecionar todos\s*data desejada/i).first();
  const temBulk = await painel
    .waitFor({ state: "visible", timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (temBulk) {
    await fecharModalCondicaoPagamento(page);

    // Todos os campos de data têm name="startdate": o 1º é o do painel em lote (desabilitado até
    // marcar "Selecionar todos") e os demais são um por item. Com um único item não precisa do
    // lote — preenche a data direto na linha.
    const camposData = page.locator('input[name="startdate"]');
    await camposData.nth(1).waitFor({ state: "visible", timeout: 15000 });
    if ((await camposData.count()) === 2) {
      const campoItem = camposData.nth(1);
      await campoItem.click();
      await campoItem.fill(valorBR);
      await campoItem.press("Escape");
      await expect(campoItem).toHaveValue(valorBR);
      return;
    }

    await page.getByRole("checkbox", { name: /selecionar todos/i }).first().check();

    const campoData = page.getByRole("textbox", { name: "dd/mm/aaaa" }).first();
    await campoData.click();
    await campoData.fill(valorBR);
    await campoData.press("Escape");

    const botaoAplicar = page.getByRole("button", { name: /aplicar altera[çc][õo]es/i });
    await expect(botaoAplicar).toBeEnabled({ timeout: 6000 });
    await botaoAplicar.click();
    // Pode aparecer o modal "Produtos idênticos encontrados" ao aplicar em lote.
    await tratarModaisTransientes(page);
    return;
  }

  // Fallback: preenche campo por campo.
  const campos = page.locator(
    'input[type="date"], input[placeholder*="dd/mm" i], input[placeholder*="esejada" i], ' +
      '[data-testid*="date" i] .start-date',
  );
  const total = await campos.count();
  for (let i = 0; i < total; i++) {
    const campo = campos.nth(i);
    if (!(await campo.isVisible().catch(() => false))) continue;
    if (!(await campo.isEnabled().catch(() => false))) continue;

    const tipo = await campo.getAttribute("type");
    await campo.click({ force: true });
    await campo.fill(tipo === "date" ? valorISO : valorBR);
    await campo.press("Escape");
  }
}

/**
 * Preenche "Identificação do pedido" (etapa Revisar pedido) com "TESTE-AUTOMATIZADO" + data/hora
 * atual, pra QA identificar na lista de pedidos que foi a automação que criou aquele pedido.
 * Hífen em todos os separadores: o campo filtra a digitação e remove espaço/"/"/":" (confirmado
 * testando manualmente — só o hífen de "TESTE-AUTOMATIZADO" sobreviveu).
 */
export async function preencherIdentificacaoPedido(page) {
  const agora = new Date();
  const dd = String(agora.getDate()).padStart(2, "0");
  const mm = String(agora.getMonth() + 1).padStart(2, "0");
  const yyyy = agora.getFullYear();
  const hh = String(agora.getHours()).padStart(2, "0");
  const min = String(agora.getMinutes()).padStart(2, "0");
  const identificacao = `TESTE-AUTOMATIZADO-${dd}-${mm}-${yyyy}-${hh}h${min}`;

  const campo = page.getByPlaceholder(/nome para o seu pedido/i);
  if (await campo.isVisible().catch(() => false)) {
    await campo.fill(identificacao);
  }
}

/** Clica em "Avançar para revisão". */
export async function clicarAvancarParaRevisao(page) {
  await tratarModaisTransientes(page, { timeout: 3200 });
  const botao = page
    .getByRole("button", { name: /avan[çc]ar para (a )?revis[ãa]o/i })
    .first();
  await botao.scrollIntoViewIfNeeded();
  await botao.click({ force: true });
}

/** Clica no CTA final da revisão ("Finalizar pedido" e variações de rótulo). */
export async function clicarFinalizarPedido(page) {
  await tratarModaisTransientes(page, { timeout: 3200 });
  const botao = page
    .getByRole("button", {
      name: /finalizar(\s+o)?\s+pedido|finalizar a compra|efetivar pedido|confirmar pedido|enviar pedido/i,
    })
    .first();
  // A tela de revisão ainda calcula estimativa de entrega e impostos (estimated-date /
  // taxes/calculate) quando abre; clicar antes disso é ignorado e o pedido nunca é enviado.
  await aguardarLoadingSumir(page);
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await expect(botao).toBeEnabled({ timeout: 15000 });
  await botao.scrollIntoViewIfNeeded();
  await botao.click();
}

/** Valida que o pedido foi enviado ("Seu pedido foi enviado."). */
export async function validarPedidoEnviado(page) {
  await expect(page.getByText(/seu pedido foi enviado/i)).toBeVisible({ timeout: 30000 });
}

/**
 * Do carrinho até a confirmação de envio:
 *  1) (opcional) Avançar para revisão
 *  2) Preencher data desejada
 *  3) Avançar para revisão (de novo, agora saindo de "Configurar carrinho")
 *  4) Identificação do pedido
 *  5) Finalizar pedido
 *  6) Validar confirmação
 *
 * `pularPrimeiroAvancar: true` quando o chamador já sabe que está em "Configurar carrinho" (ex.:
 * chegou via ícone do carrinho), não em "Selecionar produtos".
 */
export async function finalizarPedidoNoCarrinho(page, { pularPrimeiroAvancar = false } = {}) {
  // Modal informativo "Condição de pagamento para todos os itens do carrinho" costuma aparecer
  // ao entrar em "Configurar carrinho".
  await fecharModaisIniciais(page);

  if (!pularPrimeiroAvancar) {
    await clicarAvancarParaRevisao(page);
  }

  await preencherDatasDesejadasNoCarrinho(page);
  await clicarAvancarParaRevisao(page);
  await tratarModaisTransientes(page);

  await preencherIdentificacaoPedido(page);

  await clicarFinalizarPedido(page);
  await tratarModaisTransientes(page);

  await validarPedidoEnviado(page);
}

const SEL_BUSCA_PRODUTO =
  '#search-product-input, input[placeholder*="Buscar" i], input[placeholder*="Pesquisar" i], ' +
  'input[placeholder*="produto" i], input[placeholder*="código" i], input[type="search"]';

/** Busca um termo na tela "Comprar selecionando itens", sem validar o resultado. */
export async function buscarTextoSemValidarResultado(page, texto) {
  const input = page.locator(SEL_BUSCA_PRODUTO).first();
  if (!(await input.isVisible().catch(() => false))) return;
  await input.fill(texto);
  await input.press("Enter");
}

/** Valida que a tela mostra algum indício de "sem resultados" / lista vazia. */
export async function validarMensagemBuscaSemResultados(page) {
  await expect(
    page.getByText(
      /nenhum resultado|nenhum produto|sem resultado|n[ãa]o encontramos|nada encontrado|lista.*vazia/i,
    ),
  ).toBeVisible({ timeout: 20000 });
}
