import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pageFiles = ["Home.tsx", "Mailboxes.tsx", "Inbox.tsx", "Scheduled.tsx", "Archive.tsx", "Domains.tsx", "Integrations.tsx", "Settings.tsx"];
const legacyDemoValues = [
  "1.284",
  "3.842",
  "2.408",
  "98,7",
  "99,6",
  "marina@cliente.com",
  "mx.altx.io",
  "smtp.altx.io",
  "api.altx.io",
  "VPS Altx · Produção",
  "Newsletter — novidades do mês",
  "Briefing da campanha de setembro",
  "Última sincronização há 4 min",
  "Registrar eventos por 180 dias",
];

describe("painel sem dados demonstrativos", () => {
  it("não contém os valores históricos de demonstração nas páginas do painel", () => {
    for (const file of pageFiles) {
      const source = readFileSync(resolve(process.cwd(), "client/src/pages", file), "utf8");
      for (const value of legacyDemoValues) expect(source, `${file} ainda contém ${value}`).not.toContain(value);
    }
  });
});
