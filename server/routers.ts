import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {   clearCloudflareApiKey, createDomain, createEmailMessage, createMailbox, createWebhook, createWhatsappSession, deleteDomain, deleteMailbox, deleteWebhook, getOpenwaConfig, getWebhookById, getWebhooks, getWhatsappSessions, getWorkspaceSnapshot, hasCloudflareApiKey, hasOpenwaConfig, logActivity, saveCloudflareApiKey, saveOpenwaConfig, saveWorkspaceSettings, updateDomainStatus, updateMailbox, updateMessageFolder, updateMessageStatus, updateWebhook, updateWhatsappSession } from "./db";
import { checkMailVpsConnection, mailVpsIntegration } from "./integrations/mailVps";
import { openwaIntegration } from "./integrations/openwa";
import { deliverWebhookTest } from "./integrations/webhookDelivery";

const domainIdInput = z.object({ id: z.number().int().positive() });
const mailboxInput = z.object({ domainId: z.number().int().positive(), email: z.string().email(), displayName: z.string().min(2).max(160), role: z.string().max(120).optional(), quotaGb: z.number().int().min(1).max(10000).optional() });
const webhookInput = z.object({ name: z.string().min(2).max(160), url: z.string().url().refine((value) => value.startsWith("https://"), "Webhook deve usar HTTPS"), events: z.array(z.string()).min(1).max(30) });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  infrastructure: router({
    health: protectedProcedure.mutation(() => checkMailVpsConnection()),
  }),
  workspace: router({
    snapshot: protectedProcedure.query(({ ctx }) => getWorkspaceSnapshot(ctx.user.id)),
    settings: protectedProcedure.query(async ({ ctx }) => (await getWorkspaceSnapshot(ctx.user.id)).settings),
    saveSettings: protectedProcedure.input(z.object({ storageLimitGb: z.number().int().min(50).max(10000).optional(), providerLabel: z.string().max(160).optional(), integrationEndpoint: z.string().max(1024).optional(), mfaRequired: z.number().int().min(0).max(1).optional(), securityAlerts: z.number().int().min(0).max(1).optional(), auditLogEnabled: z.number().int().min(0).max(1).optional() })).mutation(({ ctx, input }) => saveWorkspaceSettings(ctx.user.id, input)),
  }),
  domains: router({
    list: protectedProcedure.query(async ({ ctx }) => (await getWorkspaceSnapshot(ctx.user.id)).domains),
    create: protectedProcedure.input(z.object({ domain: z.string().min(3).max(255) })).mutation(async ({ ctx, input }) => { await mailVpsIntegration.createDomain(input.domain); return createDomain(ctx.user.id, input.domain); }),
    verify: protectedProcedure.input(domainIdInput).mutation(async ({ ctx, input }) => { const snapshot = await getWorkspaceSnapshot(ctx.user.id); const domain = snapshot.domains.find((item) => item.id === input.id); if (!domain) throw new Error("Domain not found"); await mailVpsIntegration.verifyDomain(domain.domain); return updateDomainStatus(ctx.user.id, input.id, "verified"); }),
    suspend: adminProcedure.input(domainIdInput).mutation(({ ctx, input }) => updateDomainStatus(ctx.user.id, input.id, "suspended")),
    remove: adminProcedure.input(domainIdInput).mutation(async ({ ctx, input }) => { const snapshot = await getWorkspaceSnapshot(ctx.user.id); const domain = snapshot.domains.find((item) => item.id === input.id); if (domain) await mailVpsIntegration.removeDomain(domain.domain); return deleteDomain(ctx.user.id, input.id); }),
  }),
  mailboxes: router({
    list: protectedProcedure.query(async ({ ctx }) => (await getWorkspaceSnapshot(ctx.user.id)).mailboxes),
    create: protectedProcedure.input(mailboxInput).mutation(async ({ ctx, input }) => { await mailVpsIntegration.createMailbox({ email: input.email, quotaGb: input.quotaGb ?? 10 }); return createMailbox(ctx.user.id, input); }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), displayName: z.string().min(2).max(160).optional(), role: z.string().max(120).optional(), quotaGb: z.number().int().min(1).max(10000).optional(), status: z.enum(["active", "suspended"]).optional() })).mutation(async ({ ctx, input }) => { const { id, ...values } = input; const snapshot = await getWorkspaceSnapshot(ctx.user.id); const mailbox = snapshot.mailboxes.find((item) => item.id === id); if (mailbox) await mailVpsIntegration.updateMailbox(mailbox.email, { quotaGb: values.quotaGb, status: values.status }); return updateMailbox(ctx.user.id, id, values); }),
    remove: adminProcedure.input(domainIdInput).mutation(async ({ ctx, input }) => { const snapshot = await getWorkspaceSnapshot(ctx.user.id); const mailbox = snapshot.mailboxes.find((item) => item.id === input.id); if (mailbox) await mailVpsIntegration.removeMailbox(mailbox.email); return deleteMailbox(ctx.user.id, input.id); }),
  }),
  messages: router({
    list: protectedProcedure.input(z.object({ folder: z.enum(["inbox", "sent", "archived", "trash", "draft"]).default("inbox") }).optional()).query(async ({ ctx, input }) => (await getWorkspaceSnapshot(ctx.user.id)).messages.filter((message) => !input?.folder || message.folder === input.folder)),
    create: protectedProcedure.input(z.object({ mailboxId: z.number().int().positive(), senderEmail: z.string().email(), senderName: z.string().max(160).optional(), toEmails: z.array(z.string().email()).min(1), ccEmails: z.array(z.string().email()).optional(), subject: z.string().min(1).max(500), body: z.string().min(1), folder: z.enum(["draft", "sent"]).default("draft") })).mutation(({ ctx, input }) => createEmailMessage(ctx.user.id, input)),
    send: protectedProcedure.input(z.object({ mailboxId: z.number().int().positive(), senderEmail: z.string().email(), senderName: z.string().max(160).optional(), toEmails: z.array(z.string().email()).min(1), ccEmails: z.array(z.string().email()).optional(), subject: z.string().min(1).max(500), body: z.string().min(1) })).mutation(async ({ ctx, input }) => { await mailVpsIntegration.sendMessage({ from: input.senderEmail, to: input.toEmails, subject: input.subject, body: input.body }); const id = await createEmailMessage(ctx.user.id, { ...input, folder: "sent" }); return { id, success: true } as const; }),
    schedule: protectedProcedure.input(z.object({ mailboxId: z.number().int().positive(), senderEmail: z.string().email(), senderName: z.string().max(160).optional(), toEmails: z.array(z.string().email()).min(1), ccEmails: z.array(z.string().email()).optional(), subject: z.string().min(1).max(500), body: z.string().min(1), scheduledAt: z.coerce.date() })).mutation(async ({ ctx, input }) => { await mailVpsIntegration.sendMessage({ from: input.senderEmail, to: input.toEmails, subject: input.subject, body: input.body, scheduledAt: input.scheduledAt.getTime() }); const id = await createEmailMessage(ctx.user.id, { ...input, folder: "draft" }); return { id, success: true } as const; }),
    move: protectedProcedure.input(z.object({ id: z.number().int().positive(), folder: z.enum(["inbox", "sent", "archived", "trash", "draft"]) })).mutation(({ ctx, input }) => updateMessageFolder(ctx.user.id, input.id, input.folder)),
    markRead: protectedProcedure.input(z.object({ id: z.number().int().positive(), isRead: z.boolean() })).mutation(async ({ ctx, input }) => { const { getDb } = await import("./db"); const { and, eq } = await import("drizzle-orm"); const { emailMessages } = await import("../drizzle/schema"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(emailMessages).set({ isRead: input.isRead ? 1 : 0 }).where(and(eq(emailMessages.id, input.id), eq(emailMessages.ownerId, ctx.user.id))); return { success: true } as const; }),
  }),
  scheduled: router({
    list: protectedProcedure.query(async ({ ctx }) => (await getWorkspaceSnapshot(ctx.user.id)).messages.filter((message) => message.scheduledAt)),
    create: protectedProcedure.input(z.object({ mailboxId: z.number().int().positive(), senderEmail: z.string().email(), senderName: z.string().max(160).optional(), toEmails: z.array(z.string().email()).min(1), subject: z.string().min(1).max(500), body: z.string().min(1), scheduledAt: z.coerce.date() })).mutation(async ({ ctx, input }) => { await mailVpsIntegration.sendMessage({ from: input.senderEmail, to: input.toEmails, subject: input.subject, body: input.body, scheduledAt: input.scheduledAt.getTime() }); const id = await createEmailMessage(ctx.user.id, { ...input, folder: "draft" }); return { id, success: true } as const; }),
    cancel: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await updateMessageStatus(ctx.user.id, input.id, { folder: "draft", scheduledAt: null }); return { success: true } as const; }),
  }),
  integrations: router({
    cloudflareStatus: protectedProcedure.query(({ ctx }) => hasCloudflareApiKey(ctx.user.id).then((configured) => ({ configured }))),
    saveCloudflareApiKey: protectedProcedure.input(z.object({ apiKey: z.string().trim().min(10).max(500) })).mutation(({ ctx, input }) => saveCloudflareApiKey(ctx.user.id, input.apiKey)),
    removeCloudflareApiKey: protectedProcedure.mutation(({ ctx }) => clearCloudflareApiKey(ctx.user.id)),
  }),
  whatsapp: router({
    configStatus: protectedProcedure.query(({ ctx }) => hasOpenwaConfig(ctx.user.id).then((configured) => ({ configured }))),
    saveConfig: protectedProcedure.input(z.object({ baseUrl: z.string().url(), apiKey: z.string().trim().min(10).max(500) })).mutation(({ ctx, input }) => saveOpenwaConfig(ctx.user.id, input)),
    testConnection: protectedProcedure.mutation(async ({ ctx }) => { const config = await getOpenwaConfig(ctx.user.id); if (!config) throw new Error("OpenWA não configurado"); return openwaIntegration.health(config); }),
    sessions: router({
      list: protectedProcedure.query(({ ctx }) => getWhatsappSessions(ctx.user.id)),
      create: protectedProcedure.input(z.object({ name: z.string().regex(/^[a-z0-9-]{3,50}$/, "Use de 3 a 50 caracteres: letras minúsculas, números ou hífen") })).mutation(async ({ ctx, input }) => { const config = await getOpenwaConfig(ctx.user.id); if (!config) throw new Error("OpenWA não configurado"); const remote = await openwaIntegration.createSession(config, input.name); await createWhatsappSession(ctx.user.id, { openwaSessionId: remote.id, name: remote.name, status: remote.status, phone: remote.phone ?? null, pushName: remote.pushName ?? null }); return remote; }),
      start: protectedProcedure.input(z.object({ sessionId: z.string().min(1).max(120) })).mutation(async ({ ctx, input }) => { const config = await getOpenwaConfig(ctx.user.id); if (!config) throw new Error("OpenWA não configurado"); const remote = await openwaIntegration.startSession(config, input.sessionId); await updateWhatsappSession(ctx.user.id, input.sessionId, { status: remote.status, phone: remote.phone ?? null, pushName: remote.pushName ?? null }); return remote; }),
      status: protectedProcedure.input(z.object({ sessionId: z.string().min(1).max(120) })).query(async ({ ctx, input }) => { const config = await getOpenwaConfig(ctx.user.id); if (!config) throw new Error("OpenWA não configurado"); const remote = await openwaIntegration.getSession(config, input.sessionId); await updateWhatsappSession(ctx.user.id, input.sessionId, { status: remote.status, phone: remote.phone ?? null, pushName: remote.pushName ?? null }); return remote; }),
      qr: protectedProcedure.input(z.object({ sessionId: z.string().min(1).max(120) })).query(async ({ ctx, input }) => { const config = await getOpenwaConfig(ctx.user.id); if (!config) throw new Error("OpenWA não configurado"); return openwaIntegration.getQr(config, input.sessionId); }),
      sendText: protectedProcedure.input(z.object({ sessionId: z.string().min(1).max(120), chatId: z.string().regex(/^\d+@c\.us$/, "Use o formato internacional 5511999999999@c.us"), text: z.string().min(1).max(4096) })).mutation(async ({ ctx, input }) => { const config = await getOpenwaConfig(ctx.user.id); if (!config) throw new Error("OpenWA não configurado"); await getWhatsappSessions(ctx.user.id); return openwaIntegration.sendText(config, input.sessionId, input.chatId, input.text); }),
    }),
  }),
  webhooks: router({
    list: protectedProcedure.query(({ ctx }) => getWebhooks(ctx.user.id)),
    create: protectedProcedure.input(webhookInput).mutation(({ ctx, input }) => createWebhook(ctx.user.id, { ...input, secret: `whsec_${nanoid(32)}` })),
    update: protectedProcedure.input(webhookInput.extend({ id: z.number().int().positive(), status: z.enum(["active", "paused"]).optional() })).mutation(({ ctx, input }) => { const { id, ...values } = input; return updateWebhook(ctx.user.id, id, values); }),
    remove: protectedProcedure.input(domainIdInput).mutation(({ ctx, input }) => deleteWebhook(ctx.user.id, input.id)),
    test: protectedProcedure.input(domainIdInput).mutation(async ({ ctx, input }) => { const webhook = await getWebhookById(ctx.user.id, input.id); if (!webhook) throw new TRPCError({ code: "NOT_FOUND", message: "Webhook não encontrado" }); let events: string[] = []; try { events = JSON.parse(webhook.events) as string[]; } catch { events = []; } const result = await deliverWebhookTest({ url: webhook.url, secret: webhook.secret, events }); await logActivity(ctx.user.id, "Webhook testado", "webhook", input.id, `Entrega de teste HTTP ${result.status}`); return result; }),
  }),
});

export type AppRouter = typeof appRouter;
