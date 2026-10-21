/**
 * Modais do Hefesto (design system do Gerdau Mais). Portado do helper `fecharModaisIniciais` /
 * `tratarModaisTransientes` do projeto Cypress.
 *
 * Diferença chave em relação à versão Cypress: lá, checar "existe modal?" sem usar um comando
 * com retry nativo (`cy.get(...).should(...)`) causou bugs reais de timing (o código olhava a
 * tela 1x só, num instante em que o modal ainda não tinha renderizado, e seguia em frente como
 * se não houvesse nada). Aqui usamos `locator.waitFor({ state: 'visible', timeout })`, que já
 * espera de verdade — não é preciso reimplementar polling manual.
 */

const REGEX_MODAL_TRANSIENTE =
  /produtos\s+id[eê]nticos|quantidades\s+dos\s+produtos\s+id[eê]nticos\s+ser[aã]o\s+somadas|servi[cç]o\s+indispon[ií]vel|tente\s+novamente\s+mais\s+tarde|aten[cç][aã]o|compra\s+em\s+andamento|continuar\s+de\s+onde\s+parou/i;

const SEL_MODAL = '[data-testid="modal-container"]';
const SEL_MODAL_X = '.hefesto-modal__header [data-testid="hefesto-button"]';
const TEXTO_LOADING = /aguarde alguns instantes/i;

/**
 * Espera o modal "Aguarde alguns instantes / Carregando os dados..." passar. Ele pode demorar um
 * instante pra aparecer depois de uma ação (ex.: "Adicionar ao carrinho"), então primeiro damos
 * uma janela curta pra ele surgir e só então esperamos sumir. Se nunca aparecer, segue em frente.
 */
export async function aguardarLoadingSumir(page, { aparecer = 2000, sumir = 30000 } = {}) {
  const loading = page.locator(SEL_MODAL).filter({ hasText: TEXTO_LOADING }).first();
  const apareceu = await loading
    .waitFor({ state: "visible", timeout: aparecer })
    .then(() => true)
    .catch(() => false);
  if (apareceu) {
    await loading.waitFor({ state: "hidden", timeout: sumir });
  }
}

/**
 * Espera o loading inicial sumir e fecha, em sequência, os modais promocionais/informativos que
 * aparecem logo após o login ou ao entrar numa tela nova (ex.: "Nova experiência de pedidos",
 * "Condição de pagamento..."). Fecha por "Fechar", pelo X do cabeçalho, ou — no caso do modal
 * "Continuar seu último pedido?" (pedido em andamento de uma execução anterior) — por
 * "Novo pedido", pra garantir um estado limpo e determinístico.
 */
export async function fecharModaisIniciais(page, { maxModais = 6 } = {}) {
  const loading = page.getByText(TEXTO_LOADING).first();
  if (await loading.isVisible().catch(() => false)) {
    await loading.waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
  }

  for (let i = 0; i < maxModais; i++) {
    const modal = page.locator(SEL_MODAL).first();
    const visivel = await modal
      .waitFor({ state: "visible", timeout: i === 0 ? 6000 : 2000 })
      .then(() => true)
      .catch(() => false);
    if (!visivel) break;

    const fechar = modal.getByRole("button", { name: /^\s*fechar\s*$/i });
    const novoPedido = modal.getByRole("button", { name: /^\s*novo pedido\s*$/i });
    // "Sua sessão foi encerrada" (ex.: ao abrir /auth?logout=true com sessão já expirada) — tem
    // só o botão "Voltar ao login", sem "Fechar"/X.
    const voltarLogin = modal.getByRole("button", { name: /^\s*voltar ao login\s*$/i });
    const x = modal.locator(SEL_MODAL_X).first();

    if (await fechar.count()) {
      await fechar.first().click({ force: true });
    } else if (await voltarLogin.count()) {
      await voltarLogin.first().click({ force: true });
    } else if (await x.count()) {
      await x.click({ force: true });
    } else if (await novoPedido.count()) {
      await novoPedido.first().click({ force: true });
    } else {
      break; // modal sem botão reconhecido — não insiste.
    }

    await page.waitForTimeout(400);
  }
}

/**
 * Detecta modais transientes (produtos idênticos, serviço indisponível, "continuar de onde
 * parou" etc.) e clica em "Continuar"/"OK"/"Fechar"/"Entendi". Não falha se não houver modal.
 */
export async function tratarModaisTransientes(page, { timeout = 8000 } = {}) {
  const modal = page
    .locator(`.hefesto-modal__container, [role="dialog"], ${SEL_MODAL}`)
    .first();

  const visivel = await modal
    .waitFor({ state: "visible", timeout })
    .then(() => true)
    .catch(() => false);
  if (!visivel) return;

  const texto = (await modal.innerText().catch(() => "")).toLowerCase();
  if (!REGEX_MODAL_TRANSIENTE.test(texto)) return;

  const botao = modal
    .getByRole("button", { name: /^(continuar|ok|fechar|entendi|confirmar)$/i })
    .first();
  await botao.click({ force: true });

  // Depois de confirmar, pode aparecer um overlay/modal de processamento — espera sumir antes
  // de devolver o controle pro chamador.
  await modal.waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
}
