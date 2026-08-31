import type { Express } from "express";
import { getWebhookBySecret, logActivity } from "../db";

type OpenwaEventBody = {
  event?: string;
  sessionId?: string;
  chatId?: string;
  messageId?: string;
  body?: string;
  status?: string;
  fromMe?: boolean;
  mediaUrl?: string;
  type?: string;
};

const allowedEvents = new Set(["message.received", "message.sent", "message.ack", "message.failed", "session.updated"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max ? value.trim() : undefined;
}

export function registerOpenwaWebhook(app: Express) {
  app.post("/api/automation/openwa/:secret", async (req, res) => {
    try {
      const secret = clean(req.params.secret, 255);
      if (!secret) return res.status(401).json({ error: "Invalid webhook secret" });
      const webhook = await getWebhookBySecret(secret);
      if (!webhook) return res.status(401).json({ error: "Invalid webhook secret" });
      const body = (req.body ?? {}) as OpenwaEventBody;
      const event = clean(body.event, 80);
      if (!event || !allowedEvents.has(event)) return res.status(422).json({ error: "Unsupported OpenWA event" });
      let configuredEvents: string[] = [];
      try { configuredEvents = JSON.parse(webhook.events) as string[]; } catch { configuredEvents = []; }
      if (configuredEvents.length > 0 && !configuredEvents.includes(event)) return res.status(422).json({ error: "Event is not enabled for this webhook" });
      const details = JSON.stringify({ event, sessionId: clean(body.sessionId, 120), chatId: clean(body.chatId, 160), messageId: clean(body.messageId, 200), body: clean(body.body, 2000), status: clean(body.status, 80), fromMe: body.fromMe === true, type: clean(body.type, 80), mediaUrl: clean(body.mediaUrl, 2000) });
      await logActivity(webhook.ownerId, `OpenWA: ${event}`, "whatsapp", undefined, details);
      return res.status(202).json({ accepted: true, event });
    } catch (error) {
      console.error("[OpenwaWebhook] request failed", error);
      return res.status(500).json({ error: "Unable to process OpenWA webhook" });
    }
  });
}
