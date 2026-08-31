export type WhatsAppMediaKind = "image" | "video" | "audio" | "document";

export function getWhatsAppMediaKind(mimetype: string): WhatsAppMediaKind {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
}

export function isWhatsAppMediaSending(states: boolean[]): boolean {
  return states.some(Boolean);
}

export function getWhatsAppMediaSuccessLabel(kind: WhatsAppMediaKind): string {
  return kind === "image" ? "Imagem" : kind === "video" ? "Vídeo" : kind === "audio" ? "Áudio" : "Documento";
}

type WhatsAppActivity = { resourceType?: string; detail?: string | null };

export function isWhatsAppActivityForChat(activity: WhatsAppActivity, sessionId: string, chatId: string): boolean {
  if (activity.resourceType !== "whatsapp" || !activity.detail || !sessionId || !chatId) return false;
  try {
    const detail = JSON.parse(activity.detail) as { sessionId?: string; chatId?: string; event?: string };
    return detail.sessionId === sessionId && (!detail.chatId || detail.chatId === chatId) && Boolean(detail.event?.startsWith("message."));
  } catch {
    return false;
  }
}
