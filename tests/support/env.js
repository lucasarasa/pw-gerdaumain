import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_FILE = path.resolve(__dirname, "../../playwright.env.json");
const EXAMPLE_FILE = path.resolve(__dirname, "../../playwright.env.example.json");

let cache = null;

/**
 * Lê as credenciais/config locais de `playwright.env.json` (ignorado pelo git — mesmo padrão
 * do `cypress.env.json` no projeto Cypress). Copie `playwright.env.example.json` e preencha.
 */
export function getEnv() {
  if (cache) return cache;

  if (!fs.existsSync(ENV_FILE)) {
    throw new Error(
      `Arquivo "${ENV_FILE}" não encontrado.\n` +
        `Copie "${EXAMPLE_FILE}" para "playwright.env.json" (na raiz do projeto) e preencha com as credenciais do QA.`,
    );
  }

  cache = JSON.parse(fs.readFileSync(ENV_FILE, "utf-8"));
  return cache;
}
