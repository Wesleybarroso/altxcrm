import type { Request, Response as ExpressResponse } from "express";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import {
  createEmailUser,
  createExternalUser,
  createPasswordResetToken,
  getPasswordResetToken,
  getUserByAuthAccount,
  getUserByEmail,
  linkAuthAccount,
  markPasswordResetTokenUsed,
  updateUserPassword,
} from "../db";
import { sendAuthEmail } from "./mailer";
import { createOpaqueToken, hashOpaqueToken, hashPassword, verifyPassword } from "./password";
import type { User } from "../../drizzle/schema";

export type SocialProvider = "google" | "github";

type SocialProfile = {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
};

const OAUTH_STATE_COOKIE = "altxcrm_social_oauth_state";
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function signInUser(res: ExpressResponse, user: User) {
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name || user.email || "Usuário",
    expiresInMs: ONE_YEAR_MS,
  });
  res.cookie(COOKIE_NAME, sessionToken, {
    ...getSessionCookieOptions(res.req),
    maxAge: ONE_YEAR_MS,
  });
  return { success: true } as const;
}

export async function registerWithEmail(res: ExpressResponse, input: { email: string; name: string; password: string }) {
  const email = normalizeEmail(input.email);
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Já existe uma conta com este e-mail");

  const passwordHash = await hashPassword(input.password);
  const user = await createEmailUser({ email, name: input.name, passwordHash });
  if (!user) throw new Error("Não foi possível criar a conta");
  await signInUser(res, user);
  return { success: true, user: { name: user.name, email: user.email } } as const;
}

export async function loginWithEmail(res: ExpressResponse, input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const user = await getUserByEmail(email);
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new Error("E-mail ou senha inválidos");
  }
  await signInUser(res, user);
  return { success: true } as const;
}

export function createSocialStateCookie(res: ExpressResponse, provider: SocialProvider, state: string) {
  res.cookie(OAUTH_STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: getSessionCookieOptions(res.req).secure,
    maxAge: 10 * 60 * 1000,
  });
}

export function readSocialState(req: Request, provider: SocialProvider, state: string | undefined) {
  if (!state) return false;
  const raw = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
  return raw === `${provider}:${state}`;
}

export function clearSocialStateCookie(res: ExpressResponse) {
  res.clearCookie(OAUTH_STATE_COOKIE, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: getSessionCookieOptions(res.req).secure,
    maxAge: -1,
  });
}

export function getPublicOrigin(req: Request) {
  const configured = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) {
    const url = new URL(configured);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("PUBLIC_APP_URL precisa usar HTTPS em produção");
    }
    return url.origin;
  }

  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0]?.trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] ?? "").split(",")[0]?.trim();
  const host = forwardedHost || req.headers.host || req.get("host");
  if (!host) throw new Error("PUBLIC_APP_URL or Host header is required");
  return `${forwardedProto || req.protocol || "http"}://${host}`;
}

export function getSocialAuthorizationUrl(provider: SocialProvider, req: Request, state: string) {
  const redirectUri = `${getPublicOrigin(req)}/api/auth/${provider}/callback`;
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("Google OAuth não configurado");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return url.toString();
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("GitHub OAuth não configurado");
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  return url.toString();
}

export async function completeSocialLogin(res: ExpressResponse, req: Request, provider: SocialProvider, code: string, state: string) {
  const profile = provider === "google"
    ? await getGoogleProfile(req, code, state)
    : await getGithubProfile(req, code, state);

  let user = await getUserByAuthAccount(provider, profile.providerAccountId);
  if (!user && profile.email && profile.emailVerified) user = await getUserByEmail(normalizeEmail(profile.email));
  if (!user) {
    user = await createExternalUser({
      provider,
      providerAccountId: profile.providerAccountId,
      email: profile.email && profile.emailVerified ? normalizeEmail(profile.email) : null,
      name: profile.name,
    });
  } else {
    await linkAuthAccount({ userId: user.id, provider, providerAccountId: profile.providerAccountId });
  }

  await signInUser(res, user);
}

export async function requestPasswordReset(req: Request, emailInput: string) {
  const email = normalizeEmail(emailInput);
  const user = await getUserByEmail(email);
  if (!user) return;

  const from = process.env.AUTH_FROM_EMAIL;
  if (!from) throw new Error("AUTH_FROM_EMAIL não configurado");

  const rawToken = createOpaqueToken();
  await createPasswordResetToken({
    userId: user.id,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const resetUrl = `${getPublicOrigin(req)}/?reset=${encodeURIComponent(rawToken)}`;
  await sendAuthEmail({
    from,
    to: email,
    subject: "Redefinição de senha — AltxCRM",
    text: `Olá${user.name ? `, ${user.name}` : ""}.\n\nUse o link abaixo para criar uma nova senha no AltxCRM. Ele expira em 30 minutos e pode ser usado uma única vez:\n\n${resetUrl}\n\nSe você não solicitou essa alteração, ignore esta mensagem.`,
  });
}

export async function resetPassword(input: { token: string; password: string }) {
  const record = await getPasswordResetToken(hashOpaqueToken(input.token));
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    throw new Error("O link de recuperação é inválido ou expirou");
  }
  const passwordHash = await hashPassword(input.password);
  await updateUserPassword(record.userId, passwordHash);
  await markPasswordResetTokenUsed(record.id);
}

async function getGoogleProfile(req: Request, code: string, state: string): Promise<SocialProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth não configurado");
  const redirectUri = `${getPublicOrigin(req)}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const token = await readJson<{ access_token?: string }>(tokenResponse, "Google token");
  if (!token.access_token) throw new Error("Google não retornou access_token");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = await readJson<{ sub?: string; email?: string; email_verified?: boolean; name?: string }>(profileResponse, "Google profile");
  if (!profile.sub) throw new Error("Google não retornou o identificador da conta");
  return { providerAccountId: profile.sub, email: profile.email ?? null, emailVerified: profile.email_verified === true, name: profile.name || profile.email || "Usuário Google" };
}

async function getGithubProfile(req: Request, code: string, state: string): Promise<SocialProfile> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GitHub OAuth não configurado");
  const redirectUri = `${getPublicOrigin(req)}/api/auth/github/callback`;
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, state }),
  });
  const token = await readJson<{ access_token?: string; error?: string }>(tokenResponse, "GitHub token");
  if (!token.access_token) throw new Error(token.error || "GitHub não retornou access_token");

  const headers = { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "AltxCRM" };
  const profileResponse = await fetch("https://api.github.com/user", { headers });
  const profile = await readJson<{ id?: number; login?: string; name?: string; email?: string | null }>(profileResponse, "GitHub profile");
  if (!profile.id) throw new Error("GitHub não retornou o identificador da conta");

  const emailsResponse = await fetch("https://api.github.com/user/emails", { headers });
  const emails = await readJson<Array<{ email?: string; primary?: boolean; verified?: boolean }>>(emailsResponse, "GitHub emails");
  const verifiedEmail = emails.find(item => item.primary && item.verified)?.email ?? emails.find(item => item.verified)?.email;
  const email = verifiedEmail ?? profile.email ?? null;
  return { providerAccountId: String(profile.id), email, emailVerified: Boolean(verifiedEmail), name: profile.name || profile.login || "Usuário GitHub" };
}

async function readJson<T>(response: globalThis.Response, label: string): Promise<T> {
  const body = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(`${label} retornou uma resposta inválida (${response.status})`);
  }
  if (!response.ok) {
    const message = typeof data === "object" && data && "error_description" in data ? String(data.error_description) : `${label} retornou ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

