type OpenwaConfig = { baseUrl: string; apiKey: string };

type OpenwaRequestOptions = { method?: "GET" | "POST"; path: string; body?: unknown };

function assertSafeBaseUrl(baseUrl: string) {
  if (!/^https:\/\//i.test(baseUrl) && !/^http:\/\/localhost(?::\d+)?$/i.test(baseUrl)) throw new Error("OpenWA URL must use HTTPS");
}

async function request<T>(config: OpenwaConfig, options: OpenwaRequestOptions): Promise<T> {
  assertSafeBaseUrl(config.baseUrl);
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/api${options.path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json", "X-API-Key": config.apiKey },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`OpenWA request failed (${response.status})`);
  return payload as T;
}

export type OpenwaSession = { id: string; name: string; status: string; phone?: string; pushName?: string };
export type OpenwaChat = { id: string; name?: string; unreadCount?: number; isGroup?: boolean; lastMessage?: { body?: string; timestamp?: number; fromMe?: boolean; type?: string } | null };
export type OpenwaMessage = { id: string; chatId?: string; body?: string; from?: string; fromMe?: boolean; type?: string; timestamp?: number; hasMedia?: boolean; mediaUrl?: string };
export type OpenwaContact = { id: string; name?: string; pushName?: string; number?: string; isBusiness?: boolean };

export const openwaIntegration = {
  health: (config: OpenwaConfig) => request<{ status: string }>(config, { path: "/health" }),
  listSessions: (config: OpenwaConfig) => request<OpenwaSession[]>(config, { path: "/sessions" }),
  createSession: (config: OpenwaConfig, name: string) => request<OpenwaSession>(config, { method: "POST", path: "/sessions", body: { name } }),
  startSession: (config: OpenwaConfig, sessionId: string) => request<OpenwaSession>(config, { method: "POST", path: `/sessions/${encodeURIComponent(sessionId)}/start` }),
  getSession: (config: OpenwaConfig, sessionId: string) => request<OpenwaSession>(config, { path: `/sessions/${encodeURIComponent(sessionId)}` }),
  getQr: (config: OpenwaConfig, sessionId: string) => request<{ qrCode: string; status: string }>(config, { path: `/sessions/${encodeURIComponent(sessionId)}/qr` }),
  sendText: (config: OpenwaConfig, sessionId: string, chatId: string, text: string) => request<{ messageId: string; timestamp: number }>(config, { method: "POST", path: `/sessions/${encodeURIComponent(sessionId)}/messages/send-text`, body: { chatId, text } }),
  reply: (config: OpenwaConfig, sessionId: string, chatId: string, messageId: string, text: string) => request<{ messageId: string; timestamp: number }>(config, { method: "POST", path: `/sessions/${encodeURIComponent(sessionId)}/messages/reply`, body: { chatId, messageId, text } }),
  listChats: (config: OpenwaConfig, sessionId: string) => request<OpenwaChat[]>(config, { path: `/sessions/${encodeURIComponent(sessionId)}/chats?limit=100&offset=0` }),
  getChatHistory: (config: OpenwaConfig, sessionId: string, chatId: string) => request<OpenwaMessage[]>(config, { path: `/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(chatId)}/history` }),
  markChatRead: (config: OpenwaConfig, sessionId: string, chatId: string, messageIds?: string[]) => request<{ success: boolean }>(config, { method: "POST", path: `/sessions/${encodeURIComponent(sessionId)}/chats/read`, body: { chatId, ...(messageIds?.length ? { messageIds } : {}) } }),
  listContacts: (config: OpenwaConfig, sessionId: string) => request<OpenwaContact[]>(config, { path: `/sessions/${encodeURIComponent(sessionId)}/contacts?limit=100&offset=0` }),
};
