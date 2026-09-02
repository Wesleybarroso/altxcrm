import { afterEach, describe, expect, it } from "vitest";
import { createSocialStateCookie, getSocialAuthorizationUrl, readSocialState } from "./service";

type FakeResponse = {
  req: { protocol: string; headers: Record<string, string> };
  cookie: (name: string, value: string, options: Record<string, unknown>) => void;
};

describe("social authentication helpers", () => {
  const originalGoogleClientId = process.env.GOOGLE_CLIENT_ID;

  afterEach(() => {
    if (originalGoogleClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalGoogleClientId;
  });

  it("accepts a URL-encoded OAuth state cookie", () => {
    let cookieValue = "";
    const response: FakeResponse = {
      req: { protocol: "https", headers: {} },
      cookie: (_name, value) => { cookieValue = value; },
    };
    createSocialStateCookie(response as never, "google", "state-123");
    const request = { headers: { cookie: `altxcrm_social_oauth_state=${encodeURIComponent(cookieValue)}` } } as never;

    expect(readSocialState(request, "google", "state-123")).toBe(true);
    expect(readSocialState(request, "github", "state-123")).toBe(false);
  });

  it("builds a Google authorization URL with the public callback", () => {
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
    const request = {
      protocol: "https",
      headers: { host: "crm.example.test" },
      get: () => "crm.example.test",
    } as never;
    const url = new URL(getSocialAuthorizationUrl("google", request, "state-123"));

    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("client_id")).toBe("google-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://crm.example.test/api/auth/google/callback");
    expect(url.searchParams.get("state")).toBe("state-123");
  });
});
