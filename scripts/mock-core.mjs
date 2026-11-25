/**
 * Local dev API server (port 8080) sharing the exact same handlers as Vercel
 * serverless functions in /api/*.
 */
import http from "node:http";
import { sendJson } from "../api/_store.js";
import loginHandler from "../api/auth/login.js";
import registerHandler from "../api/auth/register.js";
import healthHandler from "../api/health.js";
import listingsHandler from "../api/listings.js";
import uploadHandler from "../api/media/upload.js";
import messagesHandler from "../api/messages.js";
import rankHandler from "../api/search/rank.js";

const PORT = Number(process.env.CORE_MOCK_PORT || 8080);

const ROUTES = {
  "/api/health": healthHandler,
  "/api/auth/login": loginHandler,
  "/api/auth/register": registerHandler,
  "/api/listings": listingsHandler,
  "/api/messages": messagesHandler,
  "/api/media/upload": uploadHandler,
  "/api/search/rank": rankHandler,
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const handler = ROUTES[url.pathname];
  if (handler) return handler(req, res);
  return sendJson(res, 404, { message: "Not found" });
});

server.listen(PORT, () => {
  console.log(`[core-api] listening on http://localhost:${PORT}`);
});
