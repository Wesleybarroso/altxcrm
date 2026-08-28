import { describe, expect, it } from "vitest";

const describeLive = process.env.RUN_LIVE_CLOUDFLARE_TEST === "1" ? describe : describe.skip;

describeLive("Cloudflare account credential", () => {
  it("consegue consultar as zonas da conta configurada", async () => {
    const email = process.env.CLOUDFLARE_ACCOUNT_EMAIL;
    const apiKey = process.env.CLOUDFLARE_GLOBAL_API_KEY;
    expect(email, "CLOUDFLARE_ACCOUNT_EMAIL não configurado").toBeTruthy();
    expect(apiKey, "CLOUDFLARE_GLOBAL_API_KEY não configurado").toBeTruthy();

    const response = await fetch("https://api.cloudflare.com/client/v4/zones?per_page=1", {
      headers: {
        "X-Auth-Email": email!,
        "X-Auth-Key": apiKey!,
      },
    });
    const payload = await response.json() as {
      success?: boolean;
      errors?: Array<{ message?: string }>;
    };

    expect(response.ok, payload.errors?.[0]?.message || "Credencial Cloudflare rejeitada").toBe(true);
    expect(payload.success).toBe(true);
  }, 15000);
});
