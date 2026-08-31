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
