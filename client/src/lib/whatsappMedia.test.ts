import { describe, expect, it } from "vitest";
import { getWhatsAppMediaKind, getWhatsAppMediaSuccessLabel, isWhatsAppMediaSending } from "./whatsappMedia";

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
});
