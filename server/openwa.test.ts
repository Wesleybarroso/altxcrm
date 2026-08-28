import { afterEach, describe, expect, it, vi } from "vitest";
import { openwaIntegration } from "./integrations/openwa";

const config = { baseUrl: "https://openwa.example.com", apiKey: "owa_test_api_key" };

afterEach(() => vi.restoreAllMocks());

describe("OpenWA integration transport", () => {
  it("sends the API key in X-API-Key and uses the documented health path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await openwaIntegration.health(config);

    expect(fetchMock).toHaveBeenCalledWith("https://openwa.example.com/api/health", expect.objectContaining({ headers: expect.objectContaining({ "X-API-Key": "owa_test_api_key" }) }));
  });

  it("rejects a non-HTTPS remote gateway", async () => {
    await expect(openwaIntegration.health({ ...config, baseUrl: "http://openwa.example.com" })).rejects.toThrow("HTTPS");
  });

  it("uses the session id and international chat id payload for text messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "m1", timestamp: 1 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await openwaIntegration.sendText(config, "session-1", "5511999999999@c.us", "Olá");

    expect(fetchMock).toHaveBeenCalledWith("https://openwa.example.com/api/sessions/session-1/messages/send-text", expect.objectContaining({ method: "POST", body: JSON.stringify({ chatId: "5511999999999@c.us", text: "Olá" }) }));
  });
});
