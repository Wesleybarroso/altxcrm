import { afterEach, describe, expect, it, vi } from "vitest";
import { checkMailVpsConnection } from "./integrations/mailVps";

const originalUrl = process.env.VPS_MAIL_API_URL;
const originalToken = process.env.VPS_MAIL_API_TOKEN;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalUrl === undefined) delete process.env.VPS_MAIL_API_URL;
  else process.env.VPS_MAIL_API_URL = originalUrl;
  if (originalToken === undefined) delete process.env.VPS_MAIL_API_TOKEN;
  else process.env.VPS_MAIL_API_TOKEN = originalToken;
});

describe("Mail VPS integration", () => {
  it("calls the health endpoint with an HTTPS URL and bearer token", async () => {
    process.env.VPS_MAIL_API_URL = "https://mail.example.test";
    process.env.VPS_MAIL_API_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "healthy", version: "1.2.3" }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkMailVpsConnection()).resolves.toEqual({ ok: true, status: "healthy", version: "1.2.3" });
    expect(fetchMock).toHaveBeenCalledWith("https://mail.example.test/health", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }));
  });

  it("rejects an insecure VPS URL before making a request", async () => {
    process.env.VPS_MAIL_API_URL = "http://mail.example.test";
    process.env.VPS_MAIL_API_TOKEN = "test-token";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkMailVpsConnection()).rejects.toThrow("must use HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
