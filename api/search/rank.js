import { rankListings, readJson, sendJson } from "../_store.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, null);
  if (req.method !== "POST") return sendJson(res, 405, { message: "Method not allowed" });

  try {
    const body = await readJson(req);
    return sendJson(res, 200, rankListings(body.query, body.items));
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}
