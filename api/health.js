import { isSupabaseEnabled, sendJson } from "./_store.js";

export default function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);
  return sendJson(res, 200, {
    status: "ok",
    storage: isSupabaseEnabled() ? "supabase" : "local-json",
  });
}
