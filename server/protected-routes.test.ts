import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function unauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected AltxCRM procedures", () => {
  it("blocks domain listing when the session is not authenticated", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.domains.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks VPS health checks when the session is not authenticated", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.infrastructure.health()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("blocks message, schedule and webhook operations when the session is not authenticated", async () => {
    const caller = appRouter.createCaller(unauthenticatedContext());
    await expect(caller.messages.list({ folder: "inbox" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.scheduled.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.webhooks.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
