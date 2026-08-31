import { afterEach, describe, expect, it, vi } from "vitest";
import { openwaIntegration } from "./integrations/openwa";

const config = { baseUrl: "https://openwa.example.com", apiKey: "owa_test_api_key" };

afterEach(() => vi.restoreAllMocks());

describe("OpenWA integration transport", () => {
  it("sends the API key in X-API-Key and uses the documented health path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await openwaIntegration.health(config);

    expect(fetchMock).toHaveBeenCalledWith("https://openwa.example.com/api/health", expect.objectContaining({ headers: expect.objectContaining({ "X-API-Key": "owa_test_api_key" }) }));
  });

  it("rejects a non-HTTPS remote gateway", async () => {
    await expect(openwaIntegration.health({ ...config, baseUrl: "http://openwa.example.com" })).rejects.toThrow("HTTPS");
  });

  it("lists chats with a bounded window", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await openwaIntegration.listChats(config, "session-1");
    expect(fetchMock).toHaveBeenCalledWith("https://openwa.example.com/api/sessions/session-1/chats?limit=100&offset=0", expect.objectContaining({ headers: expect.objectContaining({ "X-API-Key": "owa_test_api_key" }) }));
  });

  it("loads history and marks a chat as read", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await openwaIntegration.getChatHistory(config, "session-1", "5511999999999@c.us");
    await openwaIntegration.markChatRead(config, "session-1", "5511999999999@c.us", ["m1"]);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://openwa.example.com/api/sessions/session-1/messages/5511999999999%40c.us/history", expect.anything());
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://openwa.example.com/api/sessions/session-1/chats/read", expect.objectContaining({ method: "POST", body: JSON.stringify({ chatId: "5511999999999@c.us", messageIds: ["m1"] }) }));
  });

  it("lists contacts with a bounded window", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await openwaIntegration.listContacts(config, "session-1");
    expect(fetchMock).toHaveBeenCalledWith("https://openwa.example.com/api/sessions/session-1/contacts?limit=100&offset=0", expect.anything());
  });

  it("sends image media with the documented payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "m2", timestamp: 2 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await openwaIntegration.sendImage(config, "session-1", { chatId: "5511999999999@c.us", base64: "aGVsbG8=", mimetype: "image/png", filename: "foto.png", caption: "Confira", quotedMessageId: "m1" });

    expect(fetchMock).toHaveBeenCalledWith("https://openwa.example.com/api/sessions/session-1/messages/send-image", expect.objectContaining({ method: "POST", body: JSON.stringify({ chatId: "5511999999999@c.us", base64: "aGVsbG8=", mimetype: "image/png", filename: "foto.png", caption: "Confira", quotedMessageId: "m1" }) }));
  });

  it("routes video, audio and document payloads to their documented endpoints", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "m3", timestamp: 3 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const payload = { chatId: "5511999999999@c.us", base64: "ZGF0YQ==", mimetype: "application/octet-stream", filename: "arquivo.bin" };
    await openwaIntegration.sendVideo(config, "session-1", { ...payload, mimetype: "video/mp4" });
    await openwaIntegration.sendAudio(config, "session-1", { ...payload, mimetype: "audio/ogg", ptt: false });
    await openwaIntegration.sendDocument(config, "session-1", payload);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://openwa.example.com/api/sessions/session-1/messages/send-video", expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://openwa.example.com/api/sessions/session-1/messages/send-audio", expect.objectContaining({ method: "POST" }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, "https://openwa.example.com/api/sessions/session-1/messages/send-document", expect.objectContaining({ method: "POST" }));
  });

  it("uses the session id and international chat id payload for text messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "m1", timestamp: 1 }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await openwaIntegration.sendText(config, "session-1", "5511999999999@c.us", "Olá");

    expect(fetchMock).toHaveBeenCalledWith("https://openwa.example.com/api/sessions/session-1/messages/send-text", expect.objectContaining({ method: "POST", body: JSON.stringify({ chatId: "5511999999999@c.us", text: "Olá" }) }));
  });
});
