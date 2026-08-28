import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createDomain: vi.fn(),
  createEmailMessage: vi.fn(),
  createMailbox: vi.fn(),
  createWebhook: vi.fn(),
  deleteDomain: vi.fn(),
  deleteMailbox: vi.fn(),
  deleteWebhook: vi.fn(),
  getWebhooks: vi.fn(),
  getDb: vi.fn(),
  getWorkspaceSnapshot: vi.fn(),
  logActivity: vi.fn(),
  saveWorkspaceSettings: vi.fn(),
  updateDomainStatus: vi.fn(),
  updateMailbox: vi.fn(),
  updateMessageFolder: vi.fn(),
  updateMessageStatus: vi.fn(),
  updateWebhook: vi.fn(),
}));

const mailMocks = vi.hoisted(() => ({
  createDomain: vi.fn(),
  verifyDomain: vi.fn(),
  removeDomain: vi.fn(),
  createMailbox: vi.fn(),
  updateMailbox: vi.fn(),
  removeMailbox: vi.fn(),
  sendMessage: vi.fn(),
  health: vi.fn(),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./integrations/mailVps", () => ({
  checkMailVpsConnection: mailMocks.health,
  mailVpsIntegration: {
    createDomain: mailMocks.createDomain,
    verifyDomain: mailMocks.verifyDomain,
    removeDomain: mailMocks.removeDomain,
    createMailbox: mailMocks.createMailbox,
    updateMailbox: mailMocks.updateMailbox,
    removeMailbox: mailMocks.removeMailbox,
    sendMessage: mailMocks.sendMessage,
  },
}));

import { appRouter } from "./routers";

const user = {
  id: 7,
  openId: "crud-test-user",
  email: "admin@altx.test",
  name: "Admin Teste",
  loginMethod: "oauth",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(currentUser: typeof user | null): TrpcContext {
  return {
    user: currentUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const snapshot = {
  domains: [{ id: 11, ownerId: user.id, domain: "altx.test", status: "pending", dnsTarget: "mx.altx.io" }],
  mailboxes: [{ id: 21, ownerId: user.id, domainId: 11, email: "ops@altx.test", displayName: "Operações", role: "Equipe", quotaGb: 10, usedGb: 0, status: "active" }],
  messages: [],
  activities: [],
  settings: null,
};

describe("AltxCRM CRUD contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getWorkspaceSnapshot.mockResolvedValue(snapshot);
    dbMocks.createDomain.mockResolvedValue(11);
    dbMocks.createMailbox.mockResolvedValue(21);
    dbMocks.createEmailMessage.mockResolvedValue(31);
    dbMocks.createWebhook.mockResolvedValue(41);
    dbMocks.getWebhooks.mockResolvedValue([]);
    dbMocks.updateDomainStatus.mockResolvedValue(undefined);
    dbMocks.updateMailbox.mockResolvedValue(undefined);
    dbMocks.updateMessageStatus.mockResolvedValue(undefined);
    dbMocks.updateWebhook.mockResolvedValue(undefined);
    dbMocks.deleteWebhook.mockResolvedValue(undefined);
    mailMocks.sendMessage.mockResolvedValue({ ok: true, status: 202 });
    mailMocks.health.mockResolvedValue({ ok: true, status: 200 });
  });

  it("bloqueia criação protegida sem sessão", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.domains.create({ domain: "altx.test" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mailMocks.createDomain).not.toHaveBeenCalled();
    expect(dbMocks.createDomain).not.toHaveBeenCalled();
  });

  it("cria domínio somente depois de sincronizar com a camada VPS", async () => {
    const caller = appRouter.createCaller(context(user));
    await caller.domains.create({ domain: "Altx.Test" });
    expect(mailMocks.createDomain).toHaveBeenCalledWith("Altx.Test");
    expect(dbMocks.createDomain).toHaveBeenCalledWith(user.id, "Altx.Test");
  });

  it("valida e cria caixa postal com cota persistente", async () => {
    const caller = appRouter.createCaller(context(user));
    await caller.mailboxes.create({ domainId: 11, email: "ops@altx.test", displayName: "Operações", quotaGb: 25 });
    expect(mailMocks.createMailbox).toHaveBeenCalledWith({ email: "ops@altx.test", quotaGb: 25 });
    expect(dbMocks.createMailbox).toHaveBeenCalledWith(user.id, expect.objectContaining({ domainId: 11, quotaGb: 25 }));
    await expect(caller.mailboxes.create({ domainId: 11, email: "invalid", displayName: "Ops" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("envia mensagem com remetente persistido e grava a pasta sent", async () => {
    const caller = appRouter.createCaller(context(user));
    await caller.messages.send({ mailboxId: 21, senderEmail: "ops@altx.test", senderName: "Operações", toEmails: ["cliente@example.com"], subject: "Status", body: "Atualização" });
    expect(mailMocks.sendMessage).toHaveBeenCalledWith({ from: "ops@altx.test", to: ["cliente@example.com"], subject: "Status", body: "Atualização" });
    expect(dbMocks.createEmailMessage).toHaveBeenCalledWith(user.id, expect.objectContaining({ folder: "sent", mailboxId: 21 }));
  });

  it("agenda mensagem com data normalizada e usa o mesmo transporte seguro", async () => {
    const caller = appRouter.createCaller(context(user));
    const scheduledAt = new Date("2026-09-01T12:00:00.000Z");
    await caller.scheduled.create({ mailboxId: 21, senderEmail: "ops@altx.test", toEmails: ["cliente@example.com"], subject: "Lembrete", body: "Olá", scheduledAt });
    expect(mailMocks.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ scheduledAt: scheduledAt.getTime() }));
    expect(dbMocks.createEmailMessage).toHaveBeenCalledWith(user.id, expect.objectContaining({ scheduledAt, folder: "draft" }));
  });

  it("cria, atualiza e remove webhook dentro do workspace autenticado", async () => {
    const caller = appRouter.createCaller(context(user));
    await caller.webhooks.create({ name: "n8n", url: "https://hooks.example.com/altx", events: ["message.received"] });
    expect(dbMocks.createWebhook).toHaveBeenCalledWith(user.id, expect.objectContaining({ name: "n8n", url: "https://hooks.example.com/altx", secret: expect.stringMatching(/^whsec_/) }));
    await caller.webhooks.update({ id: 41, name: "n8n atualizado", url: "https://hooks.example.com/altx", events: ["message.sent"], status: "paused" });
    expect(dbMocks.updateWebhook).toHaveBeenCalledWith(user.id, 41, expect.objectContaining({ status: "paused" }));
    await caller.webhooks.remove({ id: 41 });
    expect(dbMocks.deleteWebhook).toHaveBeenCalledWith(user.id, 41);
  });
});


describe("AltxCRM CRUD coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getWorkspaceSnapshot.mockResolvedValue({
      ...snapshot,
      messages: [{ id: 31, ownerId: user.id, mailboxId: 21, senderEmail: "cliente@example.com", senderName: "Cliente", toEmails: JSON.stringify(["ops@altx.test"]), ccEmails: null, subject: "Novo pedido", body: "Conteúdo", folder: "inbox", scheduledAt: null, sentAt: null, isRead: 0, isStarred: 0 }],
    });
    dbMocks.getWebhooks.mockResolvedValue([{ id: 41, ownerId: user.id, name: "n8n", url: "https://hooks.example.com/altx", secret: "whsec_test", events: JSON.stringify(["message.received"]), status: "active", lastDeliveryAt: null, createdAt: new Date(), updatedAt: new Date() }]);
    dbMocks.updateDomainStatus.mockResolvedValue(undefined);
    dbMocks.deleteDomain.mockResolvedValue(undefined);
    dbMocks.updateMailbox.mockResolvedValue(undefined);
    dbMocks.deleteMailbox.mockResolvedValue(undefined);
    dbMocks.updateMessageFolder.mockResolvedValue(undefined);
    dbMocks.updateMessageStatus.mockResolvedValue(undefined);
    dbMocks.logActivity.mockResolvedValue(undefined);
    mailMocks.verifyDomain.mockResolvedValue({ ok: true, status: 200 });
    mailMocks.removeDomain.mockResolvedValue({ ok: true, status: 200 });
    mailMocks.updateMailbox.mockResolvedValue({ ok: true, status: 200 });
    mailMocks.removeMailbox.mockResolvedValue({ ok: true, status: 200 });
    mailMocks.health.mockResolvedValue({ ok: true, status: 200 });
    const where = vi.fn().mockResolvedValue(undefined);
    dbMocks.getDb.mockResolvedValue({ update: () => ({ set: () => ({ where }) }) });
  });

  it("verifica domínio e remove domínio pela camada VPS", async () => {
    const caller = appRouter.createCaller(context(user));
    await caller.domains.verify({ id: 11 });
    expect(mailMocks.verifyDomain).toHaveBeenCalledWith("altx.test");
    expect(dbMocks.updateDomainStatus).toHaveBeenCalledWith(user.id, 11, "verified");
    await caller.domains.remove({ id: 11 });
    expect(mailMocks.removeDomain).toHaveBeenCalledWith("altx.test");
    expect(dbMocks.deleteDomain).toHaveBeenCalledWith(user.id, 11);
  });

  it("impede remoção de domínio para usuário sem papel administrativo", async () => {
    const caller = appRouter.createCaller(context({ ...user, role: "user" }));
    await expect(caller.domains.remove({ id: 11 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mailMocks.removeDomain).not.toHaveBeenCalled();
  });

  it("atualiza e remove caixa postal com sincronização na VPS", async () => {
    const caller = appRouter.createCaller(context(user));
    await caller.mailboxes.update({ id: 21, displayName: "Operações Globais", quotaGb: 40, status: "suspended" });
    expect(mailMocks.updateMailbox).toHaveBeenCalledWith("ops@altx.test", { quotaGb: 40, status: "suspended" });
    expect(dbMocks.updateMailbox).toHaveBeenCalledWith(user.id, 21, { displayName: "Operações Globais", quotaGb: 40, status: "suspended" });
    await caller.mailboxes.remove({ id: 21 });
    expect(mailMocks.removeMailbox).toHaveBeenCalledWith("ops@altx.test");
    expect(dbMocks.deleteMailbox).toHaveBeenCalledWith(user.id, 21);
  });

  it("lista mensagens por pasta, move mensagem e marca mensagem como lida", async () => {
    const caller = appRouter.createCaller(context(user));
    const messages = await caller.messages.list({ folder: "inbox" });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.id).toBe(31);
    await caller.messages.move({ id: 31, folder: "archived" });
    expect(dbMocks.updateMessageFolder).toHaveBeenCalledWith(user.id, 31, "archived");
    await caller.messages.markRead({ id: 31, isRead: true });
    expect(dbMocks.getDb).toHaveBeenCalled();
  });

  it("cancela agendamento removendo a data programada", async () => {
    const caller = appRouter.createCaller(context(user));
    await caller.scheduled.cancel({ id: 31 });
    expect(dbMocks.updateMessageStatus).toHaveBeenCalledWith(user.id, 31, { folder: "draft", scheduledAt: null });
  });

  it("lista e testa webhook dentro do workspace autenticado", async () => {
    const caller = appRouter.createCaller(context(user));
    const webhooks = await caller.webhooks.list();
    expect(webhooks).toHaveLength(1);
    expect(webhooks[0]?.name).toBe("n8n");
    const result = await caller.webhooks.test({ id: 41 });
    expect(result).toEqual({ success: true, status: 200 });
    expect(dbMocks.logActivity).toHaveBeenCalledWith(user.id, "Webhook testado", "webhook", 41, "Teste solicitado pela interface");
  });
});
