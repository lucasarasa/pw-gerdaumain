import { chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.goto("https://www.google.com/");
  await page.getByRole("combobox", { name: "Pesquisar" }).fill("Teste");
  await page.getByRole("button", { name: "Pesquisa Google" }).click();

  await new Promise((r) => setTimeout(r, 5000));

  await browser.close();
})();
