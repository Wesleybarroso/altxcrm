type MailVpsConfig = { baseUrl: string; token: string };

function getMailVpsConfig(): MailVpsConfig | null {
  const baseUrl = process.env.VPS_MAIL_API_URL;
  const token = process.env.VPS_MAIL_API_TOKEN;
  if (!baseUrl || !token) return null;
  if (!baseUrl.startsWith("https://")) throw new Error("VPS_MAIL_API_URL must use HTTPS");
  return { baseUrl: baseUrl.replace(/\/$/, ""), token };
}

export async function mailVpsRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getMailVpsConfig();
  if (!config) throw new Error("VPS mail integration is not configured");
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`VPS mail API returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function checkMailVpsConnection() {
  const payload = await mailVpsRequest<{ status?: string; version?: string }>("/health");
  return { ok: true, status: payload.status ?? "ok", version: payload.version ?? null };
}

export const mailVpsIntegration = {
  listDomains: () => mailVpsRequest<unknown[]>("/v1/domains"),
  createDomain: (domain: string) => mailVpsRequest("/v1/domains", { method: "POST", body: JSON.stringify({ domain }) }),
  verifyDomain: (domain: string) => mailVpsRequest(`/v1/domains/${encodeURIComponent(domain)}/verify`, { method: "POST" }),
  removeDomain: (domain: string) => mailVpsRequest(`/v1/domains/${encodeURIComponent(domain)}`, { method: "DELETE" }),
  createMailbox: (input: { email: string; quotaGb: number }) => mailVpsRequest("/v1/mailboxes", { method: "POST", body: JSON.stringify(input) }),
  updateMailbox: (email: string, input: { quotaGb?: number; status?: "active" | "suspended" }) => mailVpsRequest(`/v1/mailboxes/${encodeURIComponent(email)}`, { method: "PATCH", body: JSON.stringify(input) }),
  removeMailbox: (email: string) => mailVpsRequest(`/v1/mailboxes/${encodeURIComponent(email)}`, { method: "DELETE" }),
  suspendMailbox: (email: string) => mailVpsRequest(`/v1/mailboxes/${encodeURIComponent(email)}/suspend`, { method: "POST" }),
  sendMessage: (input: { from: string; to: string[]; subject: string; body: string; scheduledAt?: number }) => mailVpsRequest("/v1/messages", { method: "POST", body: JSON.stringify(input) }),
};
