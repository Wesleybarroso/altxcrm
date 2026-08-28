import { createHmac } from "node:crypto";

export async function deliverWebhookTest(input: { url: string; secret: string; events: string[] }) {
  if (!input.url.startsWith("https://")) throw new Error("Webhook deve usar HTTPS");
  const payload = { event: "integration.test", version: "2026-08-28", source: "altxcrm", events: input.events, sentAt: new Date().toISOString() };
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", input.secret).update(body).digest("hex");
  const response = await fetch(input.url, { method: "POST", headers: { "Content-Type": "application/json", "X-Altx-Event": "integration.test", "X-Altx-Signature": `sha256=${signature}` }, body });
  if (!response.ok) throw new Error(`Webhook respondeu com HTTP ${response.status}`);
  return { success: true as const, status: response.status };
}
