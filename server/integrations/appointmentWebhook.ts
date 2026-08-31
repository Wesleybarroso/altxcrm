import type { Express } from "express";
import { createAppointment, getWebhookBySecret, updateAppointment } from "../db";

const allowedEvents = new Set(["appointment.created", "appointment.confirmed", "appointment.updated", "appointment.cancelled"]);

type AppointmentWebhookBody = {
  event?: string;
  appointmentId?: number;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  service?: string;
  professional?: string;
  room?: string;
  startsAt?: string;
  endsAt?: string;
  status?: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  whatsappChatId?: string;
  notes?: string;
};

function isValidDate(value: unknown): value is string { return typeof value === "string" && !Number.isNaN(new Date(value).getTime()); }
function cleanString(value: unknown, max: number) { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max ? value.trim() : undefined; }

export function registerAppointmentWebhook(app: Express) {
  app.post("/api/automation/appointments/:secret", async (req, res) => {
    try {
      const secret = cleanString(req.params.secret, 255);
      if (!secret) return res.status(401).json({ error: "Invalid webhook secret" });
      const webhook = await getWebhookBySecret(secret);
      if (!webhook) return res.status(401).json({ error: "Invalid webhook secret" });
      const body = (req.body ?? {}) as AppointmentWebhookBody;
      const event = cleanString(body.event, 80) ?? "appointment.created";
      let configuredEvents: string[] = [];
      try { configuredEvents = JSON.parse(webhook.events) as string[]; } catch { configuredEvents = []; }
      if (!allowedEvents.has(event) || (configuredEvents.length > 0 && !configuredEvents.includes(event))) return res.status(422).json({ error: "Event is not enabled for this webhook" });

      if (event === "appointment.cancelled") {
        if (!Number.isInteger(body.appointmentId) || !body.appointmentId) return res.status(400).json({ error: "appointmentId is required" });
        await updateAppointment(webhook.ownerId, body.appointmentId, { status: "cancelled" });
        return res.status(200).json({ success: true, appointmentId: body.appointmentId, status: "cancelled" });
      }
      if (event === "appointment.confirmed") {
        if (!Number.isInteger(body.appointmentId) || !body.appointmentId) return res.status(400).json({ error: "appointmentId is required" });
        await updateAppointment(webhook.ownerId, body.appointmentId, { status: "confirmed" });
        return res.status(200).json({ success: true, appointmentId: body.appointmentId, status: "confirmed" });
      }
      if (event === "appointment.updated") {
        if (!Number.isInteger(body.appointmentId) || !body.appointmentId) return res.status(400).json({ error: "appointmentId is required" });
        const startsAt = isValidDate(body.startsAt) ? new Date(body.startsAt) : undefined;
        const endsAt = isValidDate(body.endsAt) ? new Date(body.endsAt) : undefined;
        await updateAppointment(webhook.ownerId, body.appointmentId, { patientName: cleanString(body.patientName, 160), patientPhone: cleanString(body.patientPhone, 40), patientEmail: cleanString(body.patientEmail, 320), service: cleanString(body.service, 160), professional: cleanString(body.professional, 160), room: cleanString(body.room, 80), startsAt, endsAt, status: body.status, notes: cleanString(body.notes, 5000) });
        return res.status(200).json({ success: true, appointmentId: body.appointmentId });
      }
      if (!cleanString(body.patientName, 160) || !cleanString(body.service, 160) || !cleanString(body.professional, 160) || !isValidDate(body.startsAt) || !isValidDate(body.endsAt)) return res.status(400).json({ error: "patientName, service, professional, startsAt and endsAt are required" });
      const startsAt = new Date(body.startsAt);
      const endsAt = new Date(body.endsAt);
      if (endsAt <= startsAt) return res.status(400).json({ error: "endsAt must be after startsAt" });
      const appointmentId = await createAppointment(webhook.ownerId, { patientName: body.patientName!, patientPhone: body.patientPhone, patientEmail: body.patientEmail, service: body.service!, professional: body.professional!, room: body.room, startsAt, endsAt, status: body.status, source: "whatsapp", whatsappChatId: body.whatsappChatId, notes: body.notes });
      return res.status(201).json({ success: true, appointmentId, status: body.status ?? "scheduled" });
    } catch (error) {
      console.error("[AppointmentWebhook] request failed", error);
      return res.status(500).json({ error: "Unable to process appointment webhook" });
    }
  });
}
