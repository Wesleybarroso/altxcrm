import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, activityLogs, domains, emailMessages, mailboxes, users, webhooks, whatsappSessions, workspaceSettings } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { decryptWorkspaceSecret, encryptWorkspaceSecret } from "./security/secrets";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) { if (user[field] !== undefined) { const value = user[field] ?? null; values[field] = value; updateSet[field] = value; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getWorkspaceSnapshot(ownerId: number) {
  const db = await getDb();
  if (!db) return { domains: [], mailboxes: [], messages: [], activities: [], settings: null };
  const [domainRows, mailboxRows, messageRows, activityRows, settingsRows] = await Promise.all([
    db.select().from(domains).where(eq(domains.ownerId, ownerId)).orderBy(desc(domains.createdAt)),
    db.select().from(mailboxes).where(eq(mailboxes.ownerId, ownerId)).orderBy(desc(mailboxes.createdAt)),
    db.select().from(emailMessages).where(eq(emailMessages.ownerId, ownerId)).orderBy(desc(emailMessages.createdAt)).limit(50),
    db.select().from(activityLogs).where(eq(activityLogs.ownerId, ownerId)).orderBy(desc(activityLogs.createdAt)).limit(30),
    db.select().from(workspaceSettings).where(eq(workspaceSettings.ownerId, ownerId)).limit(1),
  ]);
  const rawSettings = settingsRows[0];
  const settings = rawSettings ? {
    id: rawSettings.id,
    ownerId: rawSettings.ownerId,
    storageLimitGb: rawSettings.storageLimitGb,
    providerLabel: rawSettings.providerLabel,
    integrationEndpoint: rawSettings.integrationEndpoint,
    mfaRequired: rawSettings.mfaRequired,
    securityAlerts: rawSettings.securityAlerts,
    auditLogEnabled: rawSettings.auditLogEnabled,
    updatedAt: rawSettings.updatedAt,
  } : null;
  return { domains: domainRows, mailboxes: mailboxRows, messages: messageRows, activities: activityRows, settings };
}

export async function createDomain(ownerId: number, domain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(domains).values({ ownerId, domain: domain.trim().toLowerCase(), status: "pending", dnsTarget: "mx.altx.io" });
  await logActivity(ownerId, "Domínio adicionado", "domain", Number(result[0].insertId), domain);
  return Number(result[0].insertId);
}

export async function updateDomainStatus(ownerId: number, id: number, status: "pending" | "verified" | "suspended") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(domains).set({ status, verifiedAt: status === "verified" ? new Date() : null }).where(and(eq(domains.id, id), eq(domains.ownerId, ownerId)));
}

export async function deleteDomain(ownerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(domains).where(and(eq(domains.id, id), eq(domains.ownerId, ownerId)));
  await logActivity(ownerId, "Domínio removido", "domain", id);
}

export async function createMailbox(ownerId: number, input: { domainId: number; email: string; displayName: string; role?: string; quotaGb?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(mailboxes).values({ ownerId, domainId: input.domainId, email: input.email.toLowerCase(), displayName: input.displayName, role: input.role ?? "Equipe", quotaGb: input.quotaGb ?? 10, usedGb: 0, status: "active" });
  await logActivity(ownerId, "Caixa postal criada", "mailbox", Number(result[0].insertId), input.email);
  return Number(result[0].insertId);
}

export async function updateMailbox(ownerId: number, id: number, input: { displayName?: string; role?: string; quotaGb?: number; status?: "active" | "suspended" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(mailboxes).set(input).where(and(eq(mailboxes.id, id), eq(mailboxes.ownerId, ownerId)));
}

export async function deleteMailbox(ownerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(mailboxes).where(and(eq(mailboxes.id, id), eq(mailboxes.ownerId, ownerId)));
  await logActivity(ownerId, "Caixa postal removida", "mailbox", id);
}

export async function getWebhooks(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhooks).where(eq(webhooks.ownerId, ownerId)).orderBy(desc(webhooks.createdAt));
}

export async function getWebhookById(ownerId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(webhooks).where(and(eq(webhooks.ownerId, ownerId), eq(webhooks.id, id))).limit(1);
  return rows[0];
}

export async function createEmailMessage(ownerId: number, input: { mailboxId: number; senderEmail: string; senderName?: string; toEmails: string[]; ccEmails?: string[]; subject: string; body: string; folder?: "inbox" | "sent" | "archived" | "trash" | "draft"; scheduledAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(emailMessages).values({ ownerId, mailboxId: input.mailboxId, senderEmail: input.senderEmail, senderName: input.senderName, toEmails: JSON.stringify(input.toEmails), ccEmails: input.ccEmails ? JSON.stringify(input.ccEmails) : null, subject: input.subject, body: input.body, folder: input.folder ?? "draft", scheduledAt: input.scheduledAt ?? null, sentAt: input.folder === "sent" ? new Date() : null, isRead: 1, isStarred: 0 });
  await logActivity(ownerId, input.scheduledAt ? "E-mail agendado" : "Rascunho criado", "message", Number(result[0].insertId), input.subject);
  return Number(result[0].insertId);
}

export async function updateMessageStatus(ownerId: number, id: number, values: { folder?: "inbox" | "sent" | "archived" | "trash" | "draft"; scheduledAt?: Date | null; sentAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(emailMessages).set(values).where(and(eq(emailMessages.id, id), eq(emailMessages.ownerId, ownerId)));
}

export async function updateMessageFolder(ownerId: number, id: number, folder: "inbox" | "sent" | "archived" | "trash" | "draft") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(emailMessages).set({ folder, isRead: 1 }).where(and(eq(emailMessages.id, id), eq(emailMessages.ownerId, ownerId)));
  await logActivity(ownerId, `Mensagem movida para ${folder}`, "message", id);
}

export async function createWebhook(ownerId: number, input: { name: string; url: string; secret: string; events: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(webhooks).values({ ownerId, name: input.name, url: input.url, secret: input.secret, events: JSON.stringify(input.events), status: "active" });
  await logActivity(ownerId, "Webhook criado", "webhook", Number(result[0].insertId), input.name);
  return Number(result[0].insertId);
}

export async function updateWebhook(ownerId: number, id: number, input: { name?: string; url?: string; events?: string[]; status?: "active" | "paused" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(webhooks).set({ ...input, events: input.events ? JSON.stringify(input.events) : undefined }).where(and(eq(webhooks.id, id), eq(webhooks.ownerId, ownerId)));
}

export async function deleteWebhook(ownerId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.ownerId, ownerId)));
  await logActivity(ownerId, "Webhook removido", "webhook", id);
}

export async function saveWorkspaceSettings(ownerId: number, input: { storageLimitGb?: number; providerLabel?: string; integrationEndpoint?: string; mfaRequired?: number; securityAlerts?: number; auditLogEnabled?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(workspaceSettings).values({ ownerId, storageLimitGb: input.storageLimitGb ?? 200, providerLabel: input.providerLabel ?? "VPS Altx · Produção", integrationEndpoint: input.integrationEndpoint ?? "api.altx.io/v1/mail", mfaRequired: input.mfaRequired ?? 1, securityAlerts: input.securityAlerts ?? 1, auditLogEnabled: input.auditLogEnabled ?? 1 }).onDuplicateKeyUpdate({ set: input });
}

export async function saveCloudflareApiKey(ownerId: number, apiKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const encrypted = encryptWorkspaceSecret(apiKey);
  await db.insert(workspaceSettings).values({ ownerId, cloudflareApiKeyEncrypted: encrypted }).onDuplicateKeyUpdate({ set: { cloudflareApiKeyEncrypted: encrypted } });
  await logActivity(ownerId, "Chave API do Cloudflare atualizada", "integration", undefined, "Credencial armazenada criptografada no workspace");
  return { success: true } as const;
}

export async function getCloudflareApiKey(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ encrypted: workspaceSettings.cloudflareApiKeyEncrypted }).from(workspaceSettings).where(eq(workspaceSettings.ownerId, ownerId)).limit(1);
  const encrypted = rows[0]?.encrypted;
  return encrypted ? decryptWorkspaceSecret(encrypted) : null;
}

export async function hasCloudflareApiKey(ownerId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ encrypted: workspaceSettings.cloudflareApiKeyEncrypted }).from(workspaceSettings).where(eq(workspaceSettings.ownerId, ownerId)).limit(1);
  return Boolean(rows[0]?.encrypted);
}

export async function clearCloudflareApiKey(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(workspaceSettings).set({ cloudflareApiKeyEncrypted: null }).where(eq(workspaceSettings.ownerId, ownerId));
  await logActivity(ownerId, "Chave API do Cloudflare removida", "integration", undefined, "Credencial removida do workspace");
  return { success: true } as const;
}

export async function saveOpenwaConfig(ownerId: number, input: { baseUrl: string; apiKey: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const baseUrl = input.baseUrl.trim().replace(/\/$/, "");
  if (!/^https:\/\//i.test(baseUrl) && !/^http:\/\/localhost(?::\d+)?$/i.test(baseUrl)) throw new Error("OpenWA URL must use HTTPS");
  const encrypted = encryptWorkspaceSecret(input.apiKey);
  await db.insert(workspaceSettings).values({ ownerId, openwaBaseUrl: baseUrl, openwaApiKeyEncrypted: encrypted }).onDuplicateKeyUpdate({ set: { openwaBaseUrl: baseUrl, openwaApiKeyEncrypted: encrypted } });
  await logActivity(ownerId, "Gateway OpenWA configurado", "whatsapp", undefined, "URL e API key armazenadas com segurança");
  return { success: true } as const;
}

export async function getOpenwaConfig(ownerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ baseUrl: workspaceSettings.openwaBaseUrl, encrypted: workspaceSettings.openwaApiKeyEncrypted }).from(workspaceSettings).where(eq(workspaceSettings.ownerId, ownerId)).limit(1);
  const row = rows[0];
  if (!row?.baseUrl || !row.encrypted) return null;
  return { baseUrl: row.baseUrl, apiKey: decryptWorkspaceSecret(row.encrypted) };
}

export async function hasOpenwaConfig(ownerId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ baseUrl: workspaceSettings.openwaBaseUrl, encrypted: workspaceSettings.openwaApiKeyEncrypted }).from(workspaceSettings).where(eq(workspaceSettings.ownerId, ownerId)).limit(1);
  return Boolean(rows[0]?.baseUrl && rows[0]?.encrypted);
}

export async function getWhatsappSessions(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(whatsappSessions).where(eq(whatsappSessions.ownerId, ownerId)).orderBy(desc(whatsappSessions.createdAt));
}

export async function createWhatsappSession(ownerId: number, input: { openwaSessionId: string; name: string; status?: string; phone?: string | null; pushName?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(whatsappSessions).values({ ownerId, openwaSessionId: input.openwaSessionId, name: input.name, status: input.status ?? "created", phone: input.phone ?? null, pushName: input.pushName ?? null, lastSyncedAt: new Date() });
  await logActivity(ownerId, "Sessão WhatsApp criada", "whatsapp", Number(result[0].insertId), input.name);
  return Number(result[0].insertId);
}

export async function updateWhatsappSession(ownerId: number, openwaSessionId: string, input: { status?: string; phone?: string | null; pushName?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(whatsappSessions).set({ ...input, lastSyncedAt: new Date() }).where(and(eq(whatsappSessions.ownerId, ownerId), eq(whatsappSessions.openwaSessionId, openwaSessionId)));
}

export async function logActivity(ownerId: number, action: string, resourceType: string, resourceId?: number, detail?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values({ ownerId, action, resourceType, resourceId, detail });
}
