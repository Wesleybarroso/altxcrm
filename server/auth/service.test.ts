import { afterEach, describe, expect, it } from "vitest";
import { createSocialStateCookie, getSocialAuthorizationUrl, readSocialState } from "./service";

type FakeResponse = {
  req: { protocol: string; headers: Record<string, string> };
  cookie: (name: string, value: string, options: Record<string, unknown>) => void;
};

describe("social authentication helpers", () => {
  const originalGithubClientId = process.env.GITHUB_CLIENT_ID;

  afterEach(() => {
    if (originalGithubClientId === undefined) delete process.env.GITHUB_CLIENT_ID;
    else process.env.GITHUB_CLIENT_ID = originalGithubClientId;
  });

  it("accepts a URL-encoded OAuth state cookie", () => {
    let cookieValue = "";
    const response: FakeResponse = {
      req: { protocol: "https", headers: {} },
      cookie: (_name, value) => { cookieValue = value; },
    };
    createSocialStateCookie(response as never, "github", "state-123");
    const request = { headers: { cookie: `altxcrm_social_oauth_state=${encodeURIComponent(cookieValue)}` } } as never;

    expect(readSocialState(request, "github", "state-123")).toBe(true);
    expect(readSocialState(request, "github", "wrong-state")).toBe(false);
  });

  it("builds a GitHub authorization URL with the public callback", () => {
    process.env.GITHUB_CLIENT_ID = "github-client-id";
    const request = {
      protocol: "https",
      headers: { host: "crm.example.test" },
      get: () => "crm.example.test",
    } as never;
    const url = new URL(getSocialAuthorizationUrl("github", request, "state-123"));

    expect(url.origin).toBe("https://github.com");
    expect(url.searchParams.get("client_id")).toBe("github-client-id");
    expect(url.searchParams.get("redirect_uri")).toBe("https://crm.example.test/api/auth/github/callback");
    expect(url.searchParams.get("state")).toBe("state-123");
  });
});
