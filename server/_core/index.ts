import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { completeSocialLogin, clearSocialStateCookie, createSocialStateCookie, getSocialAuthorizationUrl, readSocialState, type SocialProvider } from "../auth/service";
import { createOpaqueToken } from "../auth/password";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerAppointmentWebhook } from "../integrations/appointmentWebhook";
import { registerOpenwaWebhook } from "../integrations/openwaWebhook";
import { handleAppointmentReminder } from "../integrations/appointmentReminder";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

const SOCIAL_PROVIDERS: SocialProvider[] = ["google", "github"];

function registerSocialAuthRoutes(app: express.Express) {
  for (const provider of SOCIAL_PROVIDERS) {
    app.get(`/api/auth/${provider}`, (req, res) => {
      try {
        const state = createOpaqueToken();
        createSocialStateCookie(res, provider, state);
        res.redirect(getSocialAuthorizationUrl(provider, req, state));
      } catch (error) {
        console.error(`[Auth] Failed to start ${provider} OAuth`, error);
        res.redirect(`/?authError=${encodeURIComponent(error instanceof Error ? error.message : "OAuth indisponível")}`);
      }
    });

    app.get(`/api/auth/${provider}/callback`, async (req, res) => {
      const code = typeof req.query.code === "string" ? req.query.code : undefined;
      const state = typeof req.query.state === "string" ? req.query.state : undefined;
      if (!code || !state || !readSocialState(req, provider, state)) {
        clearSocialStateCookie(res);
        res.redirect(`/?authError=${encodeURIComponent("Não foi possível validar o retorno do provedor de login")}`);
        return;
      }

      try {
        await completeSocialLogin(res, req, provider, code, state);
        clearSocialStateCookie(res);
        res.redirect("/");
      } catch (error) {
        clearSocialStateCookie(res);
        console.error(`[Auth] ${provider} OAuth callback failed`, error);
        res.redirect(`/?authError=${encodeURIComponent(error instanceof Error ? error.message : "Falha no login social")}`);
      }
    });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  registerSocialAuthRoutes(app);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerAppointmentWebhook(app);
  registerOpenwaWebhook(app);
  app.post("/api/scheduled/appointment-reminder", handleAppointmentReminder);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
