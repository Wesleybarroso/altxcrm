import { int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const domains = mysqlTable("domains", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  domain: varchar("domain", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "verified", "suspended"]).default("pending").notNull(),
  dnsTarget: varchar("dnsTarget", { length: 255 }).default("mx.altx.io").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const mailboxes = mysqlTable("mailboxes", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  domainId: int("domainId").notNull().references(() => domains.id),
  email: varchar("email", { length: 320 }).notNull(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  role: varchar("role", { length: 120 }).default("Equipe").notNull(),
  quotaGb: int("quotaGb").default(10).notNull(),
  usedGb: int("usedGb").default(0).notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const emailMessages = mysqlTable("emailMessages", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  mailboxId: int("mailboxId").notNull().references(() => mailboxes.id),
  threadId: varchar("threadId", { length: 80 }),
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  senderName: varchar("senderName", { length: 160 }),
  toEmails: text("toEmails").notNull(),
  ccEmails: text("ccEmails"),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  folder: mysqlEnum("folder", ["inbox", "sent", "archived", "trash", "draft"]).default("inbox").notNull(),
  isRead: tinyint("isRead").default(0).notNull(),
  isStarred: tinyint("isStarred").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  name: varchar("name", { length: 160 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  secret: varchar("secret", { length: 255 }).notNull(),
  events: text("events").notNull(),
  status: mysqlEnum("status", ["active", "paused"]).default("active").notNull(),
  lastDeliveryAt: timestamp("lastDeliveryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const whatsappSessions = mysqlTable("whatsappSessions", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  openwaSessionId: varchar("openwaSessionId", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  status: varchar("status", { length: 40 }).default("created").notNull(),
  phone: varchar("phone", { length: 40 }),
  pushName: varchar("pushName", { length: 160 }),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  patientName: varchar("patientName", { length: 160 }).notNull(),
  patientPhone: varchar("patientPhone", { length: 40 }),
  patientEmail: varchar("patientEmail", { length: 320 }),
  service: varchar("service", { length: 160 }).notNull(),
  professional: varchar("professional", { length: 160 }).notNull(),
  room: varchar("room", { length: 80 }),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  status: mysqlEnum("status", ["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  source: mysqlEnum("source", ["manual", "whatsapp"]).default("manual").notNull(),
  whatsappChatId: varchar("whatsappChatId", { length: 160 }),
  confirmationSentAt: timestamp("confirmationSentAt"),
  reminderSentAt: timestamp("reminderSentAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  action: varchar("action", { length: 120 }).notNull(),
  resourceType: varchar("resourceType", { length: 80 }).notNull(),
  resourceId: int("resourceId"),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workspaceSettings = mysqlTable("workspaceSettings", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().unique().references(() => users.id),
  storageLimitGb: int("storageLimitGb").default(200).notNull(),
  providerLabel: varchar("providerLabel", { length: 160 }).default("VPS Altx · Produção").notNull(),
  integrationEndpoint: varchar("integrationEndpoint", { length: 1024 }).default("api.altx.io/v1/mail").notNull(),
  mfaRequired: tinyint("mfaRequired").default(1).notNull(),
  securityAlerts: tinyint("securityAlerts").default(1).notNull(),
  auditLogEnabled: tinyint("auditLogEnabled").default(1).notNull(),
  cloudflareApiKeyEncrypted: text("cloudflareApiKeyEncrypted"),
  openwaBaseUrl: varchar("openwaBaseUrl", { length: 1024 }),
  openwaApiKeyEncrypted: text("openwaApiKeyEncrypted"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Domain = typeof domains.$inferSelect;
export type Mailbox = typeof mailboxes.$inferSelect;
export type EmailMessage = typeof emailMessages.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type WorkspaceSettings = typeof workspaceSettings.$inferSelect;
export type WhatsappSession = typeof whatsappSessions.$inferSelect;
