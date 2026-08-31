import type { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import { getAppointmentByScheduleTaskUid, getOpenwaConfig, updateAppointment } from "../db";
import { openwaIntegration } from "./openwa";

export async function handleAppointmentReminder(req: Request, res: Response) {
  const context = { url: req.originalUrl, timestamp: new Date().toISOString() };
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const appointment = await getAppointmentByScheduleTaskUid(user.taskUid);
    if (!appointment) return res.json({ ok: true, skipped: "orphan" });
    if (!appointment.whatsappChatId || !appointment.whatsappSessionId || ["cancelled", "completed", "no_show"].includes(appointment.status) || appointment.reminderSentAt) {
      return res.json({ ok: true, skipped: "not-eligible", appointmentId: appointment.id });
    }
    const config = await getOpenwaConfig(appointment.ownerId);
    if (!config) return res.status(503).json({ error: "OpenWA não configurado", context });
    const start = appointment.startsAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    const text = `Lembrete: seu atendimento de ${appointment.service} está marcado para ${start} com ${appointment.professional}. Responda esta mensagem para confirmar ou solicitar outro horário.`;
    await openwaIntegration.sendText(config, appointment.whatsappSessionId, appointment.whatsappChatId, text);
    await updateAppointment(appointment.ownerId, appointment.id, { reminderSentAt: new Date() });
    return res.json({ ok: true, appointmentId: appointment.id, sent: true });
  } catch (error) {
    return res.status(500).json({ error: String(error), context });
  }
}
