import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAppointment: vi.fn(),
  getAppointment: vi.fn(),
  getOpenwaConfig: vi.fn(),
  getWebhookBySecret: vi.fn(),
  updateAppointment: vi.fn(),
  sendText: vi.fn(),
}));

vi.mock("./db", () => ({
  createAppointment: mocks.createAppointment,
  getAppointment: mocks.getAppointment,
  getOpenwaConfig: mocks.getOpenwaConfig,
  getWebhookBySecret: mocks.getWebhookBySecret,
  updateAppointment: mocks.updateAppointment,
}));
vi.mock("./integrations/openwa", () => ({ openwaIntegration: { sendText: mocks.sendText } }));

import { registerAppointmentWebhook } from "./integrations/appointmentWebhook";

type Handler = (req: any, res: any) => Promise<unknown>;

function setup() {
  let handler: Handler | undefined;
  const app = { post: vi.fn((_path: string, route: Handler) => { handler = route; }) };
  registerAppointmentWebhook(app as any);
  if (!handler) throw new Error("appointment webhook handler was not registered");
  const payload = { statusCode: 200, body: undefined as unknown };
  const res = {
    status: vi.fn((code: number) => { payload.statusCode = code; return res; }),
    json: vi.fn((body: unknown) => { payload.body = body; return res; }),
  };
  return { handler, payload, res };
}

const appointment = {
  id: 7,
  ownerId: 42,
  patientName: "Cliente Altx",
  service: "Avaliação",
  professional: "Profissional",
  startsAt: new Date("2026-09-03T13:00:00.000Z"),
  endsAt: new Date("2026-09-03T14:00:00.000Z"),
  whatsappChatId: "5511999999999@c.us",
  whatsappSessionId: "session-main",
};

const webhook = { ownerId: 42, events: JSON.stringify(["appointment.reminder", "appointment.rescheduled"]) };

describe("appointment automation webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getWebhookBySecret.mockResolvedValue(webhook);
    mocks.getAppointment.mockResolvedValue(appointment);
    mocks.getOpenwaConfig.mockResolvedValue({ baseUrl: "https://openwa.example", apiKey: "secret" });
    mocks.sendText.mockResolvedValue({ messageId: "message-1" });
    mocks.updateAppointment.mockResolvedValue(undefined);
  });

  it("sends an authenticated reminder through the persisted WhatsApp session", async () => {
    const { handler, payload, res } = setup();
    await handler({ params: { secret: "webhook-secret" }, body: { event: "appointment.reminder", appointmentId: 7 } }, res);
    expect(payload.body).toEqual({ success: true, appointmentId: 7, sent: true });
    expect(mocks.sendText).toHaveBeenCalledWith(expect.anything(), "session-main", "5511999999999@c.us", expect.stringContaining("Lembrete"));
    expect(mocks.updateAppointment).toHaveBeenCalledWith(42, 7, { reminderSentAt: expect.any(Date), whatsappSessionId: "session-main" });
  });

  it("reschedules and communicates a new authenticated appointment time", async () => {
    const { handler, payload, res } = setup();
    const startsAt = "2026-09-05T15:00:00.000Z";
    const endsAt = "2026-09-05T16:00:00.000Z";
    await handler({ params: { secret: "webhook-secret" }, body: { event: "appointment.rescheduled", appointmentId: 7, startsAt, endsAt, message: "Novo horário confirmado." } }, res);
    expect(payload.body).toEqual({ success: true, appointmentId: 7, rescheduled: true });
    expect(mocks.updateAppointment).toHaveBeenCalledWith(42, 7, { startsAt: new Date(startsAt), endsAt: new Date(endsAt), status: "scheduled", whatsappSessionId: "session-main" });
    expect(mocks.sendText).toHaveBeenCalledWith(expect.anything(), "session-main", "5511999999999@c.us", "Novo horário confirmado.");
  });

  it("rejects an event that is not enabled in the webhook configuration", async () => {
    const { handler, payload, res } = setup();
    await handler({ params: { secret: "webhook-secret" }, body: { event: "appointment.reminder", appointmentId: 7 } }, res);
    mocks.getWebhookBySecret.mockResolvedValue({ ownerId: 42, events: JSON.stringify(["appointment.created"]) });
    await handler({ params: { secret: "webhook-secret" }, body: { event: "appointment.reminder", appointmentId: 7 } }, res);
    expect(payload.statusCode).toBe(422);
    expect(mocks.sendText).toHaveBeenCalledTimes(1);
  });
});
