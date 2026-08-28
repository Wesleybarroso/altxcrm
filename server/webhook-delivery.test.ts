import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverWebhookTest } from "./integrations/webhookDelivery";

afterEach(() => vi.restoreAllMocks());

describe("webhook delivery", () => {
  it("sends an HTTPS signed test payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await deliverWebhookTest({ url: "https://n8n.example.com/webhook/altx", secret: "whsec_test", events: ["message.received"] });
    expect(fetchMock).toHaveBeenCalledWith("https://n8n.example.com/webhook/altx", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ "X-Altx-Event": "integration.test", "X-Altx-Signature": expect.stringMatching(/^sha256=/) }) }));
  });

  it("rejects insecure endpoints", async () => {
    await expect(deliverWebhookTest({ url: "http://n8n.example.com/webhook/altx", secret: "whsec_test", events: [] })).rejects.toThrow("HTTPS");
  });

  it("surfaces a non-success endpoint response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("failed", { status: 500 })));
    await expect(deliverWebhookTest({ url: "https://n8n.example.com/webhook/altx", secret: "whsec_test", events: [] })).rejects.toThrow("500");
  });
});
