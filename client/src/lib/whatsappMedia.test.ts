import { describe, expect, it } from "vitest";
import { getWhatsAppMediaKind, getWhatsAppMediaSuccessLabel, isWhatsAppActivityForChat, isWhatsAppMediaSending } from "./whatsappMedia";

describe("WhatsApp media composer helpers", () => {
  it("classifies image, video, audio and document attachments", () => {
    expect(getWhatsAppMediaKind("image/png")).toBe("image");
    expect(getWhatsAppMediaKind("video/mp4")).toBe("video");
    expect(getWhatsAppMediaKind("audio/ogg")).toBe("audio");
    expect(getWhatsAppMediaKind("application/pdf")).toBe("document");
  });

  it("maps each media kind to a success label", () => {
    expect(getWhatsAppMediaSuccessLabel("image")).toBe("Imagem");
    expect(getWhatsAppMediaSuccessLabel("video")).toBe("Vídeo");
    expect(getWhatsAppMediaSuccessLabel("audio")).toBe("Áudio");
    expect(getWhatsAppMediaSuccessLabel("document")).toBe("Documento");
  });

  it("reports loading while any media mutation is pending", () => {
    expect(isWhatsAppMediaSending([false, false, false, false])).toBe(false);
    expect(isWhatsAppMediaSending([false, true, false, false])).toBe(true);
    expect(isWhatsAppMediaSending([false, false, true, false])).toBe(true);
  });

  it("matches only message events from the active WhatsApp chat", () => {
    const activity = { resourceType: "whatsapp", detail: JSON.stringify({ event: "message.received", sessionId: "session-main", chatId: "5511999999999@c.us" }) };
    expect(isWhatsAppActivityForChat(activity, "session-main", "5511999999999@c.us")).toBe(true);
    expect(isWhatsAppActivityForChat(activity, "session-main", "5511888888888@c.us")).toBe(false);
    expect(isWhatsAppActivityForChat({ ...activity, detail: "not-json" }, "session-main", "5511999999999@c.us")).toBe(false);
    expect(isWhatsAppActivityForChat({ resourceType: "system", detail: activity.detail }, "session-main", "5511999999999@c.us")).toBe(false);
  });
});
