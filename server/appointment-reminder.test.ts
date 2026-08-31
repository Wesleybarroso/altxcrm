import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getAppointmentByScheduleTaskUid: vi.fn(),
  getOpenwaConfig: vi.fn(),
  updateAppointment: vi.fn(),
  sendText: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./db", () => ({
  getAppointmentByScheduleTaskUid: mocks.getAppointmentByScheduleTaskUid,
  getOpenwaConfig: mocks.getOpenwaConfig,
  updateAppointment: mocks.updateAppointment,
}));
vi.mock("./integrations/openwa", () => ({ openwaIntegration: { sendText: mocks.sendText } }));

import { handleAppointmentReminder } from "./integrations/appointmentReminder";

function response() {
  const payload = { statusCode: 200, body: undefined as unknown };
  const res = {
    status: vi.fn((code: number) => { payload.statusCode = code; return res; }),
    json: vi.fn((body: unknown) => { payload.body = body; return res; }),
  };
  return { res, payload };
}

const appointment = {
  id: 7,
  ownerId: 42,
  patientName: "Cliente Teste",
  service: "Atendimento",
  professional: "Profissional",
  patientPhone: "5511999999999",
  whatsappChatId: "5511999999999@c.us",
  whatsappSessionId: "session-main",
  status: "scheduled",
  reminderSentAt: null,
  startsAt: new Date("2026-09-01T15:00:00.000Z"),
};

describe("appointment reminder heartbeat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-7" });
    mocks.getOpenwaConfig.mockResolvedValue({ baseUrl: "https://openwa.example", apiKey: "secret" });
    mocks.sendText.mockResolvedValue({ id: "message-1" });
    mocks.updateAppointment.mockResolvedValue(undefined);
  });

  it("rejects non-cron requests", async () => {
    mocks.authenticateRequest.mockResolvedValue({ isCron: false });
    const { res, payload } = response();
    await handleAppointmentReminder({ originalUrl: "/api/scheduled/appointment-reminder" } as any, res as any);
    expect(payload.statusCode).toBe(403);
    expect(mocks.getAppointmentByScheduleTaskUid).not.toHaveBeenCalled();
  });

  it("returns an idempotent orphan response", async () => {
    mocks.getAppointmentByScheduleTaskUid.mockResolvedValue(undefined);
    const { res, payload } = response();
    await handleAppointmentReminder({ originalUrl: "/api/scheduled/appointment-reminder" } as any, res as any);
    expect(payload.body).toEqual({ ok: true, skipped: "orphan" });
    expect(mocks.sendText).not.toHaveBeenCalled();
  });

  it("sends through the persisted WhatsApp session and records the timestamp", async () => {
    mocks.getAppointmentByScheduleTaskUid.mockResolvedValue(appointment);
    const { res, payload } = response();
    await handleAppointmentReminder({ originalUrl: "/api/scheduled/appointment-reminder" } as any, res as any);
    expect(payload.body).toEqual({ ok: true, appointmentId: 7, sent: true });
    expect(mocks.sendText).toHaveBeenCalledWith(expect.anything(), "session-main", "5511999999999@c.us", expect.stringContaining("Lembrete"));
    expect(mocks.updateAppointment).toHaveBeenCalledWith(42, 7, { reminderSentAt: expect.any(Date) });
  });

  it("skips an appointment whose reminder was already sent", async () => {
    mocks.getAppointmentByScheduleTaskUid.mockResolvedValue({ ...appointment, reminderSentAt: new Date() });
    const { res, payload } = response();
    await handleAppointmentReminder({ originalUrl: "/api/scheduled/appointment-reminder" } as any, res as any);
    expect(payload.body).toEqual({ ok: true, skipped: "not-eligible", appointmentId: 7 });
    expect(mocks.sendText).not.toHaveBeenCalled();
  });
});
