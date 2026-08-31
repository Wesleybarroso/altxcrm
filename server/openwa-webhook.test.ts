import { describe, expect, it, vi } from "vitest";
import { registerOpenwaWebhook } from "./integrations/openwaWebhook";

function buildApp() {
  let handler: ((req: any, res: any) => Promise<unknown>) | undefined;
  return {
    post: vi.fn((_path: string, next: typeof handler) => { handler = next; }),
    getHandler: () => handler,
  };
}

describe("OpenWA inbound webhook", () => {
  it("rejects an empty or invalid secret before processing the payload", async () => {
    const app = buildApp();
    registerOpenwaWebhook(app as any);
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    await app.getHandler()!({ params: { secret: "" }, body: { event: "message.received" } }, { status });
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: "Invalid webhook secret" });
  });
});
