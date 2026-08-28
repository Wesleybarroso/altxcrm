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

export const openwaIntegration = {
  health: (config: OpenwaConfig) => request<{ status: string }>(config, { path: "/health" }),
  listSessions: (config: OpenwaConfig) => request<OpenwaSession[]>(config, { path: "/sessions" }),
  createSession: (config: OpenwaConfig, name: string) => request<OpenwaSession>(config, { method: "POST", path: "/sessions", body: { name } }),
  startSession: (config: OpenwaConfig, sessionId: string) => request<OpenwaSession>(config, { method: "POST", path: `/sessions/${encodeURIComponent(sessionId)}/start` }),
  getSession: (config: OpenwaConfig, sessionId: string) => request<OpenwaSession>(config, { path: `/sessions/${encodeURIComponent(sessionId)}` }),
  getQr: (config: OpenwaConfig, sessionId: string) => request<{ qrCode: string; status: string }>(config, { path: `/sessions/${encodeURIComponent(sessionId)}/qr` }),
  sendText: (config: OpenwaConfig, sessionId: string, chatId: string, text: string) => request<{ messageId: string; timestamp: number }>(config, { method: "POST", path: `/sessions/${encodeURIComponent(sessionId)}/messages/send-text`, body: { chatId, text } }),
};
