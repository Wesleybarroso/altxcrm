import { describe, expect, it } from "vitest";

const describeLive = process.env.RUN_LIVE_CLOUDFLARE_TEST === "1" ? describe : describe.skip;

describeLive("Cloudflare API token", () => {
  it("é aceito pelo endpoint oficial de verificação", async () => {
    const token = process.env.CLOUDFLARE_API_TOKEN;
    expect(token, "CLOUDFLARE_API_TOKEN não configurado").toBeTruthy();

    const response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json() as { success?: boolean; errors?: Array<{ message?: string }> };

    expect(response.ok, payload.errors?.[0]?.message || "Token Cloudflare rejeitado").toBe(true);
    expect(payload.success).toBe(true);
  }, 15000);
});
